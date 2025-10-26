import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionType } from '../../database/entities/transaction-type.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionTypesService {
  constructor(
    @InjectRepository(TransactionType)
    private readonly transactionTypeRepo: Repository<TransactionType>,
  ) {}

  findAll() {
    const transactionTypes = this.transactionTypeRepo.find();
    return transactionTypes;
  }
}
