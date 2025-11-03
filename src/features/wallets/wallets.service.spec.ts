import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WalletsService', () => {
  let service: WalletsService;
  let walletRepo: jest.Mocked<Repository<Wallet>>;
  let categoryRepo: jest.Mocked<Repository<TransactionCategory>>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let dataSource: DataSource;

  const mockUser = { id: 1 } as any;
  const mockWallet = { id: 1, balance: 1000, user: mockUser } as Wallet;
  const mockCategory = {
    id: 10,
    name: 'Balance Correction',
  } as TransactionCategory;

  beforeEach(async () => {
    walletRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    } as any;

    categoryRepo = {
      findOne: jest.fn(),
    } as any;

    transactionsService = {
      create: jest.fn(),
    } as any;

    dataSource = {
      transaction: jest.fn((fn) =>
        fn({ findOne: jest.fn().mockResolvedValue(mockWallet) }),
      ),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: getRepositoryToken(Wallet), useValue: walletRepo },
        {
          provide: getRepositoryToken(TransactionCategory),
          useValue: categoryRepo,
        },
        { provide: TransactionsService, useValue: transactionsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------- FIND ALL ----------------
  it('should return all wallets for a user', async () => {
    walletRepo.find.mockResolvedValue([mockWallet]);

    const result = await service.findAll(mockUser);

    expect(walletRepo.find).toHaveBeenCalledWith({
      where: { user: { id: mockUser.id } },
      relations: ['user'],
      order: { id: 'ASC' },
    });
    expect(result).toEqual([mockWallet]);
  });

  // ---------------- FIND ONE ----------------
  it('should return a wallet by id', async () => {
    walletRepo.findOne.mockResolvedValue(mockWallet);
    const result = await service.findOne(1);
    expect(result).toEqual(mockWallet);
  });

  it('should throw if wallet not found', async () => {
    walletRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  // ---------------- CREATE ----------------
  it('should create and save a wallet', async () => {
    const dto = { name: 'Main Wallet', balance: 500 };
    walletRepo.create.mockReturnValue({ ...dto, user: mockUser } as any);
    walletRepo.save.mockResolvedValue(mockWallet);

    const result = await service.create(mockUser, dto);

    expect(walletRepo.create).toHaveBeenCalledWith({
      ...dto,
      user: { id: mockUser.id },
    });
    expect(walletRepo.save).toHaveBeenCalled();
    expect(result).toEqual(mockWallet);
  });

  // ---------------- UPDATE ----------------
  it('should throw if balance is negative', async () => {
    walletRepo.findOne.mockResolvedValue(mockWallet);
    await expect(
      service.update(mockUser, 1, { balance: -100 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update wallet directly when no balance change', async () => {
    walletRepo.findOne.mockResolvedValue(mockWallet);
    walletRepo.save.mockResolvedValue({
      ...mockWallet,
      name: 'Updated',
    } as any);

    const dto = { name: 'Updated', balance: 1000 };
    const result = await service.update(mockUser, 1, dto);

    expect(walletRepo.save).toHaveBeenCalled();
    expect(result.name).toBe('Updated');
  });

  it('should create balance correction transaction when balance changes', async () => {
    walletRepo.findOne.mockResolvedValue(mockWallet);
    categoryRepo.findOne.mockResolvedValue(mockCategory);
    transactionsService.create.mockResolvedValue({ id: 99 } as any);

    const dto = { balance: 1500 };
    const result = await service.update(mockUser, 1, dto);

    expect(categoryRepo.findOne).toHaveBeenCalledWith({
      where: {
        user: { id: mockUser.id },
        name: 'Balance Correction',
        transactionType: { id: 1 },
      },
    });
    expect(transactionsService.create).toHaveBeenCalledWith(
      mockUser,
      expect.objectContaining({
        transactionTypeId: 1,
        amount: 500,
        walletId: mockWallet.id,
        transactionCategoryId: mockCategory.id,
      }),
    );
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result).toEqual(mockWallet);
  });

  it('should throw if Balance Correction category not found', async () => {
    walletRepo.findOne.mockResolvedValue(mockWallet);
    categoryRepo.findOne.mockResolvedValue(null);

    await expect(
      service.update(mockUser, 1, { balance: 1500 }),
    ).rejects.toThrow(NotFoundException);
  });

  // ---------------- REMOVE ----------------
  it('should remove a wallet', async () => {
    walletRepo.findOne.mockResolvedValue(mockWallet);
    walletRepo.remove.mockResolvedValue(mockWallet);

    const result = await service.remove(1);

    expect(walletRepo.remove).toHaveBeenCalledWith(mockWallet);
    expect(result).toEqual({ deleted: true });
  });
});
