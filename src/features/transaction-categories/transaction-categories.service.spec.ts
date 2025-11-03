import { Test, TestingModule } from '@nestjs/testing';
import { TransactionCategoriesService } from './transaction-categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { Repository, ILike } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransactionCategoriesService', () => {
  let service: TransactionCategoriesService;
  let repo: jest.Mocked<Repository<TransactionCategory>>;

  const mockCategory: TransactionCategory = {
    id: 1,
    name: 'Food',
    iconName: 'test-icon',
    transactionType: { id: 1, name: 'Expense' } as any,
    user: { id: 1, email: 'test@example.com' } as any,
    transactions: [],
  };

  const mockUser = { id: 1 } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionCategoriesService,
        {
          provide: getRepositoryToken(TransactionCategory),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
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
    repo = module.get(getRepositoryToken(TransactionCategory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create a new transaction category', async () => {
      const dto = { name: 'Food', transactionTypeId: 1, iconName: 'test-icon' };

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockCategory);
      repo.save.mockResolvedValue(mockCategory);

      const result = await service.create(mockUser, dto);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: {
          name: ILike(dto.name),
          user: { id: mockUser.id },
          transactionType: { id: dto.transactionTypeId },
        },
      });
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });

    it('should throw BadRequestException if category already exists', async () => {
      const dto = { name: 'Food', transactionTypeId: 1, iconName: 'test-icon' };
      repo.findOne.mockResolvedValue(mockCategory);

      await expect(service.create(mockUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // FIND ALL
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const options = { page: 1, limit: 10 };
      repo.findAndCount.mockResolvedValue([[mockCategory], 1]);

      const result = await service.findAll(mockUser, options);

      expect(repo.findAndCount).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // FIND ONE
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a category if found', async () => {
      repo.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(1);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['transactionType', 'user'],
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update a category successfully', async () => {
      const dto = { name: 'Updated', transactionTypeId: 1 };
      repo.findOne.mockResolvedValueOnce(mockCategory); // findOne(id)
      repo.findOne.mockResolvedValueOnce(null); // check duplicate
      repo.save.mockResolvedValue({ ...mockCategory, ...dto });

      const result = await service.update(1, dto);

      expect(repo.findOne).toHaveBeenCalledTimes(2);
      expect(repo.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated');
    });

    it('should throw BadRequestException if duplicate exists', async () => {
      const dto = { name: 'Duplicate', transactionTypeId: 1 };
      repo.findOne.mockResolvedValueOnce(mockCategory); // findOne(id)
      repo.findOne.mockResolvedValueOnce(mockCategory); // duplicate found

      await expect(service.update(1, dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // REMOVE
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should remove category successfully', async () => {
      repo.findOne.mockResolvedValue(mockCategory);
      repo.remove.mockResolvedValue(mockCategory);

      const result = await service.remove(1);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['transactionType', 'user'],
      });
      expect(repo.remove).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
