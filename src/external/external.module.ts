import { Module } from '@nestjs/common';
import { BillPaymentService } from '../bill-payment/service/bill-payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../wallet/entity/wallet.entity';
import { Transaction } from '../transaction/entity/transaction.entity';
import { BillTransaction } from '../bill-payment/entity/bill.entity';
import { WalletService } from '../wallet/service/wallet.service';
import { BillsPaymentExternalService } from './service/bills-payment.external.service';
import { ReversalProcessor } from '../queue/service/reversal-processor.entity';
import { QueueModule } from '../queue/queue.module';
import { QueueConfig } from '../config/queue/queue.config';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [BullModule.registerQueue({
    name: 'reversal',
  }), QueueModule, TypeOrmModule.forFeature([BillTransaction, Wallet, Transaction])],
  providers: [BillPaymentService, WalletService, BillsPaymentExternalService],
  exports: [BillsPaymentExternalService],
})
export class ExternalModule {
}
