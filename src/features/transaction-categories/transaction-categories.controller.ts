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
} from '@nestjs/common';
import { TransactionCategoriesService } from './transaction-categories.service';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { successResponse } from '../../common/utils/response.util';

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
  async findAll(@Req() req) {
    const user = req.user; // diisi otomatis oleh JwtStrategy
    const result = await this.transactionCategoriesService.findAll(user);
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
