import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GmailSyncService } from './gmail-sync.service';
import { SyncGmailDto } from './dto/sync-gmail.dto';
import { successResponse } from '../../common/utils/response.util';

// Pakai AuthGuard('jwt') yang sama persis dengan controller lain kamu
@UseGuards(AuthGuard('jwt'))
@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailSyncService: GmailSyncService) {}

  /**
   * GET /gmail/sync-status
   *
   * Dipanggil FE saat buka halaman transactions untuk menampilkan:
   * - "Sync terakhir: 2 jam lalu"
   * - Atau tombol "Reconnect Gmail" kalau token expired
   */
  @Get('sync-status')
  async getSyncStatus(@Req() req) {
    const data = await this.gmailSyncService.getSyncStatus(req.user.id);
    return successResponse(data, 'Sync status retrieved', HttpStatus.OK);
  }

  /**
   * POST /gmail/sync
   *
   * Dipanggil FE saat user klik tombol "Sync Gmail".
   * Body: { accessToken: string } — access token dari GoogleSignin.getTokens()
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async manualSync(@Req() req, @Body() dto: SyncGmailDto) {
    const result = await this.gmailSyncService.syncManual(
      req.user.id,
      dto.accessToken,
    );
    return successResponse(
      result,
      `Imported ${result.imported} new transactions`,
      HttpStatus.OK,
    );
  }
}
