import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Wallet } from '../../database/entities/wallet.entity';

describe('WalletsService', () => {
  let service: WalletsService;
  let repo: Repository<Wallet>;

  const mockUser: any = { id: 1 };
  const mockWallet: any = { id: 1, name: 'Cash', user: mockUser, balance: 100 };

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockWallet]),
    findOne: jest.fn().mockResolvedValue(mockWallet),
    create: jest.fn().mockReturnValue(mockWallet),
    save: jest.fn().mockResolvedValue(mockWallet),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: getRepositoryToken(Wallet), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
    repo = module.get<Repository<Wallet>>(getRepositoryToken(Wallet));
  });

  it('should return all wallets for a user', async () => {
    const result = await service.findAll(mockUser);
    expect(repo.find).toHaveBeenCalled();
    expect(result).toEqual([mockWallet]);
  });

  it('should return a single wallet', async () => {
    const result = await service.findOne(1, mockUser);
    expect(repo.findOne).toHaveBeenCalled();
    expect(result).toEqual(mockWallet);
  });

  it('should create a wallet', async () => {
    const dto = { name: 'Cash' };
    const result = await service.create(mockUser, dto);
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(result).toEqual(mockWallet);
  });

  it('should update a wallet', async () => {
    const dto = { name: 'Updated Cash' };
    jest.spyOn(repo, 'findOne').mockResolvedValueOnce(mockWallet);
    const result = await service.update(1, mockUser, dto);
    expect(repo.save).toHaveBeenCalled();
    expect(result).toEqual(mockWallet);
  });

  it('should delete a wallet', async () => {
    const result = await service.remove(1, mockUser);
    expect(repo.remove).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true });
  });
});
