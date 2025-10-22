import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Wallet } from './wallet.entity';

@Entity('transaction_wallets')
export class TransactionWallet {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Transaction,
    (transaction) => transaction.transactionWallets,
    { onDelete: 'CASCADE' },
  )
  transaction: Transaction;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactionWallets, {
    onDelete: 'CASCADE',
  })
  wallet: Wallet;

  @Column({ type: 'boolean' })
  isIncoming: boolean; // true = masuk, false = keluar

  @Column({ type: 'bigint' })
  amount: number;
}
