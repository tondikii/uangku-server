import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../../database/entities/user.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { comparePassword, hashPassword } from '../../common/utils/bcrypt.util';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { JwtService } from '@nestjs/jwt';
import TRANSACTION_CATEGORIES from '../../common/constants/transaction-categories.constant';
import { GoogleSignInDto } from './dto/google-sign-in.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly jwtService: JwtService,
    private readonly httpService: HttpService, // ← BARU
  ) {}

  // ─── PRIVATE HELPER ───────────────────────────────────────────────────────
  /**
   * Menukar serverAuthCode dari Google Sign In SDK menjadi refreshToken.
   *
   * Kenapa ini dilakukan di BE bukan FE?
   * Karena proses penukaran butuh GOOGLE_CLIENT_SECRET yang tidak boleh
   * ada di dalam app bundle mobile (bisa diekstrak oleh attacker).
   *
   * serverAuthCode = kode satu kali dari Google, hanya bisa dipakai sekali.
   * refreshToken   = token jangka panjang, bisa dipakai berulang kali.
   *
   * Catatan penting: Google hanya mengembalikan refresh_token pada
   * OTORISASI PERTAMA. Kalau user sudah pernah login sebelumnya,
   * Google tidak kirim refresh_token lagi kecuali user revoke dulu aksesnya
   * di https://myaccount.google.com/permissions
   */
  private async exchangeCodeForRefreshToken(
    serverAuthCode: string,
  ): Promise<string | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post('https://oauth2.googleapis.com/token', {
          code: serverAuthCode,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: 'https://auth.expo.io/@tondikiandika/uangku',
          grant_type: 'authorization_code',
        }),
      );

      if (!data.refresh_token) {
        this.logger.warn(
          `No refresh_token in Google response for exchange. ` +
            `User may have authorized before. ` +
            `They need to revoke at myaccount.google.com/permissions to get new token.`,
        );
        return null;
      }

      return data.refresh_token as string;
    } catch (err) {
      // Non-fatal: user tetap bisa login, hanya fitur Gmail sync tidak aktif
      this.logger.error(
        'Failed to exchange serverAuthCode → refreshToken',
        err?.response?.data ?? err?.message,
      );
      return null;
    }
  }

  // ─── SIGN UP (tidak ada perubahan) ───────────────────────────────────────
  async signUp(dto: SignUpDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(User, {
        where: { email: dto.email },
      });
      if (existing) throw new BadRequestException('Email already in use');

      const hashed = await hashPassword(dto.password);
      const newUser = queryRunner.manager.create(User, {
        ...dto,
        password: hashed,
      });
      const savedUser = await queryRunner.manager.save(User, newUser);

      const wallet = queryRunner.manager.create(Wallet, {
        name: 'Cash',
        user: savedUser,
      });
      await queryRunner.manager.save(Wallet, wallet);

      const categories = TRANSACTION_CATEGORIES.map((c) =>
        queryRunner.manager.create(TransactionCategory, {
          ...c,
          user: savedUser,
        }),
      );
      await queryRunner.manager.save(TransactionCategory, categories);

      await queryRunner.commitTransaction();
      delete savedUser.password;
      return { user: savedUser };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Something went wrong during sign up',
      );
    } finally {
      await queryRunner.release();
    }
  }

  // ─── SIGN IN (tidak ada perubahan) ───────────────────────────────────────
  async signIn(dto: SignInDto): Promise<{ user: User; accessToken: string }> {
    try {
      const user = await this.userRepo.findOne({ where: { email: dto.email } });
      if (!user) throw new UnauthorizedException('Invalid email or password');

      const isMatch = await comparePassword(dto.password, user.password);
      if (!isMatch)
        throw new UnauthorizedException('Invalid email or password');

      const payload: JwtPayload = { id: user.id, email: user.email };
      const accessToken = await this.jwtService.signAsync(payload);
      delete user.password;
      return { user, accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException(
        'Something went wrong during sign in',
      );
    }
  }

  // ─── GOOGLE SIGN IN (diupdate) ────────────────────────────────────────────
  async googleSignIn(
    dto: GoogleSignInDto,
  ): Promise<{ user: User; accessToken: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let user = await queryRunner.manager.findOne(User, {
        where: { email: dto.email },
      });

      // Coba tukar serverAuthCode → refreshToken jika FE mengirimkannya
      // Ini akan null kalau:
      // 1. FE tidak kirim serverAuthCode
      // 2. Penukaran gagal (network error, dll)
      // 3. Google tidak kembalikan refresh_token (sudah pernah otorisasi)
      let refreshToken: string | null = null;
      if (dto.serverAuthCode) {
        refreshToken = await this.exchangeCodeForRefreshToken(
          dto.serverAuthCode,
        );
      }

      if (!user) {
        // ── User baru: buat akun lengkap ──────────────────────────────
        if (!dto.name) {
          throw new BadRequestException(
            'Name is required for new users signing in with Google',
          );
        }

        const randomPassword = randomBytes(32).toString('hex');
        const hashed = await hashPassword(randomPassword);

        const newUser = queryRunner.manager.create(User, {
          email: dto.email,
          password: hashed,
          name: dto.name,
          avatar: dto.avatar,
          googleRefreshToken: refreshToken, // simpan jika berhasil dapat
        });
        user = await queryRunner.manager.save(User, newUser);

        const wallet = queryRunner.manager.create(Wallet, {
          name: 'Cash',
          user,
        });
        await queryRunner.manager.save(Wallet, wallet);

        const categories = TRANSACTION_CATEGORIES.map((c) =>
          queryRunner.manager.create(TransactionCategory, { ...c, user }),
        );
        await queryRunner.manager.save(TransactionCategory, categories);
      } else {
        // ── User lama: update refreshToken jika dapat yang baru ───────
        // Ini handle kasus refresh token expired (testing mode = 7 hari)
        // User re-login → dapat serverAuthCode baru → refreshToken baru
        if (refreshToken) {
          await queryRunner.manager.update(User, user.id, {
            googleRefreshToken: refreshToken,
            // Update avatar juga jika berubah
            ...(dto.avatar && { avatar: dto.avatar }),
          });
          this.logger.log(
            `Updated googleRefreshToken for user ${user.id} (${user.email})`,
          );
        }
      }

      await queryRunner.commitTransaction();

      const payload: JwtPayload = { id: user.id, email: user.email };
      const accessToken = await this.jwtService.signAsync(payload);
      if (user.password) delete user.password;

      return { user, accessToken };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Google Sign-In failed');
    } finally {
      await queryRunner.release();
    }
  }
}
