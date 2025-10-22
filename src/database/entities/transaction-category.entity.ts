import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TransactionType } from './transaction-type.entity';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

@Entity('transaction_categories')
export class TransactionCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => TransactionType, (type) => type.categories, {
    onDelete: 'CASCADE',
  })
  transactionType: TransactionType;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(
    () => Transaction,
    (transaction) => transaction.transactionCategory,
  )
  transactions: Transaction[];
}
