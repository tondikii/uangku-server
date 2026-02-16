import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './features/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './config/ormconfig';
import { WalletsModule } from './features/wallets/wallets.module';
import { TransactionTypesModule } from './features/transaction-types/transaction-types.module';
import { TransactionCategoriesModule } from './features/transaction-categories/transaction-categories.module';
import { TransactionsModule } from './features/transactions/transactions.module';
import { ReportsModule } from './features/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    WalletsModule,
    TransactionTypesModule,
    TransactionCategoriesModule,
    TransactionsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
