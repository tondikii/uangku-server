import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { TransactionWallet } from './transaction-wallet.entity';
import { LoanWallet } from './loan-wallet.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'bigint', default: 0 })
  balance: number;

  @ManyToOne(() => User, (user) => user.wallets, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => TransactionWallet, (tw) => tw.wallet)
  transactionWallets: TransactionWallet[];

  @OneToMany(() => LoanWallet, (lw) => lw.wallet)
  loanWallets: LoanWallet[];
}
