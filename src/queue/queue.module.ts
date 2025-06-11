import { Module } from '@nestjs/common';
import { ReversalProcessor } from './service/reversal-processor.entity';
import { WalletService } from '../wallet/service/wallet.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../wallet/entity/wallet.entity';
import { Transaction } from '../transaction/entity/transaction.entity';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [    BullModule.registerQueue({ name: 'reversal' }),TypeOrmModule.forFeature([Wallet, Transaction])],
  controllers: [],
  providers: [ReversalProcessor, WalletService],
  exports: [ReversalProcessor],
})
export class QueueModule {}
