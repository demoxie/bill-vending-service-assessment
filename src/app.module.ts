import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { BillPaymentModule } from './bill-payment/bill-payment.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueModule } from './queue/queue.module';
import { ExternalModule } from './external/external.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseConfig } from './config/database/database.config';
import { BullModule } from '@nestjs/bull';
import { QueueConfig } from './config/queue/queue.config';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }),
    TypeOrmModule.forRootAsync({
    useClass: DatabaseConfig,
  }),
    WalletModule,
    BullModule.forRootAsync({
      useClass: QueueConfig,
      imports: [ConfigModule],
      inject: [ConfigModule],
    }),
    TransactionModule,
    QueueModule,
    ExternalModule,
    BillPaymentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
