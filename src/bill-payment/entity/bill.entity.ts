import { BaseEntity } from '../../common/models/base.entity';
import { Column, Entity, Index } from 'typeorm';
import { TransactionStatus } from '../../transaction/enums/transaction.enum';
import { BillType } from '../enums/bill.enum';

@Entity('bill_transactions')
@Index(['userId', 'createdAt'])
@Index(['externalReference'])
export class BillTransaction extends BaseEntity{
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId: string;

  @Column({ name: 'bill_type', type: 'enum', enum: BillType })
  billType: BillType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ name: 'meter_number', type: 'varchar', length: 255, nullable: true })
  meterNumber: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 255, nullable: true })
  customerName: string;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ name: 'external_reference', type: 'varchar', length: 255, nullable: true })
  externalReference: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;
}
