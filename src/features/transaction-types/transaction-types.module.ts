import { Module } from '@nestjs/common';
import { TransactionTypesService } from './transaction-types.service';
import { TransactionTypesController } from './transaction-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionType } from '../../database/entities/transaction-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionType])],
  controllers: [TransactionTypesController],
  providers: [TransactionTypesService],
})
export class TransactionTypesModule {}
