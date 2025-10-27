import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { TransactionCategoriesService } from './transaction-categories.service';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { successResponse } from '../../common/utils/response.util';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('transaction-categories')
export class TransactionCategoriesController {
  constructor(
    private readonly transactionCategoriesService: TransactionCategoriesService,
  ) {}

  @Post()
  async create(@Body() dto: CreateTransactionCategoryDto, @Req() req) {
    const user = req.user;
    const result = await this.transactionCategoriesService.create(user, dto);

    return successResponse(
      result,
      'Transaction category created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  async findAll(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit,
    @Query('transactionTypeId', new DefaultValuePipe(0), ParseIntPipe)
    transactionTypeId?: number,
  ) {
    const user = req.user;

    const result = await this.transactionCategoriesService.findAll(user, {
      page: page,
      limit: limit,
      transactionTypeId: transactionTypeId ? transactionTypeId : undefined,
    });

    return successResponse(
      result,
      'Transaction Categories fetched successfully',
      HttpStatus.OK,
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionCategoryDto,
  ) {
    const result = await this.transactionCategoriesService.update(id, dto);
    return successResponse(
      result,
      'Transaction Category updated successfully',
      HttpStatus.OK,
    );
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.transactionCategoriesService.remove(id);
    return successResponse(
      null,
      'Transaction Category deleted successfully',
      HttpStatus.NO_CONTENT,
    );
  }
}
