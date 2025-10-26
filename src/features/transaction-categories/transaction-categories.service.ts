import { Injectable } from '@nestjs/common';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { TransactionType } from '../../database/entities/transaction-type.entity';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class TransactionCategoriesService {
  constructor(
    @InjectRepository(TransactionType)
    private readonly transactionTypeRepo: Repository<TransactionType>,

    @InjectRepository(TransactionCategory)
    private readonly transactionCategoryRepo: Repository<TransactionCategory>,
  ) {}

  async create(user: User, dto: CreateTransactionCategoryDto) {
    const transactionType = await this.transactionTypeRepo.findOne({
      where: { id: dto.transactionTypeId },
    });

    const transactionCategory = this.transactionCategoryRepo.create({
      name: dto.name,
      transactionType: transactionType,
      user: user,
    });

    return this.transactionCategoryRepo.save(transactionCategory);
  }

  findAll(user: User) {
    return this.transactionCategoryRepo.find({
      where: { user },
      order: { id: 'ASC' },
    });
  }

  async update(id: number, dto: UpdateTransactionCategoryDto) {
    const transactionCategory = await this.transactionCategoryRepo.findOne({
      where: { id },
    });
    Object.assign(transactionCategory, dto);
    return this.transactionCategoryRepo.save(transactionCategory);
  }

  async remove(id: number) {
    const transactionCategory = await this.transactionCategoryRepo.findOne({
      where: { id },
    });
    await this.transactionCategoryRepo.remove(transactionCategory);
    return { deleted: true };
  }
}
