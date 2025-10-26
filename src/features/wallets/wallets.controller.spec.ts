import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { HttpStatus } from '@nestjs/common';

jest.mock('../../common/utils/response.util', () => ({
  successResponse: jest.fn((data, message, status) => ({
    statusCode: status,
    message,
    data,
  })),
}));

describe('WalletsController', () => {
  let controller: WalletsController;
  let service: WalletsService;

  const mockUser = { id: 1 };
  const mockWallet = { id: 1, name: 'Cash', balance: 1000 };

  const mockService = {
    findAll: jest.fn().mockResolvedValue([mockWallet]),
    findOne: jest.fn().mockResolvedValue(mockWallet),
    create: jest.fn().mockResolvedValue(mockWallet),
    update: jest.fn().mockResolvedValue(mockWallet),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [{ provide: WalletsService, useValue: mockService }],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
    service = module.get<WalletsService>(WalletsService);
  });

  it('should return all wallets', async () => {
    const result = await controller.findAll({ user: mockUser });
    expect(service.findAll).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Wallets fetched successfully',
      data: [mockWallet],
    });
  });

  it('should return one wallet', async () => {
    const result = await controller.findOne(10);
    expect(service.findOne).toHaveBeenCalledWith(10);
    expect(result.statusCode).toBe(HttpStatus.OK);
  });

  it('should create wallet', async () => {
    const dto = { name: 'New Wallet' };
    const result = await controller.create(dto, { user: mockUser });
    expect(service.create).toHaveBeenCalledWith(mockUser, dto);
    expect(result.statusCode).toBe(HttpStatus.CREATED);
  });

  it('should update wallet', async () => {
    const dto = { name: 'Updated Wallet' };
    const result = await controller.update(10, dto);
    expect(service.update).toHaveBeenCalledWith(10, dto);
    expect(result.statusCode).toBe(HttpStatus.OK);
  });

  it('should delete wallet', async () => {
    const result = await controller.remove(10);
    expect(service.remove).toHaveBeenCalledWith(10);
    expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
  });
});
