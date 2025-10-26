import { Test, TestingModule } from '@nestjs/testing';
import { TransactionTypesController } from './transaction-types.controller';
import { TransactionTypesService } from './transaction-types.service';
import { successResponse } from '../../common/utils/response.util';

jest.mock('../../common/utils/response.util', () => ({
  successResponse: jest.fn((data, message, status = 200) => ({
    statusCode: status,
    message,
    data,
  })),
}));

describe('TransactionTypesController', () => {
  let controller: TransactionTypesController;
  let service: TransactionTypesService;

  const mockTransactionTypes = [
    { id: 1, name: 'Income' },
    { id: 2, name: 'Expense' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionTypesController],
      providers: [
        {
          provide: TransactionTypesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockTransactionTypes),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionTypesController>(
      TransactionTypesController,
    );
    service = module.get<TransactionTypesService>(TransactionTypesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return transaction types with success response', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: 200,
        message: 'Transaction Types fetched successfully',
        data: mockTransactionTypes,
      });
      expect(successResponse).toHaveBeenCalledWith(
        mockTransactionTypes,
        'Transaction Types fetched successfully',
      );
    });
  });
});
