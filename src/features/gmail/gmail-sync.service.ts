import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { google, gmail_v1 } from 'googleapis';
import { User } from '../../database/entities/user.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { TransactionWallet } from '../../database/entities/transaction-wallet.entity';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { GmailTokenService } from './gmail-token.service';
import {
  BaseBankParser,
  ParsedTransaction,
  ParserInput,
  GopayParser,
  OvoParser,
  DanaParser,
  BcaParser,
  MandiriParser,
  BniParser,
  BriParser,
  SeabankParser,
  JagoParser,
  GenericBankParser,
} from './parsers';

export interface SyncResult {
  userId: number;
  imported: number; // berhasil disimpan ke DB
  skipped: number; // sudah ada di DB (duplikat)
  failed: number; // error saat proses
  lastSyncAt: Date; // timestamp sync ini selesai
}

// Sesuai seeder kamu: Income=1, Expense=2, Transfer=3
const TRANSACTION_TYPE_ID: Record<string, number> = {
  income: 1,
  expense: 2,
  transfer: 3,
};

// Query Gmail untuk mencari email dari bank/ewallet yang didukung
const GMAIL_SENDER_QUERY = [
  'from:noreply@gopay.co.id',
  'from:no-reply@ovo.id',
  'from:noreply@dana.id',
  'from:notifikasi@klikbca.com',
  'from:noreply@mybca.com',
  'from:notif@bankmandiri.co.id',
  'from:livin@bankmandiri.co.id',
  'from:bni@bni.co.id',
  'from:noreply@bni.co.id',
  'from:noreply@bri.co.id',
  'from:noreply@seabank.co.id',
  'from:noreply@jago.com',
  'from:hello@jago.com',
  // Keyword fallback untuk bank lain yang tidak ada parser spesifiknya
  'subject:transaksi',
  'subject:pembayaran berhasil',
  'subject:transfer berhasil',
].join(' OR ');

@Injectable()
export class GmailSyncService {
  private readonly logger = new Logger(GmailSyncService.name);
  private readonly parsers: BaseBankParser[];

  constructor(
    private readonly dataSource: DataSource,
    private readonly tokenService: GmailTokenService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,

    @InjectRepository(TransactionCategory)
    private readonly categoryRepo: Repository<TransactionCategory>,

    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,

    // Parser per bank — diinject oleh NestJS DI
    gopayParser: GopayParser,
    ovoParser: OvoParser,
    danaParser: DanaParser,
    bcaParser: BcaParser,
    mandiriParser: MandiriParser,
    bniParser: BniParser,
    briParser: BriParser,
    seabankParser: SeabankParser,
    jagoParser: JagoParser,
    private readonly genericParser: GenericBankParser,
  ) {
    // Urutan: spesifik dulu, generic terakhir
    this.parsers = [
      gopayParser,
      ovoParser,
      danaParser,
      bcaParser,
      mandiriParser,
      bniParser,
      briParser,
      seabankParser,
      jagoParser,
    ];
  }

