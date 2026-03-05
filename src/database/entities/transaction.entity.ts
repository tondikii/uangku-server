import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TransactionCategory } from './transaction-category.entity';
import { TransactionWallet } from './transaction-wallet.entity';
import { TransactionType } from './transaction-type.entity';
import { moneyTransformer } from '../../common/transformers/money.transformer';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: 0,
    transformer: moneyTransformer,
  })
  amount: number;

  @ManyToOne(() => TransactionType, { onDelete: 'CASCADE' })
  transactionType: TransactionType;

  @ManyToOne(() => TransactionCategory, (category) => category.transactions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  transactionCategory: TransactionCategory;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: 0,
    transformer: moneyTransformer,
  })
  adminFee: number;

  @OneToMany(() => TransactionWallet, (tw) => tw.transaction)
  transactionWallets: TransactionWallet[];

  /**
   * ID unik dari sumber eksternal, format: "gmail_{gmailMessageId}"
   *
   * Digunakan untuk mencegah duplikasi — sebelum import email,
   * kita cek dulu apakah externalRef ini sudah ada di DB.
   * Kalau sudah ada, skip. Ini membuat sync bersifat idempotent
   * (boleh dijalankan berkali-kali, hasilnya sama).
   *
   * Null = transaksi manual dari user.
   */
  @Column({ nullable: true, type: 'varchar', length: 100 })
  externalRef: string | null;

  /**
   * Dari mana transaksi ini berasal:
   * - 'manual'           → diinput user lewat form
   * - 'gmail_scheduler'  → auto-import dari cron job jam 00:00
   * - 'gmail_manual'     → user klik tombol "Sync Gmail"
   */
  @Column({
    nullable: true,
    type: 'varchar',
    length: 20,
    default: 'manual',
  })
  importSource: 'manual' | 'gmail_scheduler' | 'gmail_manual' | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
