import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { User } from '../../database/entities/user.entity';

interface CachedToken {
  accessToken: string;
  expiresAt: Date;
}

@Injectable()
export class GmailTokenService {
  private readonly logger = new Logger(GmailTokenService.name);

  /**
   * Cache access token per userId di memory.
   *
   * Kenapa di-cache?
   * Access token Google valid ~1 jam. Saat scheduler proses 50 email
   * untuk satu user, kita tidak mau hit Google token endpoint 50 kali.
   * Cache ini menyimpan token sampai hampir expired (60 detik buffer).
   *
   * Keterbatasan: cache hilang saat server restart → fine untuk MVP.
   * Production: gunakan Redis.
   */
  private readonly tokenCache = new Map<number, CachedToken>();

  constructor(
    private readonly httpService: HttpService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getAccessToken(userId: number, refreshToken: string): Promise<string> {
    // Cek cache dulu
    const cached = this.tokenCache.get(userId);
    if (cached && cached.expiresAt > new Date()) {
      return cached.accessToken;
    }

    // Minta access token baru ke Google
    try {
      const { data } = await firstValueFrom(
        this.httpService.post('https://oauth2.googleapis.com/token', {
          refresh_token: refreshToken,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          grant_type: 'refresh_token',
        }),
      );

      // expires_in biasanya 3600 detik, kurangi 60 detik sebagai buffer
      const expiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
      this.tokenCache.set(userId, {
        accessToken: data.access_token,
        expiresAt,
      });

      return data.access_token as string;
    } catch (err) {
      const errorCode = err?.response?.data?.error;

      if (errorCode === 'invalid_grant') {
        /**
         * Refresh token expired atau dicabut user.
         *
         * Penyebab umum:
         * 1. Testing mode di Google Cloud → token expired setelah 7 hari
         * 2. User manually revoke akses di Google Account settings
         * 3. User ganti password Google
         *
         * Solusi: Hapus token dari DB → scheduler skip user ini →
         * user perlu login ulang untuk dapat token baru
         */
        this.logger.warn(
          `[Token] Refresh token expired or revoked for user ${userId}. Clearing.`,
        );
        await this.userRepo.update(userId, { googleRefreshToken: null });
        this.tokenCache.delete(userId);
        throw new Error('GMAIL_TOKEN_EXPIRED');
      }

      this.logger.error(
        `[Token] Failed to get access token for user ${userId}`,
        err?.response?.data ?? err?.message,
      );
      throw new Error(`Cannot get Google access token for user ${userId}`);
    }
  }

  clearCache(userId: number): void {
    this.tokenCache.delete(userId);
  }
}
