import { Injectable } from '@nestjs/common';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { TransactionType } from '../../database/entities/transaction-type.entity';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

interface FindAllOptions {
  page: number;
  limit: number;
  transactionTypeId?: number;
}

@Injectable()
export class TransactionCategoriesService {
  constructor(
    @InjectRepository(TransactionType)
    private readonly transactionTypeRepo: Repository<TransactionType>,

    @InjectRepository(TransactionCategory)
    private readonly transactionCategoryRepo: Repository<TransactionCategory>,
  ) {}

  async create(user: User, dto: CreateTransactionCategoryDto) {
    const transactionCategory = this.transactionCategoryRepo.create({
      name: dto.name,
      transactionType: { id: dto.transactionTypeId },
      user: { id: user.id },
    });

    return this.transactionCategoryRepo.save(transactionCategory);
  }

  async findAll(user: User, options: FindAllOptions) {
    const { page, limit, transactionTypeId } = options;
    const skip = (page - 1) * limit;

    const query = this.transactionCategoryRepo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.transactionType', 'transactionType')
      .where('category.userId = :userId', { userId: user.id });

    if (transactionTypeId) {
      query.andWhere('category.transactionTypeId = :transactionTypeId', {
        transactionTypeId,
      });
    }

    query.orderBy('category.id', 'ASC').skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
