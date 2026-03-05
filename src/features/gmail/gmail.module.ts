import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { GmailController } from './gmail.controller';
import { GmailSyncService } from './gmail-sync.service';
import { GmailTokenService } from './gmail-token.service';
import { GmailScheduler } from './gmail.scheduler';
import { User } from '../../database/entities/user.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { TransactionWallet } from '../../database/entities/transaction-wallet.entity';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import {
  GopayParser,
  OvoParser,
  DanaParser,
  BcaParser,
  MandiriParser,
  BniParser,
  BriParser,
  SeabankParser,
  JagoParser,
  GenericBankParser,
} from './parsers';

const PARSERS = [
  GopayParser,
  OvoParser,
  DanaParser,
  BcaParser,
  MandiriParser,
  BniParser,
  BriParser,
  SeabankParser,
  JagoParser,
  GenericBankParser,
];

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      User,
      Transaction,
      TransactionWallet,
      TransactionCategory,
      Wallet,
    ]),
  ],
  controllers: [GmailController],
  providers: [GmailSyncService, GmailTokenService, GmailScheduler, ...PARSERS],
})
export class GmailModule {}
