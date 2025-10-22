import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Loan } from './loan.entity';
import { Wallet } from './wallet.entity';

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

  @Column({ type: 'bigint' })
  amount: number;
}
