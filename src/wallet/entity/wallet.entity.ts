import { Column, Entity, Index, OneToMany, VersionColumn } from 'typeorm';

import { BaseEntity } from '../../common/models/base.entity';
import { Transaction } from '../../transaction/entity/transaction.entity';

@Entity('wallets')
@Index(['userId'], { unique: true })
export class Wallet extends BaseEntity{
  @Column()
  userId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @VersionColumn()
  version: number;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];
}
