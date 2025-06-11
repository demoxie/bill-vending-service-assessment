import {
  Injectable,
  Logger
} from '@nestjs/common';
import { PurchaseBillDto } from '../dto/bill.dto';
import { BillTransaction } from '../entity/bill.entity';
import { TransactionStatus } from '../../transaction/enums/transaction.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletService } from '../../wallet/service/wallet.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BillsPaymentExternalService } from '../../external/service/bills-payment.external.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BillPaymentService {
  private readonly logger = new Logger(BillPaymentService.name);

  constructor(
    @InjectRepository(BillTransaction)
    private billTransactionRepository: Repository<BillTransaction>,
    private walletService: WalletService,
    private billPaymentApiService: BillsPaymentExternalService,
    @InjectQueue('reversal') private reversalQueue: Queue,
  ) {}

  async purchaseBill(purchaseBillDto: PurchaseBillDto): Promise<BillTransaction> {
    const { userId, billType, amount, meterNumber, customerName } = purchaseBillDto;
    this.logger.log({
      action: 'bill_purchase_initiated',
      userId,
      billType,
      amount,
      meterNumber,
    });

    // Create pending bill transaction
    const billTransaction = this.billTransactionRepository.create({
      userId: userId,
      transactionId: null,
      billType: billType,
      amount: Number(amount),
      meterNumber: meterNumber,
      customerName: customerName,
      status: TransactionStatus.PENDING,
    });
    await this.billTransactionRepository.save(billTransaction);

    try {
      // Debit wallet first
      const walletTransaction = await this.walletService.debitWallet(
        userId,
        amount,
        `BILL_${billTransaction.id}`,
        {
          billType,
          meterNumber,
          customerName,
        }
      );

      // Update bill transaction with wallet transaction ID
      billTransaction.transactionId = walletTransaction.id;
      await this.billTransactionRepository.save(billTransaction);

      // Process bill payment asynchronously
      await this.processBillPayment(billTransaction);

      return billTransaction;
    } catch (error) {
      // Mark bill transaction as failed
      billTransaction.status = TransactionStatus.FAILED;
      billTransaction.failureReason = error.message;
      await this.billTransactionRepository.save(billTransaction);

      this.logger.error({
        action: 'bill_purchase_failed',
        billTransactionId: billTransaction.id,
        userId,
        error: error.message,
      });

      throw error;
    }
  }

  public async processBillPayment(billTransaction: BillTransaction): Promise<void> {
    try {
      this.logger.log({
        action: 'processing_bill_payment',
        billTransactionId: billTransaction.id,
      });

      // Call external API
      const result = await this.billPaymentApiService.purchaseBill({
        billType: billTransaction.billType,
        amount: billTransaction.amount,
        meterNumber: billTransaction.meterNumber,
        customerName: billTransaction.customerName,
      });

      // Update bill transaction with success result
      billTransaction.status = TransactionStatus.COMPLETED;
      billTransaction.externalReference = result.reference;
      billTransaction.token = result.token;
      await this.billTransactionRepository.save(billTransaction);

      this.logger.log({
        action: 'bill_payment_completed',
        billTransactionId: billTransaction.id,
        externalReference: result.reference,
        token: result.token,
      });
    } catch (error) {
      this.logger.error({
        action: 'bill_payment_failed',
        billTransactionId: billTransaction.id,
        error: error.message,
      });

      // Mark as failed
      billTransaction.status = TransactionStatus.FAILED;
      billTransaction.failureReason = error.message;
      await this.billTransactionRepository.save(billTransaction);

      // Queue reversal job
      await this.reversalQueue.add('reverse-transaction', {
        transactionId: billTransaction.transactionId,
        billTransactionId: billTransaction.id,
        reason: 'External API failure',
      }, {
        delay: 5000, // 5 second delay
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
    }
  }

  async getBillTransactions(userId: string, limit = 20, offset = 0): Promise<BillTransaction[]> {
    return this.billTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getBillTransactionById(id: string): Promise<BillTransaction> {
    return this.billTransactionRepository.findOne({ where: { id } });
  }
}
