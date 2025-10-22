import { DataSource } from 'typeorm';
import { User } from '../database/entities/user.entity'; // contoh entity
import { Wallet } from '../database/entities/wallet.entity';
import { TransactionType } from '../database/entities/transaction-type.entity';
import { TransactionCategory } from '../database/entities/transaction-category.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { TransactionWallet } from '../database/entities/transaction-wallet.entity';
import { Loan } from '../database/entities/loan.entity';
import { LoanWallet } from '../database/entities/loan-wallet.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres', // sesuaikan
  password: 'postgres',
  database: 'uangku',
  entities: [
    User,
    Wallet,
    Transaction,
    TransactionWallet,
    TransactionCategory,
    TransactionType,
    Loan,
    LoanWallet,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
