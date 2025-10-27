import { Test, TestingModule } from '@nestjs/testing';
import { TransactionCategoriesController } from './transaction-categories.controller';
import { TransactionCategoriesService } from './transaction-categories.service';
import { successResponse } from '../../common/utils/response.util';
import { HttpStatus } from '@nestjs/common';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { TransactionType } from '../../database/entities/transaction-type.entity';
import { User } from '../../database/entities/user.entity';

describe('TransactionCategoriesController', () => {
  let controller: TransactionCategoriesController;
  let service: jest.Mocked<TransactionCategoriesService>;

  const mockUser: User = { id: 1, email: 'user@example.com' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionCategoriesController],
      providers: [
        {
          provide: TransactionCategoriesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TransactionCategoriesController);
    service = module.get(TransactionCategoriesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a transaction category', async () => {
    const dto = { name: 'Food', transactionTypeId: 1 };
    const createdCategory = {
      id: 1,
      name: 'Food',
      user: mockUser,
      transactionType: { id: 1, name: 'Expense' } as TransactionType,
    } as TransactionCategory;

    service.create.mockResolvedValue(createdCategory);

    const result = await controller.create(dto, { user: mockUser });

    expect(service.create).toHaveBeenCalledWith(mockUser, dto);
    expect(result).toEqual(
      successResponse(
        createdCategory,
        'Transaction category created successfully',
        HttpStatus.CREATED,
      ),
    );
  });

  it('should return paginated transaction categories', async () => {
    const mockCategories: TransactionCategory[] = [
      {
        id: 1,
        name: 'Food',
        user: mockUser,
        transactionType: { id: 1, name: 'Expense' } as TransactionType,
      } as TransactionCategory,
    ];

    const paginated = {
      data: mockCategories,
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };

    service.findAll.mockResolvedValue(paginated);

    const result = await controller.findAll({ user: mockUser }, 1, 10, 1);

    expect(service.findAll).toHaveBeenCalledWith(mockUser, {
      page: 1,
      limit: 10,
      transactionTypeId: 1,
    });

    expect(result).toEqual(
      successResponse(
        paginated,
        'Transaction Categories fetched successfully',
        HttpStatus.OK,
      ),
    );
  });

  it('should update a transaction category', async () => {
    const dto = { name: 'Updated Name' };
    const updatedCategory = {
      id: 1,
      name: 'Updated Name',
      user: mockUser,
      transactionType: { id: 1, name: 'Expense' } as TransactionType,
    } as TransactionCategory;

    service.update.mockResolvedValue(updatedCategory);

    const result = await controller.update(1, dto);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(
      successResponse(
        updatedCategory,
        'Transaction Category updated successfully',
        HttpStatus.OK,
      ),
    );
  });

  it('should remove a transaction category', async () => {
    service.remove.mockResolvedValue({ deleted: true });

    const result = await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual(
      successResponse(
        null,
        'Transaction Category deleted successfully',
        HttpStatus.NO_CONTENT,
      ),
    );
  });
});
