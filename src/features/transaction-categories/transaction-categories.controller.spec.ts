import { Test, TestingModule } from '@nestjs/testing';
import { TransactionCategoriesController } from './transaction-categories.controller';
import { TransactionCategoriesService } from './transaction-categories.service';
import { HttpStatus } from '@nestjs/common';
import { successResponse } from '../../common/utils/response.util';

jest.mock('../../common/utils/response.util', () => ({
  successResponse: jest.fn((data, message, status) => ({
    statusCode: status,
    message,
    data,
  })),
}));

describe('TransactionCategoriesController', () => {
  let controller: TransactionCategoriesController;
  let service: TransactionCategoriesService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = { id: 1, name: 'John' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionCategoriesController],
      providers: [
        {
          provide: TransactionCategoriesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TransactionCategoriesController>(
      TransactionCategoriesController,
    );
    service = module.get<TransactionCategoriesService>(
      TransactionCategoriesService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction category', async () => {
      const dto = { name: 'Food', transactionTypeId: 1 };
      const expected = { id: 1, ...dto };
      mockService.create.mockResolvedValue(expected);

      const req = { user: mockUser };
      const result = await controller.create(dto as any, req as any);

      expect(service.create).toHaveBeenCalledWith(mockUser, dto);
      expect(successResponse).toHaveBeenCalledWith(
        expected,
        'Transaction category created successfully',
        HttpStatus.CREATED,
      );
      expect(result.statusCode).toBe(HttpStatus.CREATED);
    });
  });

  describe('findAll', () => {
    it('should return paginated transaction categories', async () => {
      const expected = {
        data: [{ id: 1, name: 'Groceries' }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockService.findAll.mockResolvedValue(expected);

      const req = { user: mockUser };
      const result = await controller.findAll(req as any, 1, 10, 0);

      expect(service.findAll).toHaveBeenCalledWith(mockUser, {
        page: 1,
        limit: 10,
        transactionTypeId: undefined,
      });
      expect(successResponse).toHaveBeenCalledWith(
        expected,
        'Transaction categories fetched successfully',
        HttpStatus.OK,
      );
      expect(result.statusCode).toBe(HttpStatus.OK);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const dto = { name: 'Utilities' };
      const updated = { id: 1, name: 'Utilities' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto as any);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(successResponse).toHaveBeenCalledWith(
        updated,
        'Transaction category updated successfully',
        HttpStatus.OK,
      );
      expect(result.statusCode).toBe(HttpStatus.OK);
    });
  });

  describe('remove', () => {
    it('should delete a category successfully', async () => {
      mockService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(successResponse).toHaveBeenCalledWith(
        null,
        'Transaction category deleted successfully',
        HttpStatus.NO_CONTENT,
      );
      expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
    });
  });
});
