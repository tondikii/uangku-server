import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpStatus,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthGuard } from '@nestjs/passport';
import { successResponse } from '../../common/utils/response.util';

@UseGuards(AuthGuard('jwt'))
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto, @Req() req) {
    const user = req.user;
    const result = await this.transactionsService.create(user, dto);
    return successResponse(
      result,
      'Transaction created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  async findAll(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('date') date?: string,
  ) {
    const user = req.user;
    const result = await this.transactionsService.findAll(user, {
      page,
      limit,
      date,
    });
    return successResponse(
      result,
      'Transactions fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.transactionsService.findOne(id);
    return successResponse(
      result,
      'Transaction fetched successfully',
      HttpStatus.OK,
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    const result = await this.transactionsService.update(id, dto);
    return successResponse(
      result,
      'Transaction updated successfully',
      HttpStatus.OK,
    );
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.transactionsService.remove(id);
    return successResponse(
      null,
      'Transaction deleted successfully',
      HttpStatus.NO_CONTENT,
    );
  }
}
