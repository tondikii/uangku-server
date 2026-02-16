import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  async getMonthly(
    @Req() req,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    const user = req.user;

    return this.reportsService.getMonthlyReport(
      user,
      Number(year),
      Number(month),
    );
  }
}
