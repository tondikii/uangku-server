import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { HttpStatus } from '@nestjs/common';

describe('TransactionsController', () => {
  let controller: TransactionsController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: mockService }],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    jest.clearAllMocks();
  });

  it('should create transaction', async () => {
    const dto = { amount: 1000 };
    const user = { id: 1 };
    mockService.create.mockResolvedValue(dto);

    const result = await controller.create(dto as any, { user } as any);
    expect(result.statusCode).toBe(HttpStatus.CREATED);
    expect(mockService.create).toHaveBeenCalledWith(user, dto);
  });

  it('should return paginated transactions', async () => {
    const mockResult = { data: [], pagination: {} };
    mockService.findAll.mockResolvedValue(mockResult);
    const req = { user: { id: 1 } };

    const result = await controller.findAll(req, 1, 10);
    expect(result.statusCode).toBe(HttpStatus.OK);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('should find one transaction', async () => {
    mockService.findOne.mockResolvedValue({ id: 1 });
    const result = await controller.findOne(1);
    expect(result.statusCode).toBe(HttpStatus.OK);
  });

  it('should update a transaction', async () => {
    mockService.update.mockResolvedValue({ id: 1, amount: 200 });
    const result = await controller.update(1, { amount: 200 } as any);
    expect(result.statusCode).toBe(HttpStatus.OK);
  });

  it('should remove a transaction', async () => {
    mockService.remove.mockResolvedValue({ deleted: true });
    const result = await controller.remove(1);
    // ✅ Fix: Expect 204 NO_CONTENT instead of 200 OK
    expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
    expect(result.data).toBeNull();
  });
});
