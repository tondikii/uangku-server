import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { Transaction } from './transaction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar?: string;

  /**
   * Refresh token dari Google OAuth.
   * Digunakan oleh scheduler untuk mendapatkan access token baru
   * tanpa user harus buka app.
   *
   * select: false → kolom ini TIDAK ikut di-load saat query biasa
   * (misalnya findOne user). Kita harus explicit minta kolom ini
   * supaya tidak bocor ke response API.
   *
   * Null = user belum connect Gmail atau token sudah expired.
   */
  @Column({ nullable: true, type: 'text', select: false })
  googleRefreshToken: string | null;

  /**
   * Timestamp terakhir kali Gmail di-sync (scheduler atau manual).
   * Digunakan sebagai titik awal "from date" saat fetch email berikutnya.
   *
   * Contoh flow:
   * - lastSyncAt = null → belum pernah sync → ambil dari awal hari ini (00:00)
   * - lastSyncAt = 12:00 → user klik sync jam 13:00 → ambil email 12:00–13:00
   * - Scheduler jalan jam 00:00 → ambil email dari lastSyncAt sampai 00:00
   */
  @Column({ nullable: true, type: 'timestamp' })
  gmailLastSyncAt: Date | null;

  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallets: Wallet[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
