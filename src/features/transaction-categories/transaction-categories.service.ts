import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { User } from '../../database/entities/user.entity';
import { FindAllOptions } from '../../common/interfaces/pagination.interface';

@Injectable()
export class TransactionCategoriesService {
  constructor(
    @InjectRepository(TransactionCategory)
    private readonly transactionCategoryRepo: Repository<TransactionCategory>,
  ) {}

  /**
   * Create new transaction category for a user.
   * Ensures name uniqueness per user and transaction type.
   */
  async create(user: User, dto: CreateTransactionCategoryDto) {
    const existing = await this.transactionCategoryRepo.findOne({
      where: {
        name: ILike(dto.name),
        user: { id: user.id },
        transactionType: { id: dto.transactionTypeId },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Category "${dto.name}" already exists for this transaction type.`,
      );
    }

    const transactionCategory = this.transactionCategoryRepo.create({
      name: dto.name,
      iconName: dto.iconName || null,
      transactionType: { id: dto.transactionTypeId },
      user: { id: user.id },
    });

    return this.transactionCategoryRepo.save(transactionCategory);
  }

  /**
   * Get paginated list of categories with optional filtering
   */
  async findAll(user: User, options: FindAllOptions & { search?: string }) {
    const { page, limit, transactionTypeId, search } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      user: { id: user.id },
      name: Not('Balance Correction'),
    };

    if (transactionTypeId) {
      Object.assign(where, { transactionType: { id: transactionTypeId } });
    }

    if (search) {
      Object.assign(where, { name: ILike(`%${search}%`) });
    }

    const [data, total] = await this.transactionCategoryRepo.findAndCount({
      where,
      relations: ['transactionType'],
      skip,
      take: limit,
      order: { id: 'DESC' },
    });

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

  /**
   * Find a single category by id
   */
  async findOne(id: number) {
    const transactionCategory = await this.transactionCategoryRepo.findOne({
      where: { id },
      relations: ['transactionType', 'user'],
    });

    if (!transactionCategory) {
      throw new NotFoundException('Transaction category not found');
    }

    return transactionCategory;
  }

  /**
   * Update category with validation
   */
  async update(id: number, dto: UpdateTransactionCategoryDto) {
    const transactionCategory = await this.findOne(id);

    // Check for duplicate name (excluding current record)
    if (dto.name && dto.transactionTypeId) {
      const duplicate = await this.transactionCategoryRepo.findOne({
        where: {
          id: Not(id),
          name: ILike(dto.name),
          user: { id: transactionCategory.user.id },
          transactionType: { id: dto.transactionTypeId },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          `Another category named "${dto.name}" already exists for this transaction type.`,
        );
      }
    }

    Object.assign(transactionCategory, dto);
    return this.transactionCategoryRepo.save(transactionCategory);
  }

  /**
   * Remove category by id
   */
  async remove(id: number) {
    const transactionCategory = await this.findOne(id);
    await this.transactionCategoryRepo.remove(transactionCategory);
    return { deleted: true };
  }
}
