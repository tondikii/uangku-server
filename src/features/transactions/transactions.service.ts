import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Transaction } from '../../database/entities/transaction.entity';
import { TransactionWallet } from '../../database/entities/transaction-wallet.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { User } from '../../database/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FindAllOptions } from '../../common/interfaces/pagination.interface';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,

    @InjectRepository(TransactionWallet)
    private readonly transactionWalletRepo: Repository<TransactionWallet>,

    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,

    private readonly dataSource: DataSource, // ✅ for transaction safety
  ) {}

  /**
   * Create a new transaction and update related wallets atomically.
   */
  async create(user: User, dto: CreateTransactionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ✅ Validate wallets
      const sourceWallet = await queryRunner.manager.findOne(Wallet, {
        where: { id: dto.walletId },
      });
      if (!sourceWallet) throw new NotFoundException('Source wallet not found');

      let targetWallet: Wallet | null = null;
      if (dto.targetWalletId) {
        targetWallet = await queryRunner.manager.findOne(Wallet, {
          where: { id: dto.targetWalletId },
        });
        if (!targetWallet)
          throw new NotFoundException('Target wallet not found');
      }

      // ✅ Create the transaction
      const transaction = queryRunner.manager.create(Transaction, {
        amount: dto.amount,
        adminFee: dto.adminFee || 0,
        transactionType: { id: dto.transactionTypeId },
        transactionCategory: { id: dto.transactionCategoryId },
        user,
      });

      await queryRunner.manager.save(transaction);

      // ✅ Determine direction
      const isIncoming = dto.transactionTypeId === 1; // income
      const isTransfer = dto.transactionTypeId === 3;
      const finalAmount = isTransfer
        ? dto.amount + (dto.adminFee || 0)
        : dto.amount;

      // ✅ Record wallet link (source)
      const sourceTxWallet = queryRunner.manager.create(TransactionWallet, {
        transaction,
        wallet: sourceWallet,
        isIncoming,
        amount: finalAmount,
      });
      await queryRunner.manager.save(sourceTxWallet);

      // ✅ Adjust source wallet balance
      sourceWallet.balance += isIncoming ? dto.amount : -finalAmount;
      await queryRunner.manager.save(sourceWallet);

      // ✅ If transfer, also update target wallet
      if (isTransfer && targetWallet) {
        const targetTxWallet = queryRunner.manager.create(TransactionWallet, {
          transaction,
          wallet: targetWallet,
          isIncoming: true,
          amount: dto.amount,
        });
        await queryRunner.manager.save(targetTxWallet);

        targetWallet.balance += dto.amount;
        await queryRunner.manager.save(targetWallet);
      }

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
    // ✅ Validate wallets
    const sourceWallet = await manager.findOne(Wallet, {
      where: { id: dto.walletId },
    });
    if (!sourceWallet) throw new NotFoundException('Source wallet not found');

    let targetWallet: Wallet | null = null;
    if (dto.targetWalletId) {
      targetWallet = await manager.findOne(Wallet, {
        where: { id: dto.targetWalletId },
      });
      if (!targetWallet) throw new NotFoundException('Target wallet not found');
    }

    // ✅ Create the transaction
    const transaction = manager.create(Transaction, {
      amount: dto.amount,
      adminFee: dto.adminFee || 0,
      transactionType: { id: dto.transactionTypeId },
      transactionCategory: { id: dto.transactionCategoryId },
      user,
    });

    await manager.save(transaction);

    // ✅ Determine direction
    const isIncoming = dto.transactionTypeId === 1; // income
    const isTransfer = dto.transactionTypeId === 3;
    const finalAmount = isTransfer
      ? dto.amount + (dto.adminFee || 0)
      : dto.amount;

    // ✅ Record wallet link (source)
    const sourceTxWallet = manager.create(TransactionWallet, {
      transaction,
      wallet: sourceWallet,
      isIncoming,
      amount: finalAmount,
    });
    await manager.save(sourceTxWallet);

    // ✅ Adjust source wallet balance
    sourceWallet.balance += isIncoming ? dto.amount : -finalAmount;
    await manager.save(sourceWallet);

    // ✅ If transfer, also update target wallet
    if (isTransfer && targetWallet) {
      const targetTxWallet = manager.create(TransactionWallet, {
        transaction,
        wallet: targetWallet,
        isIncoming: true,
        amount: dto.amount,
      });
      await manager.save(targetTxWallet);

      targetWallet.balance += dto.amount;
      await manager.save(targetWallet);
    }

    return transaction;
  }

  /**
   * Paginated fetch of user’s transactions
   */
  async findAll(user: User, options: FindAllOptions) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [result, total] = await this.transactionRepo.findAndCount({
      where: { user: { id: user.id } },
      relations: [
        'transactionType',
        'transactionCategory',
        'transactionWallets.wallet',
      ],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: result,
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
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  /**
   * Update an existing transaction and adjust wallet balances accordingly
   */
  async update(id: number, dto: UpdateTransactionDto) {
    const transaction = await this.findOne(id);

    const oldAmount = transaction.amount;
    const oldAdminFee = transaction.adminFee || 0;

    Object.assign(transaction, dto);
    await this.transactionRepo.save(transaction);

    const newAdminFee = dto.adminFee ?? oldAdminFee;

    // Adjust if either amount or adminFee changes
    if (
      dto.amount !== undefined &&
      (dto.amount !== oldAmount || newAdminFee !== oldAdminFee)
    ) {
      const amountDiff = dto.amount - oldAmount;
      const adminFeeDiff = newAdminFee - oldAdminFee;
      const totalDiff = amountDiff + adminFeeDiff;

      const txWallets = await this.transactionWalletRepo.find({
        where: { transaction: { id } },
        relations: ['wallet'],
      });

      for (const txWallet of txWallets) {
        const wallet = txWallet.wallet;

        if (txWallet.isIncoming) {
          wallet.balance += amountDiff; // incoming wallets only see amount diff
        } else {
          wallet.balance -= totalDiff; // outgoing wallets see both amount + adminFee diff
        }

        await this.walletRepo.save(wallet);
      }
    }

    return transaction;
  }

  /**
   * Delete a transaction and reverse its wallet balance effects
   */
  async remove(id: number) {
    const transaction = await this.findOne(id);
    const txWallets = await this.transactionWalletRepo.find({
      where: { transaction: { id } },
      relations: ['wallet'],
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ✅ Reverse balances
      for (const txWallet of txWallets) {
        const wallet = txWallet.wallet;
        if (txWallet.isIncoming) {
          wallet.balance -= txWallet.amount;
        } else {
          wallet.balance += txWallet.amount;
        }
        await queryRunner.manager.save(wallet);
      }

      // ✅ Delete transactionWallets + transaction
      await queryRunner.manager.remove(txWallets);
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
}
