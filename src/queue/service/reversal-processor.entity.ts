import { ReversalJobData } from '../types/queue.types';
import { WalletService } from '../../wallet/service/wallet.service';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';

@Processor('reversal')
export class ReversalProcessor {
  private readonly logger = new Logger(ReversalProcessor.name);

  constructor(private walletService: WalletService) {
  }

  @Process('reverse-transaction')
  async handleReversal(job: Job<ReversalJobData>) {
    const { transactionId, billTransactionId, reason } = job.data;

    this.logger.log({
      action: 'processing_reversal',
      transactionId,
      billTransactionId,
      reason,
      attemptsMade: job.attemptsMade,
    });

    try {
      await this.walletService.reverseTransaction(transactionId);

      this.logger.log({
        action: 'reversal_completed',
        transactionId,
        billTransactionId,
      });
    } catch (error) {
      this.logger.error({
        action: 'reversal_failed',
        transactionId,
        billTransactionId,
        error: error.message,
        attemptsMade: job.attemptsMade,
      });
    }
  }
}
