import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { startOfDay, endOfDay } from 'date-fns';

import { Transaction } from '../../database/entities/transaction.entity';
import { TransactionWallet } from '../../database/entities/transaction-wallet.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { User } from '../../database/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FindAllOptions } from 'src/common/interfaces/find.interfaces';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,

    @InjectRepository(TransactionWallet)
    private readonly transactionWalletRepo: Repository<TransactionWallet>,

    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,

    private readonly dataSource: DataSource,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                  CREATE                                    */
  /* -------------------------------------------------------------------------- */

  async create(user: User, dto: CreateTransactionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = queryRunner.manager.create(Transaction, {
        amount: dto.amount,
        adminFee: dto.adminFee || 0,
        transactionType: { id: dto.transactionTypeId },
        transactionCategory: { id: dto.transactionCategoryId },
        user,
      });

      await queryRunner.manager.save(transaction);

      await this.applyTransactionWithManager(
        queryRunner.manager,
        transaction,
        dto,
      );

      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createWithManager(
    manager: EntityManager,
    user: User,
    dto: CreateTransactionDto,
  ) {
    const transaction = manager.create(Transaction, {
      amount: dto.amount,
      adminFee: dto.adminFee || 0,
      transactionType: { id: dto.transactionTypeId },
      transactionCategory: { id: dto.transactionCategoryId },
      user,
    });

    await manager.save(transaction);
    await this.applyTransactionWithManager(manager, transaction, dto);

    return transaction;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   FIND                                     */
  /* -------------------------------------------------------------------------- */

  async findAll(user: User, options: FindAllOptions) {
    const { page, limit, date } = options;
    const skip = (page - 1) * limit;

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (date) {
      startDate = startOfDay(new Date(date));
      endDate = endOfDay(new Date(date));
    }

    const query = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect(
        'transaction.transactionCategory',
        'transactionCategory',
      )
      .leftJoinAndSelect('transaction.transactionWallets', 'transactionWallets')
      .leftJoinAndSelect('transactionWallets.wallet', 'wallet')
      .where('transaction.userId = :userId', { userId: user.id });

    if (date) {
      query.andWhere('transaction.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    // pagination
    query.skip(skip).take(limit);
    query.orderBy('transaction.createdAt', 'DESC');

    const [result, total] = await query.getManyAndCount();

    // ========================
    // SUMMARY QUERY
    // ========================

    const summaryQuery = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.transactionType', 'transactionType')
      .where('transaction.userId = :userId', { userId: user.id });

    if (date) {
      summaryQuery.andWhere('transaction.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    const summaryRaw = await this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.transactionType', 'type')
      .where('transaction.userId = :userId', { userId: user.id })
      .andWhere(
        date ? 'transaction.createdAt BETWEEN :start AND :end' : '1=1',
        date ? { start: startDate, end: endDate } : {},
      )
      .select([
        `
    SUM(
      CASE 
        WHEN type.id = 1 THEN transaction.amount
        ELSE 0
      END
    ) as income
    `,
        `
    SUM(
      CASE 
        WHEN type.id = 2 THEN transaction.amount
        WHEN type.id = 3 THEN "transaction"."adminFee"
        ELSE 0
      END
    ) as expense
    `,
      ])
      .getRawOne();

    const income = Number(summaryRaw.income) || 0;
    const expense = Number(summaryRaw.expense) || 0;

    return {
      data: result,
      summary: {
        income,
        expense,
        balance: income - expense,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
      relations: [
        'transactionType',
        'transactionCategory',
        'transactionWallets.wallet',
      ],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   UPDATE                                   */
  /* -------------------------------------------------------------------------- */

  async update(id: number, dto: UpdateTransactionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id },
        relations: ['transactionWallets', 'transactionWallets.wallet'],
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      /* 1️⃣ REVERSE OLD EFFECTS */
      for (const txWallet of transaction.transactionWallets) {
        const wallet = txWallet.wallet;

        if (txWallet.isIncoming) {
          wallet.balance -= txWallet.amount;
        } else {
          wallet.balance += txWallet.amount;
        }

        await queryRunner.manager.save(wallet);
      }

      await queryRunner.manager.remove(transaction.transactionWallets);

      /* 2️⃣ UPDATE TRANSACTION CORE DATA */
      Object.assign(transaction, {
        amount: dto.amount ?? transaction.amount,
        adminFee: dto.adminFee ?? transaction.adminFee,
        transactionType: dto.transactionTypeId
          ? { id: dto.transactionTypeId }
          : transaction.transactionType,
        transactionCategory: dto.transactionCategoryId
          ? { id: dto.transactionCategoryId }
          : transaction.transactionCategory,
      });

      await queryRunner.manager.save(transaction);

      /* 3️⃣ APPLY NEW EFFECTS */
      await this.applyTransactionWithManager(
        queryRunner.manager,
        transaction,
        dto,
      );

      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   DELETE                                   */
  /* -------------------------------------------------------------------------- */

  async remove(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id },
        relations: ['transactionWallets', 'transactionWallets.wallet'],
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      for (const txWallet of transaction.transactionWallets) {
        const wallet = txWallet.wallet;

        if (txWallet.isIncoming) {
          wallet.balance -= txWallet.amount;
        } else {
          wallet.balance += txWallet.amount;
        }

        await queryRunner.manager.save(wallet);
      }

      await queryRunner.manager.remove(transaction.transactionWallets);
      await queryRunner.manager.remove(transaction);

      await queryRunner.commitTransaction();
      return { deleted: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                             SHARED APPLY LOGIC                              */
  /* -------------------------------------------------------------------------- */

  private async applyTransactionWithManager(
    manager: EntityManager,
    transaction: Transaction,
    dto: CreateTransactionDto | UpdateTransactionDto,
  ) {
    const sourceWallet = await manager.findOne(Wallet, {
      where: { id: dto.walletId },
    });
    if (!sourceWallet) {
      throw new NotFoundException('Source wallet not found');
    }

    const typeId = transaction.transactionType.id;
    const isIncome = typeId === 1;
    const isTransfer = typeId === 3;

    const adminFee = transaction.adminFee || 0;
    const finalAmount = isTransfer
      ? transaction.amount + adminFee
      : transaction.amount;

    // SOURCE WALLET
    const sourceTxWallet = manager.create(TransactionWallet, {
      transaction,
      wallet: sourceWallet,
      isIncoming: isIncome,
      amount: finalAmount,
    });

    await manager.save(sourceTxWallet);

    sourceWallet.balance += isIncome ? transaction.amount : -finalAmount;

    await manager.save(sourceWallet);

    // TARGET WALLET (TRANSFER)
    if (isTransfer && dto.targetWalletId) {
      const targetWallet = await manager.findOne(Wallet, {
        where: { id: dto.targetWalletId },
      });

      if (!targetWallet) {
        throw new NotFoundException('Target wallet not found');
      }

      const targetTxWallet = manager.create(TransactionWallet, {
        transaction,
        wallet: targetWallet,
        isIncoming: true,
        amount: transaction.amount,
      });

      await manager.save(targetTxWallet);

      targetWallet.balance += transaction.amount;
      await manager.save(targetWallet);
    }
  }
}
