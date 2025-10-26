import { Test, TestingModule } from '@nestjs/testing';
import { TransactionCategoriesService } from './transaction-categories.service';
import { Repository } from 'typeorm';
import { TransactionType } from '../../database/entities/transaction-type.entity';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('TransactionCategoriesService', () => {
  let service: TransactionCategoriesService;
  let transactionTypeRepo: jest.Mocked<Repository<TransactionType>>;
  let transactionCategoryRepo: jest.Mocked<Repository<TransactionCategory>>;

  const mockUser = { id: 1, name: 'John Doe' } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionCategoriesService,
        {
          provide: getRepositoryToken(TransactionType),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TransactionCategory),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionCategoriesService>(
      TransactionCategoriesService,
    );
    transactionTypeRepo = module.get(getRepositoryToken(TransactionType));
    transactionCategoryRepo = module.get(
      getRepositoryToken(TransactionCategory),
    );

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction category', async () => {
      const dto = { name: 'Food', transactionTypeId: 1 };
      const mockType = { id: 1, name: 'Expense' };
      const mockCategory = {
        id: 1,
        name: 'Food',
        transactionType: mockType,
        user: mockUser,
      };

      transactionTypeRepo.findOne.mockResolvedValue(mockType as any);
      transactionCategoryRepo.create.mockReturnValue(mockCategory as any);
      transactionCategoryRepo.save.mockResolvedValue(mockCategory as any);

      const result = await service.create(mockUser, dto);

      expect(transactionTypeRepo.findOne).toHaveBeenCalledWith({
        where: { id: dto.transactionTypeId },
      });
      expect(transactionCategoryRepo.create).toHaveBeenCalledWith({
        name: dto.name,
        transactionType: mockType,
        user: mockUser,
      });
      expect(transactionCategoryRepo.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAll', () => {
    it('should return all transaction categories for a user', async () => {
      const mockCategories = [
        { id: 1, name: 'Food' },
        { id: 2, name: 'Transport' },
      ];
      transactionCategoryRepo.find.mockResolvedValue(mockCategories as any);

      const result = await service.findAll(mockUser);

      expect(transactionCategoryRepo.find).toHaveBeenCalledWith({
        where: { user: mockUser },
        order: { id: 'ASC' },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('update', () => {
    it('should update and save an existing transaction category', async () => {
      const dto = { name: 'Updated Food' };
      const existingCategory = { id: 1, name: 'Food' };
      const updatedCategory = { id: 1, name: 'Updated Food' };

      transactionCategoryRepo.findOne.mockResolvedValue(
        existingCategory as any,
      );
      transactionCategoryRepo.save.mockResolvedValue(updatedCategory as any);

      const result = await service.update(1, dto);

      expect(transactionCategoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(transactionCategoryRepo.save).toHaveBeenCalledWith(
        updatedCategory,
      );
      expect(result).toEqual(updatedCategory);
    });
  });

  describe('remove', () => {
    it('should remove a transaction category', async () => {
      const existingCategory = { id: 1, name: 'Food' };
      transactionCategoryRepo.findOne.mockResolvedValue(
        existingCategory as any,
      );
      transactionCategoryRepo.remove.mockResolvedValue(existingCategory as any);

      const result = await service.remove(1);

      expect(transactionCategoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(transactionCategoryRepo.remove).toHaveBeenCalledWith(
        existingCategory,
      );
      expect(result).toEqual({ deleted: true });
    });
  });
});
