import { Test, TestingModule } from '@nestjs/testing';
import { TransactionCategoriesService } from './transaction-categories.service';
import { TransactionType } from '../../database/entities/transaction-type.entity';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('TransactionCategoriesService', () => {
  let service: TransactionCategoriesService;
  let transactionTypeRepo: jest.Mocked<Repository<TransactionType>>;
  let transactionCategoryRepo: jest.Mocked<Repository<TransactionCategory>>;

  const mockUser = { id: 1, email: 'user@example.com' } as any;

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
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TransactionCategoriesService);
    transactionTypeRepo = module.get(getRepositoryToken(TransactionType));
    transactionCategoryRepo = module.get(
      getRepositoryToken(TransactionCategory),
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create and save a new transaction category', async () => {
      const dto = { name: 'Food', transactionTypeId: 2 };
      const mockType = { id: 2, name: 'Expense' } as TransactionType;
      const mockCategory = { id: 1, name: dto.name, user: mockUser };

      transactionTypeRepo.findOne.mockResolvedValue(mockType);
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
    it('should return paginated transaction categories', async () => {
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([[{ id: 1, name: 'Food' }], 1]),
      };

      transactionCategoryRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAll(mockUser, {
        page: 1,
        limit: 10,
        transactionTypeId: 2,
      });

      expect(transactionCategoryRepo.createQueryBuilder).toHaveBeenCalledWith(
        'category',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'category.userId = :userId',
        { userId: mockUser.id },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.transactionTypeId = :transactionTypeId',
        { transactionTypeId: 2 },
      );
      expect(result).toEqual({
        data: [{ id: 1, name: 'Food' }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });
  });

  describe('update', () => {
    it('should update and save the transaction category', async () => {
      const dto = { name: 'Updated Category' };
      const mockCategory = { id: 1, name: 'Old Category' };

      transactionCategoryRepo.findOne.mockResolvedValue(mockCategory as any);
      transactionCategoryRepo.save.mockResolvedValue({
        ...mockCategory,
        ...dto,
      } as any);

      const result = await service.update(1, dto);

      expect(transactionCategoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(transactionCategoryRepo.save).toHaveBeenCalledWith({
        ...mockCategory,
        ...dto,
      });
      expect(result).toEqual({ id: 1, name: 'Updated Category' });
    });
  });

  describe('remove', () => {
    it('should remove the transaction category', async () => {
      const mockCategory = { id: 1, name: 'Food' };
      transactionCategoryRepo.findOne.mockResolvedValue(mockCategory as any);
      transactionCategoryRepo.remove.mockResolvedValue(mockCategory as any);

      const result = await service.remove(1);

      expect(transactionCategoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(transactionCategoryRepo.remove).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual({ deleted: true });
    });
  });
});
