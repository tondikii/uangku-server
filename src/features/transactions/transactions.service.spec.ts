import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { TransactionWallet } from '../../database/entities/transaction-wallet.entity';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;

  // ✅ Mock repository
  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    delete: jest.fn(),
  };

  const mockTransactionWalletRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockWalletRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  // ✅ Mock QueryRunner & DataSource
  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(TransactionWallet),
          useValue: mockTransactionWalletRepository,
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockWalletRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new income transaction and update wallet balance', async () => {
      const user = { id: 1 } as any;
      const dto = {
        amount: 1000,
        walletId: 1,
        transactionTypeId: 1, // income
        transactionCategoryId: 1,
      } as any;

      const wallet = { id: 1, balance: 5000 } as Wallet;
      const transaction = { id: 1, amount: dto.amount, user } as Transaction;
      const transactionWallet = {
        id: 1,
        transaction,
        wallet,
        isIncoming: true,
        amount: dto.amount,
      };

      mockQueryRunner.manager.findOne.mockResolvedValue(wallet);
      mockQueryRunner.manager.create
        .mockReturnValueOnce(transaction)
        .mockReturnValueOnce(transactionWallet);

      mockQueryRunner.manager.save
        .mockResolvedValueOnce(transaction)
        .mockResolvedValueOnce(transactionWallet)
        .mockResolvedValueOnce({ ...wallet, balance: 6000 });

      const result = await service.create(user, dto);

      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(Wallet, {
        where: { id: dto.walletId },
      });
      expect(mockQueryRunner.manager.create).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(3);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(transaction);
    });

    it('should create an expense transaction (outgoing)', async () => {
      const user = { id: 1 } as any;
      const dto = {
        amount: 500,
        walletId: 1,
        transactionTypeId: 2, // expense
        transactionCategoryId: 2,
      } as any;

      const wallet = { id: 1, balance: 5000 } as Wallet;
      const transaction = { id: 2, amount: dto.amount } as Transaction;

      mockQueryRunner.manager.findOne.mockResolvedValue(wallet);
      mockQueryRunner.manager.create
        .mockReturnValueOnce(transaction)
        .mockReturnValueOnce({});

      mockQueryRunner.manager.save.mockResolvedValue({});

      await service.create(user, dto);

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if source wallet not found', async () => {
      const user = { id: 1 } as any;
      const dto = {
        amount: 1000,
        walletId: 99,
        transactionTypeId: 1,
        transactionCategoryId: 1,
      } as any;

      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.create(user, dto)).rejects.toThrow(
        new NotFoundException('Source wallet not found'),
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if target wallet not found on transfer', async () => {
      const user = { id: 1 } as any;
      const dto = {
        amount: 1000,
        walletId: 1,
        targetWalletId: 99,
        transactionTypeId: 3, // transfer
        transactionCategoryId: 1,
      } as any;

      const sourceWallet = { id: 1, balance: 5000 } as Wallet;

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(sourceWallet)
        .mockResolvedValueOnce(null); // target wallet not found

      await expect(service.create(user, dto)).rejects.toThrow(
        new NotFoundException('Target wallet not found'),
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on any failure', async () => {
      const user = { id: 1 } as any;
      const dto = {
        amount: 1000,
        walletId: 1,
        transactionTypeId: 1,
        transactionCategoryId: 1,
      } as any;

      const wallet = { id: 1, balance: 5000 } as Wallet;

      mockQueryRunner.manager.findOne.mockResolvedValue(wallet);
      mockQueryRunner.manager.create.mockReturnValue({});
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(user, dto)).rejects.toThrow('DB Error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should handle transfer transaction with target wallet and admin fee', async () => {
      const user = { id: 1 } as any;
      const dto = {
        amount: 1000,
        adminFee: 50,
        walletId: 1,
        targetWalletId: 2,
        transactionTypeId: 3, // transfer
        transactionCategoryId: 1,
      } as any;

      const sourceWallet = { id: 1, balance: 5000 } as Wallet;
      const targetWallet = { id: 2, balance: 3000 } as Wallet;
      const transaction = { id: 1, amount: dto.amount } as Transaction;

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(sourceWallet)
        .mockResolvedValueOnce(targetWallet);

      mockQueryRunner.manager.create
        .mockReturnValueOnce(transaction)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      mockQueryRunner.manager.save.mockResolvedValue({});

      const result = await service.create(user, dto);

      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.manager.create).toHaveBeenCalledTimes(3);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(transaction);
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions for user', async () => {
      const user = { id: 1 } as any;
      const options = { page: 1, limit: 10 };

      const mockTransactions = [
        { id: 1, amount: 1000 },
        { id: 2, amount: 2000 },
      ] as Transaction[];

      mockTransactionRepository.findAndCount.mockResolvedValue([
        mockTransactions,
        2,
      ]);

      const result = await service.findAll(user, options);

      expect(mockTransactionRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: user.id } },
        relations: [
          'transactionType',
          'transactionCategory',
          'transactionWallets.wallet',
        ],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });

      expect(result.data).toEqual(mockTransactions);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly for page 2', async () => {
      const user = { id: 1 } as any;
      const options = { page: 2, limit: 5 };

      mockTransactionRepository.findAndCount.mockResolvedValue([[], 12]);

      const result = await service.findAll(user, options);

      expect(mockTransactionRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );

      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      const transaction = {
        id: 1,
        amount: 1000,
        transactionWallets: [],
      } as Transaction;

      mockTransactionRepository.findOne.mockResolvedValue(transaction);

      const result = await service.findOne(1);

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['transactionWallets', 'transactionWallets.wallet'],
      });
      expect(result).toEqual(transaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Transaction not found'),
      );
    });
  });

  describe('update', () => {
    it('should update transaction amount and adjust wallet balance', async () => {
      const transaction = {
        id: 1,
        amount: 1000,
        adminFee: 0,
        transactionWallets: [
          {
            wallet: { id: 1, balance: 5000 },
            isIncoming: false,
            amount: 1000,
          },
        ],
      } as any;

      const dto = { amount: 1500 };

      mockTransactionRepository.findOne.mockResolvedValue(transaction);
      mockTransactionRepository.save.mockResolvedValue({
        ...transaction,
        ...dto,
      });

      mockTransactionWalletRepository.find.mockResolvedValue(
        transaction.transactionWallets,
      );
      mockWalletRepository.save.mockResolvedValue({});

      const result = await service.update(1, dto);

      expect(mockTransactionRepository.save).toHaveBeenCalled();
      expect(mockWalletRepository.save).toHaveBeenCalled();
      expect(result.amount).toBe(1500);
    });

    it('should update transaction with admin fee change', async () => {
      const transaction = {
        id: 1,
        amount: 1000,
        adminFee: 50,
        transactionWallets: [
          {
            wallet: { id: 1, balance: 5000 },
            isIncoming: false,
            amount: 1050,
          },
        ],
      } as any;

      const dto = { amount: 1000, adminFee: 100 };

      mockTransactionRepository.findOne.mockResolvedValue(transaction);
      mockTransactionRepository.save.mockResolvedValue({
        ...transaction,
        ...dto,
      });

      mockTransactionWalletRepository.find.mockResolvedValue(
        transaction.transactionWallets,
      );
      mockWalletRepository.save.mockResolvedValue({});

      await service.update(1, dto);

      expect(mockWalletRepository.save).toHaveBeenCalled();
    });

    it('should update transaction with incoming wallet', async () => {
      const transaction = {
        id: 1,
        amount: 1000,
        adminFee: 0,
        transactionWallets: [
          {
            wallet: { id: 1, balance: 5000 },
            isIncoming: true,
            amount: 1000,
          },
        ],
      } as any;

      const dto = { amount: 1500 };

      mockTransactionRepository.findOne.mockResolvedValue(transaction);
      mockTransactionRepository.save.mockResolvedValue({
        ...transaction,
        ...dto,
      });

      mockTransactionWalletRepository.find.mockResolvedValue(
        transaction.transactionWallets,
      );
      mockWalletRepository.save.mockResolvedValue({});

      await service.update(1, dto);

      expect(mockWalletRepository.save).toHaveBeenCalled();
    });

    it('should not adjust wallet if amount unchanged', async () => {
      const transaction = {
        id: 1,
        amount: 1000,
        adminFee: 0,
        transactionWallets: [],
      } as any;

      const dto = { transactionCategoryId: 2 }; // no amount change

      mockTransactionRepository.findOne.mockResolvedValue(transaction);
      mockTransactionRepository.save.mockResolvedValue({
        ...transaction,
        ...dto,
      });

      await service.update(1, dto);

      expect(mockTransactionWalletRepository.find).not.toHaveBeenCalled();
      expect(mockWalletRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete transaction and reverse wallet balance', async () => {
      const transaction = {
        id: 1,
        amount: 1000,
      } as Transaction;

      const txWallets = [
        {
          wallet: { id: 1, balance: 4000 },
          isIncoming: false,
          amount: 1000,
        },
      ] as any;

      mockTransactionRepository.findOne.mockResolvedValue(transaction);
      mockTransactionWalletRepository.find.mockResolvedValue(txWallets);

      mockQueryRunner.manager.save.mockResolvedValue({});
      mockQueryRunner.manager.remove.mockResolvedValue({});

      const result = await service.remove(1);

      expect(mockTransactionWalletRepository.find).toHaveBeenCalledWith({
        where: { transaction: { id: 1 } },
        relations: ['wallet'],
      });

      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.manager.remove).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });

    it('should reverse balance for incoming transaction', async () => {
      const transaction = { id: 1 } as Transaction;

      const txWallets = [
        {
          wallet: { id: 1, balance: 6000 },
          isIncoming: true,
          amount: 1000,
        },
      ] as any;

      mockTransactionRepository.findOne.mockResolvedValue(transaction);
      mockTransactionWalletRepository.find.mockResolvedValue(txWallets);

      mockQueryRunner.manager.save.mockResolvedValue({});
      mockQueryRunner.manager.remove.mockResolvedValue({});

      const result = await service.remove(1);

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.deleted).toBe(true);
    });

    it('should rollback on error during deletion', async () => {
      const transaction = { id: 1 } as Transaction;
      const txWallets = [
        {
          wallet: { id: 1, balance: 5000 },
          isIncoming: false,
          amount: 1000,
        },
      ] as any;

      mockTransactionRepository.findOne.mockResolvedValue(transaction);
      mockTransactionWalletRepository.find.mockResolvedValue(txWallets);

      mockQueryRunner.manager.save.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(service.remove(1)).rejects.toThrow('Delete failed');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if transaction not found for deletion', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Transaction not found'),
      );
    });
  });
});
