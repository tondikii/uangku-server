import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LoanWallet } from './loan-wallet.entity';
import { moneyTransformer } from '../../common/transformers/money.transformer';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', default: false })
  isGiven: boolean;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: 0,
    transformer: moneyTransformer,
  })
  amount: number;

  @OneToMany(() => LoanWallet, (lw) => lw.loan)
  loanWallets: LoanWallet[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp' })
  givenDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidDate: Date | null;
}
