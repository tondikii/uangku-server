import { Controller, Get } from '@nestjs/common';
import { TransactionTypesService } from './transaction-types.service';
import { successResponse } from '../../common/utils/response.util';

@Controller('transaction-types')
export class TransactionTypesController {
  constructor(
    private readonly transactionTypesService: TransactionTypesService,
  ) {}

  @Get()
  async findAll() {
    const result = await this.transactionTypesService.findAll();
    return successResponse(result, 'Transaction Types fetched successfully');
  }
}
