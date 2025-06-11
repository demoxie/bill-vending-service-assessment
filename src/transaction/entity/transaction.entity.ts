
import { Wallet } from '../../wallet/entity/wallet.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TransactionStatus, TransactionType } from '../enums/transaction.enum';
import { TransactionMetadata } from '../types/transaction.types';
import { BaseEntity } from '../../common/models/base.entity';
@Entity('transactions')
@Index(['walletId', 'createdAt'])
@Index(['reference'])
export class Transaction extends BaseEntity{

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  failureReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: TransactionMetadata;

  @Column()
  walletId: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ nullable: true })
  externalTransactionId: string;

  @Column({ nullable: true })
  meterNumber: string;
}
