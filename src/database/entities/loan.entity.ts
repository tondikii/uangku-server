import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LoanWallet } from './loan-wallet.entity';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', default: false })
  isGiven: boolean;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'bigint' })
  amount: number;

  @OneToMany(() => LoanWallet, (lw) => lw.loan)
  loanWallets: LoanWallet[];
}
