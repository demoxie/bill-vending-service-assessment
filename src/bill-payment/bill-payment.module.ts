import { Module } from '@nestjs/common';
import { BillPaymentController } from './controller/bill-payment.controller';
import { BillPaymentService } from './service/bill-payment.service';
import { ExternalModule } from '../external/external.module';
import { WalletModule } from '../wallet/wallet.module';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillTransaction } from './entity/bill.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillTransaction]),
    BullModule.registerQueue({
      name: 'reversal',
    }),
    WalletModule,
    ExternalModule,
  ],
  controllers: [BillPaymentController],
  providers: [BillPaymentService]
})
export class BillPaymentModule {}
