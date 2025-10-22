import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TransactionCategory } from './transaction-category.entity';

@Entity('transaction_types')
export class TransactionType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g. "income", "expense", "transfer"

  @OneToMany(() => TransactionCategory, (category) => category.transactionType)
  categories: TransactionCategory[];
}
