import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { User } from '../../database/entities/user.entity';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,

    @InjectRepository(TransactionCategory)
    private readonly transactionCategoryRepo: Repository<TransactionCategory>,

    @Inject(forwardRef(() => TransactionsService))
    private readonly transactionsService: TransactionsService,

    private readonly dataSource: DataSource,
  ) {}

  async findAll(user: User) {
    return this.walletRepo.find({
      where: { user: { id: user.id } },
      relations: ['user'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const wallet = await this.walletRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async create(user: User, dto: CreateWalletDto) {
    const wallet = this.walletRepo.create({
      ...dto,
      user: { id: user.id },
    });
    return await this.walletRepo.save(wallet);
  }

  async update(user: User, id: number, dto: UpdateWalletDto) {
    const wallet = await this.findOne(id);

    // Prevent setting negative balance directly
    if (dto.balance !== undefined && dto.balance < 0) {
      throw new BadRequestException('Balance cannot be negative');
    }

    // Handle balance correction
    if (dto.balance !== undefined && dto.balance !== wallet.balance) {
      const balanceDiff = dto.balance - wallet.balance;
      const isIncreasing = balanceDiff > 0;
      const transactionTypeId = isIncreasing ? 1 : 2;

      const transactionCategory = await this.transactionCategoryRepo.findOne({
        where: {
          user: { id: user.id },
          name: 'Balance Correction',
          transactionType: { id: transactionTypeId },
        },
      });

      if (!transactionCategory) {
        throw new NotFoundException(
          `Transaction category 'Balance Correction' not found for type ${transactionTypeId}`,
        );
      }

      // Use queryRunner for proper transaction handling
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Update other fields (like name) FIRST if provided, but NOT balance
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { balance, ...otherFields } = dto;
        Object.assign(wallet, otherFields);

        if (Object.keys(otherFields).length > 0) {
          Object.assign(wallet, otherFields);
          await queryRunner.manager.save(Wallet, wallet);
        }

        // Create the balance correction transaction using the same manager
        await this.transactionsService.createWithManager(
          queryRunner.manager,
          user,
          {
            transactionTypeId,
            amount: Math.abs(balanceDiff),
            walletId: wallet.id,
            transactionCategoryId: transactionCategory.id,
          },
        );

        await queryRunner.commitTransaction();

        // Refresh wallet after transaction updates its balance
        return await this.walletRepo.findOne({
          where: { id: wallet.id },
          relations: ['user'],
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    // For non-balance updates (excluding balance)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { balance, ...otherFields } = dto;
    Object.assign(wallet, otherFields);
    return await this.walletRepo.save(wallet);
  }

  async remove(id: number) {
    const wallet = await this.findOne(id);
    await this.walletRepo.remove(wallet);
    return { deleted: true };
  }
}
