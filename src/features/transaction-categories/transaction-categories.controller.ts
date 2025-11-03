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
  UsePipes,
  ValidationPipe,
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

  /**
   * Create a new transaction category
   */
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() dto: CreateTransactionCategoryDto, @Req() req) {
    const user = req.user;
    const result = await this.transactionCategoriesService.create(user, dto);

    return successResponse(
      result,
      'Transaction category created successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * Get all transaction categories for current user
   */
  @Get()
  async findAll(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('transactionTypeId', new DefaultValuePipe(0), ParseIntPipe)
    transactionTypeId?: number,
  ) {
    const user = req.user;

    const result = await this.transactionCategoriesService.findAll(user, {
      page,
      limit,
      transactionTypeId: transactionTypeId || undefined,
    });

    return successResponse(
      result,
      'Transaction categories fetched successfully',
      HttpStatus.OK,
    );
  }

  /**
   * Update a transaction category by ID
   */
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionCategoryDto,
  ) {
    const result = await this.transactionCategoriesService.update(id, dto);
    return successResponse(
      result,
      'Transaction category updated successfully',
      HttpStatus.OK,
    );
  }

  /**
   * Delete a transaction category by ID
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.transactionCategoriesService.remove(id);
    return successResponse(
      null,
      'Transaction category deleted successfully',
      HttpStatus.NO_CONTENT,
    );
  }
}
