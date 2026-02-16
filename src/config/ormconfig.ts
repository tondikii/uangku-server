import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Wallet } from '../database/entities/wallet.entity';
import { TransactionType } from '../database/entities/transaction-type.entity';
import { TransactionCategory } from '../database/entities/transaction-category.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { TransactionWallet } from '../database/entities/transaction-wallet.entity';
import { Loan } from '../database/entities/loan.entity';
import { LoanWallet } from '../database/entities/loan-wallet.entity';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  // url: configService.get('DATABASE_URL'),
  // ssl: {
  //   rejectUnauthorized: false, // Required for Supabase
  // },
  host: configService.get<string>('POSTGRES_HOST'),
  port: configService.get<number>('POSTGRES_PORT'),
  username: configService.get<string>('POSTGRES_USERNAME'),
  password: configService.get<string>('POSTGRES_PASSWORD'),
  database: configService.get<string>('DATABASE_NAME'),
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
  synchronize: false, // Keep this false in production
  logging: configService.get('NODE_ENV') === 'development',
  extra: {
    max: 10, // Connection pool size
    connectionTimeoutMillis: 10000,
  },
});
