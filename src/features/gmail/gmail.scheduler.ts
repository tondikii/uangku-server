import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GmailSyncService } from './gmail-sync.service';

@Injectable()
export class GmailScheduler {
  private readonly logger = new Logger(GmailScheduler.name);

  constructor(private readonly gmailSyncService: GmailSyncService) {}

  /**
   * Cron expression: '0 0 * * *'
   *   0      = menit ke-0
   *   0      = jam ke-0 (tengah malam)
   *   * * *  = setiap hari, setiap bulan, setiap hari dalam seminggu
   *
   * timeZone: 'Asia/Jakarta' = WIB (UTC+7)
   * Artinya scheduler berjalan tepat jam 00:00 WIB setiap hari.
   */
  @Cron('0 0 * * *', { timeZone: 'Asia/Jakarta' })
  async handleDailySync(): Promise<void> {
    this.logger.log('=== [Scheduler] Daily Gmail Sync Started ===');
    try {
      await this.gmailSyncService.syncAllUsers();
    } catch (err) {
      this.logger.error('[Scheduler] Unexpected error during sync', err);
    }
    this.logger.log('=== [Scheduler] Daily Gmail Sync Completed ===');
  }
}
