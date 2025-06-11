import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import { TransactionService } from '../../transaction/service/transaction.service';
import { WalletService } from '../../wallet/service/wallet.service';
import { TransactionStatus } from '../../transaction/enums/transaction.enum';
import { DataSource } from 'typeorm'; // For reversal worker

interface ReversalMessage {
  transactionId: string;
  userId: string;
  amount: number;
  reason: string;
}

@Injectable()
export class MockQueueService implements OnModuleInit {
  private reversalQueue = new Subject<ReversalMessage>();

  constructor(
    private readonly transactionService: TransactionService,
    private readonly walletService: WalletService,
    private dataSource: DataSource,
  ) {}

  onModuleInit() {
    this.startReversalWorker();
  }

  async enqueueReversal(message: ReversalMessage): Promise<void> {
    console.log(`MockQueueService: Enqueueing reversal for transaction ${message.transactionId}`);
    this.reversalQueue.next(message);
  }

  private startReversalWorker() {
    // This simulates a background worker consuming from the queue
    this.reversalQueue.subscribe(async (message) => {
      console.log(`MockQueueService Worker: Processing reversal for transaction ${message.transactionId}`);
      const queryRunner = this.dataSource.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();
      await this.transactionService.updateTransactionStatus(message.transactionId, TransactionStatus.REVERSAL_PENDING);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      try {
        const wallet = await this.walletService.findByUserId(message.userId);
        // Perform the actual fund credit
        await this.walletService.creditWallet(
          wallet.id,
          message.amount,
          queryRunner,
        );
        await this.transactionService.updateTransactionStatus(message.transactionId, TransactionStatus.REVERSED);
        console.log(`MockQueueService Worker: Successfully reversed transaction ${message.transactionId}`);
      } catch (error) {
        console.error(`MockQueueService Worker: Failed to reverse transaction ${message.transactionId}:`, error); // Structured logging
        // You might want to implement retry logic here for real-world scenarios
        // For this assessment, simply log the failure.
        // The transaction will remain in REVERSAL_PENDING or you could add a REVERSAL_FAILED status
      }
    });
  }
}
