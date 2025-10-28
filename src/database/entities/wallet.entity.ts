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
import { TransactionWallet } from './transaction-wallet.entity';
import { LoanWallet } from './loan-wallet.entity';
import { moneyTransformer } from '../../common/transformers/money.transformer';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: 0,
    transformer: moneyTransformer,
  })
  balance: number;

  @ManyToOne(() => User, (user) => user.wallets, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => TransactionWallet, (tw) => tw.wallet)
  transactionWallets: TransactionWallet[];

  @OneToMany(() => LoanWallet, (lw) => lw.wallet)
  loanWallets: LoanWallet[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