  // ─── PUBLIC: Dipanggil scheduler setiap jam 00:00 ─────────────────────
  async syncAllUsers(): Promise<void> {
    /**
     * Kenapa pakai QueryBuilder bukan findAll?
     * Karena googleRefreshToken punya select: false di entity,
     * kita harus explicit select kolom itu.
     * findAll biasa tidak akan include kolom select: false.
     */
    const users = await this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.googleRefreshToken',
        'user.gmailLastSyncAt',
      ])
      .where('user.googleRefreshToken IS NOT NULL')
      .getMany();

    this.logger.log(
      `[Scheduler] Syncing ${users.length} users with Gmail access`,
    );

    for (const user of users) {
      try {
        const result = await this.syncViaRefreshToken(user);
        this.logger.log(
          `[Scheduler] User ${user.id}: +${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`,
        );
      } catch (err) {
        // Jangan stop loop — kalau satu user gagal, lanjut ke berikutnya
        this.logger.error(
          `[Scheduler] Failed for user ${user.id}: ${err.message}`,
        );
      }
    }
  }

  // ─── PUBLIC: Dipanggil controller saat user klik tombol sync ──────────
  async syncManual(userId: number, accessToken: string): Promise<SyncResult> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.gmailLastSyncAt'])
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) throw new Error('User not found');

    return this.runSync(user, accessToken, 'gmail_manual');
  }

  // ─── PUBLIC: Info sync untuk ditampilkan di FE ─────────────────────────
  async getSyncStatus(userId: number): Promise<{
    lastSyncAt: Date | null;
    hasGmailAccess: boolean;
  }> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.gmailLastSyncAt', 'user.googleRefreshToken'])
      .where('user.id = :id', { id: userId })
      .getOne();

    return {
      lastSyncAt: user?.gmailLastSyncAt ?? null,
      // hasGmailAccess = true kalau punya refresh token di DB
      hasGmailAccess: !!user?.googleRefreshToken,
    };
  }

  // ─── PRIVATE: Sync menggunakan refreshToken (untuk scheduler) ─────────
  private async syncViaRefreshToken(user: User): Promise<SyncResult> {
    // Ambil access token baru menggunakan refresh token
    // GmailTokenService handle caching dan error "invalid_grant"
    const accessToken = await this.tokenService.getAccessToken(
      user.id,
      user.googleRefreshToken!,
    );
    return this.runSync(user, accessToken, 'gmail_scheduler');
  }

  // ─── PRIVATE: Core sync logic — dipakai scheduler & manual ───────────
  private async runSync(
    user: User,
    accessToken: string,
    importSource: 'gmail_scheduler' | 'gmail_manual',
  ): Promise<SyncResult> {
    const syncStart = new Date();

    /**
     * Tentukan window waktu untuk fetch email:
     *
     * Kasus 1: Belum pernah sync (gmailLastSyncAt = null)
     *   → Ambil dari awal hari ini (00:00)
     *   → Tidak mau import email lama yang tidak relevan
     *
     * Kasus 2: Sudah pernah sync
     *   → Ambil dari lastSyncAt sampai sekarang
     *   → Ini yang bikin "sync jam 12:00, klik lagi jam 13:00
     *      → hanya ambil email 12:00–13:00"
     */
    const fromDate = user.gmailLastSyncAt ?? this.getStartOfToday();

    this.logger.log(
      `[Sync] User ${user.id} | from: ${fromDate.toISOString()} | to: ${syncStart.toISOString()} | source: ${importSource}`,
    );

    const gmail = this.buildGmailClient(accessToken);
    const messageIds = await this.fetchMessageIds(gmail, fromDate, syncStart);

    this.logger.log(
      `[Sync] User ${user.id} found ${messageIds.length} candidate emails`,
    );

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    // Proses per batch 10 — tidak mau overload memory atau Gmail API rate limit
    const BATCH_SIZE = 10;
    for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
      const batch = messageIds.slice(i, i + BATCH_SIZE);

      /**
       * Promise.allSettled vs Promise.all:
       * - Promise.all → berhenti dan throw kalau ada SATU yang error
       * - Promise.allSettled → proses semua, kumpulkan hasil (sukses/gagal)
       * Kita pakai allSettled supaya satu email yang error tidak menghentikan
       * proses email lainnya dalam batch yang sama.
       */
      const results = await Promise.allSettled(
        batch.map((id) =>
          this.processOneMessage(gmail, id, user, importSource),
        ),
      );

      for (const result of results) {
        if (result.status === 'rejected') {
          failed++;
          this.logger.warn(`[Sync] Message failed: ${result.reason}`);
        } else if (result.value === 'imported') {
          imported++;
        } else if (result.value === 'duplicate') {
          skipped++;
        }
        // 'unparseable' = bukan email transaksi, tidak dihitung sebagai error
      }
    }

    // Update lastSyncAt ke waktu MULAI sync (bukan selesai)
    // Kenapa syncStart bukan Date.now()?
    // Supaya kalau ada email yang masuk tepat saat sync berjalan,
    // email itu tidak terlewat di sync berikutnya
    await this.userRepo.update(user.id, { gmailLastSyncAt: syncStart });

    return {
      userId: user.id,
      imported,
      skipped,
      failed,
      lastSyncAt: syncStart,
    };
  }

  // ─── PRIVATE: Proses satu email ───────────────────────────────────────
  private async processOneMessage(
    gmail: gmail_v1.Gmail,
    messageId: string,
    user: User,
    importSource: 'gmail_scheduler' | 'gmail_manual',
  ): Promise<'imported' | 'duplicate' | 'unparseable'> {
    const externalRef = `gmail_${messageId}`;

    /**
     * Cek duplikat DULU sebelum fetch full message body.
     * Ini penting untuk efisiensi — fetch full message butuh 1 API call,
     * sedangkan query DB jauh lebih cepat.
     *
     * Kalau sudah ada → langsung return 'duplicate' tanpa buang API quota.
     */
    const exists = await this.transactionRepo.findOne({
      where: { externalRef, user: { id: user.id } },
      select: ['id'],
    });
    if (exists) return 'duplicate';

    // Fetch isi email lengkap dari Gmail API
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const input = this.extractParserInput(msg.data);
    const parsed = this.parseEmail(input);
    if (!parsed) return 'unparseable';

    // Simpan ke DB
    await this.saveTransaction(parsed, user, externalRef, importSource);
    return 'imported';
  }

  // ─── PRIVATE: Routing ke parser yang tepat ────────────────────────────
  private parseEmail(input: ParserInput): ParsedTransaction | null {
    // Cari parser spesifik berdasarkan alamat pengirim
    const parser = this.parsers.find((p) => p.canParse(input.from));
    if (parser) return parser.parse(input);

    // Tidak ada parser spesifik → coba generic fallback
    return this.genericParser.tryParseFallback(input);
  }

  // ─── PRIVATE: Simpan transaksi ke DB ─────────────────────────────────
  private async saveTransaction(
    parsed: ParsedTransaction,
    user: User,
    externalRef: string,
    importSource: 'gmail_scheduler' | 'gmail_manual',
  ): Promise<void> {
    const typeId = TRANSACTION_TYPE_ID[parsed.transactionType];

    // Cari default category untuk tipe transaksi ini milik user
    // Ambil category pertama yang ditemukan untuk tipe tersebut
    const category = await this.categoryRepo.findOne({
      where: {
        user: { id: user.id },
        transactionType: { id: typeId },
      },
    });

    // Ambil wallet pertama user (yang dibuat saat signup = "Cash")
    const wallet = await this.walletRepo.findOne({
      where: { user: { id: user.id } },
      order: { createdAt: 'ASC' },
    });

    if (!category || !wallet) {
      throw new Error(
        `Default category or wallet not found for user ${user.id}`,
      );
    }

    // Pakai QueryRunner untuk atomicity — kalau salah satu gagal, semua rollback
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Simpan transaksi utama
      const transaction = queryRunner.manager.create(Transaction, {
        amount: parsed.amount,
        adminFee: 0,
        externalRef,
        importSource,
        // createdAt di-set ke tanggal email, bukan tanggal import
        // Supaya transaksi muncul di tanggal yang benar di timeline
        createdAt: new Date(parsed.date),
        user: { id: user.id },
        transactionType: { id: typeId },
        transactionCategory: { id: category.id },
      });
      const savedTx = await queryRunner.manager.save(Transaction, transaction);

      // 2. Simpan transaction wallet (relasi transaksi ↔ wallet)
      const isIncoming = parsed.transactionType === 'income';
      const tw = queryRunner.manager.create(TransactionWallet, {
        transaction: savedTx,
        wallet: { id: wallet.id },
        isIncoming,
        amount: parsed.amount,
      });
      await queryRunner.manager.save(TransactionWallet, tw);

      // 3. Update balance wallet
      // Income (+) → balance bertambah
      // Expense (-) → balance berkurang
      // Transfer → kita tidak update karena tidak tahu target wallet
      if (parsed.transactionType !== 'transfer') {
        const delta = isIncoming ? parsed.amount : -parsed.amount;
        await queryRunner.manager
          .createQueryBuilder()
          .update(Wallet)
          .set({ balance: () => `balance + ${delta}` })
          .where('id = :id', { id: wallet.id })
          .execute();
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── PRIVATE: Helpers ─────────────────────────────────────────────────

  private buildGmailClient(accessToken: string): gmail_v1.Gmail {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    auth.setCredentials({ access_token: accessToken });
    return google.gmail({ version: 'v1', auth });
  }

  private getStartOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private async fetchMessageIds(
    gmail: gmail_v1.Gmail,
    from: Date,
    to: Date,
  ): Promise<string[]> {
    // Gmail pakai Unix timestamp dalam detik (bukan milidetik seperti JS)
    const afterSec = Math.floor(from.getTime() / 1000);
    const beforeSec = Math.floor(to.getTime() / 1000);
    const query = `after:${afterSec} before:${beforeSec} (${GMAIL_SENDER_QUERY})`;

    const ids: string[] = [];
    let pageToken: string | undefined;

    do {
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
        pageToken,
      });

      const messages = res.data.messages ?? [];
      ids.push(...messages.map((m) => m.id!).filter(Boolean));
      pageToken = res.data.nextPageToken ?? undefined;

      // Batasi maksimal 200 email per sync cycle untuk keamanan
    } while (pageToken && ids.length < 200);

    return ids;
  }

  private extractParserInput(msgData: gmail_v1.Schema$Message): ParserInput {
    const headers = msgData.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value ?? '';

    return {
      subject: getHeader('Subject'),
      from: getHeader('From'),
      date: getHeader('Date'),
      body: this.extractBody(msgData.payload),
      snippet: msgData.snippet ?? '',
    };
  }

  private extractBody(
    payload: gmail_v1.Schema$MessagePart | undefined,
  ): string {
    if (!payload) return '';

    // Body langsung (email simple, bukan multipart)
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    }

    if (payload.parts) {
      // Prioritas 1: Plain text — lebih mudah di-parse daripada HTML
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64url').toString('utf-8');
        }
      }
      // Prioritas 2: HTML — strip semua tag, ambil teksnya
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = Buffer.from(part.body.data, 'base64url').toString(
            'utf-8',
          );
          return html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
      // Prioritas 3: Nested multipart (rekursif)
      for (const part of payload.parts) {
        if (part.mimeType?.startsWith('multipart/')) {
          const nested = this.extractBody(part);
          if (nested) return nested;
        }
      }
    }

    return '';
  }
}
