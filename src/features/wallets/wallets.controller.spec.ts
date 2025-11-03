import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { HttpStatus } from '@nestjs/common';
import { successResponse } from '../../common/utils/response.util';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet } from '../../database/entities/wallet.entity';

jest.mock('../../common/utils/response.util', () => ({
  successResponse: jest.fn((data, message, statusCode) => ({
    statusCode,
    success: true,
    message,
    data,
  })),
}));

describe('WalletsController', () => {
  let controller: WalletsController;
  let service: jest.Mocked<WalletsService>;

  const mockUser = { id: 1, email: 'user@mail.com' } as any;

  const mockWallet: Wallet = {
    id: 1,
    name: 'Main Wallet',
    balance: 100000,
    user: mockUser,
    transactionWallets: [],
    loanWallets: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Wallet;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        {
          provide: WalletsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
    service = module.get(WalletsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all wallets for the user', async () => {
      service.findAll.mockResolvedValue([mockWallet]);

      const result = await controller.findAll({ user: mockUser });

      expect(service.findAll).toHaveBeenCalledWith(mockUser);
      expect(successResponse).toHaveBeenCalledWith(
        [mockWallet],
        'Wallets fetched successfully',
        HttpStatus.OK,
      );
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return one wallet by id', async () => {
      service.findOne.mockResolvedValue(mockWallet);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(successResponse).toHaveBeenCalledWith(
        mockWallet,
        'Wallet fetched successfully',
        HttpStatus.OK,
      );
      expect(result.data).toEqual(mockWallet);
    });
  });

  describe('create', () => {
    it('should create a wallet', async () => {
      const dto: CreateWalletDto = { name: 'New Wallet', balance: 50000 };
      service.create.mockResolvedValue({ ...mockWallet, ...dto });

      const result = await controller.create(dto, { user: mockUser });

      expect(service.create).toHaveBeenCalledWith(mockUser, dto);
      expect(successResponse).toHaveBeenCalledWith(
        { ...mockWallet, ...dto },
        'Wallet created successfully',
        HttpStatus.CREATED,
      );
      expect(result.statusCode).toBe(HttpStatus.CREATED);
    });
  });

  describe('update', () => {
    it('should update a wallet', async () => {
      const dto: UpdateWalletDto = { balance: 200000 };
      service.update.mockResolvedValue({ ...mockWallet, ...dto });

      const result = await controller.update(1, dto, { user: mockUser });

      expect(service.update).toHaveBeenCalledWith(mockUser, 1, dto);
      expect(successResponse).toHaveBeenCalledWith(
        { ...mockWallet, ...dto },
        'Wallet updated successfully',
        HttpStatus.OK,
      );
      expect(result.data.balance).toBe(200000);
    });
  });

  describe('remove', () => {
    it('should remove a wallet', async () => {
      service.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      // ✅ Fix: Expect 204 NO_CONTENT and null data
      expect(successResponse).toHaveBeenCalledWith(
        null,
        'Wallet deleted successfully',
        HttpStatus.NO_CONTENT,
      );
      expect(result.statusCode).toBe(HttpStatus.NO_CONTENT);
      expect(result.data).toBeNull();
    });
  });
});
