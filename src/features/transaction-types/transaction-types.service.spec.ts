import { Test, TestingModule } from '@nestjs/testing';
import { TransactionTypesService } from './transaction-types.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionType } from '../../database/entities/transaction-type.entity';
import { Repository } from 'typeorm';

describe('TransactionTypesService', () => {
  let service: TransactionTypesService;
  let repo: jest.Mocked<Repository<TransactionType>>;

  const mockTransactionTypes = [
    { id: 1, name: 'Income' },
    { id: 2, name: 'Expense' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionTypesService,
        {
          provide: getRepositoryToken(TransactionType),
          useValue: {
            find: jest.fn().mockResolvedValue(mockTransactionTypes),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionTypesService>(TransactionTypesService);
    repo = module.get(getRepositoryToken(TransactionType));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all transaction types', async () => {
      const result = await service.findAll();
      expect(repo.find).toHaveBeenCalled();
      expect(result).toEqual(mockTransactionTypes);
    });
  });
});
