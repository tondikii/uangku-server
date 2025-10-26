import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Loan } from './loan.entity';
import { Wallet } from './wallet.entity';
import { moneyTransformer } from '../../common/transformers/money.transformer';

@Entity('loan_wallets')
export class LoanWallet {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Loan, (loan) => loan.loanWallets, { onDelete: 'CASCADE' })
  loan: Loan;

  @ManyToOne(() => Wallet, (wallet) => wallet.loanWallets, {
    onDelete: 'CASCADE',
  })
  wallet: Wallet;

  @Column({ type: 'boolean' })
  isIncoming: boolean;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: 0,
    transformer: moneyTransformer,
  })
  amount: number;
}
