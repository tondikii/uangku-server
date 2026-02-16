import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../database/entities/user.entity';
import { Wallet } from '../database/entities/wallet.entity';
import { TransactionType } from '../database/entities/transaction-type.entity';
import { TransactionCategory } from '../database/entities/transaction-category.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { TransactionWallet } from '../database/entities/transaction-wallet.entity';
import { Loan } from '../database/entities/loan.entity';
import { LoanWallet } from '../database/entities/loan-wallet.entity';

config(); // Load .env file

export default new DataSource({
  type: 'postgres',
  // url: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false,
  // },
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.DATABASE_NAME,
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
