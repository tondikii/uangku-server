import { Test, TestingModule } from '@nestjs/testing';
import { TransactionCategoriesController } from './transaction-categories.controller';
import { TransactionCategoriesService } from './transaction-categories.service';
import { HttpStatus } from '@nestjs/common';
import { successResponse } from '../../common/utils/response.util';

describe('TransactionCategoriesController', () => {
  let controller: TransactionCategoriesController;
  let service: TransactionCategoriesService;

  const mockUser = { id: 1, name: 'John Doe' };

  const mockTransactionCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionCategoriesController],
      providers: [
        {
          provide: TransactionCategoriesService,
          useValue: mockTransactionCategoriesService,
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
    it('should create a transaction category', async () => {
      const dto = { name: 'Food', transactionTypeId: 1 };
      const createdCategory = { id: 1, ...dto, user: mockUser };
      mockTransactionCategoriesService.create.mockResolvedValue(
        createdCategory,
      );

      const req = { user: mockUser };
      const result = await controller.create(dto, req);

      expect(service.create).toHaveBeenCalledWith(mockUser, dto);
      expect(result).toEqual(
        successResponse(
          createdCategory,
          'Transaction category created successfully',
          HttpStatus.CREATED,
        ),
      );
    });
  });

  describe('findAll', () => {
    it('should return all transaction categories for a user', async () => {
      const categories = [
        { id: 1, name: 'Food' },
        { id: 2, name: 'Transport' },
      ];
      mockTransactionCategoriesService.findAll.mockResolvedValue(categories);

      const req = { user: mockUser };
      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(
        successResponse(
          categories,
          'Transaction Categories fetched successfully',
          HttpStatus.OK,
        ),
      );
    });
  });

  describe('update', () => {
    it('should update a transaction category', async () => {
      const dto = { name: 'Updated Category' };
      const updated = { id: 1, ...dto };
      mockTransactionCategoriesService.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(
        successResponse(
          updated,
          'Transaction Category updated successfully',
          HttpStatus.OK,
        ),
      );
    });
  });

  describe('remove', () => {
    it('should remove a transaction category', async () => {
      mockTransactionCategoriesService.remove.mockResolvedValue({
        deleted: true,
      });

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
});
