import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { TransactionCategory } from './transaction-category.entity';
import { TransactionWallet } from './transaction-wallet.entity';
import { TransactionType } from './transaction-type.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  amount: number;

  @ManyToOne(() => TransactionType, { onDelete: 'CASCADE' })
  transactionType: TransactionType;

  @ManyToOne(() => TransactionCategory, (category) => category.transactions, {
    onDelete: 'SET NULL',
  })
  transactionCategory: TransactionCategory;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'bigint', nullable: true })
  adminFee?: number;

  @OneToMany(() => TransactionWallet, (tw) => tw.transaction)
  transactionWallets: TransactionWallet[];
}
