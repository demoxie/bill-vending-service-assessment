import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { ReversalProcessor } from '../../../src/queue/service/reversal-processor.entity';
import { WalletService } from '../../../src/wallet/service/wallet.service';
import { Logger } from '@nestjs/common';

describe('ReversalProcessor', () => {
  let processor: ReversalProcessor;
  let walletService: WalletService;

  const mockJob = (data) => ({
    data,
    attemptsMade: 1,
  }) as unknown as Job;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReversalProcessor,
        {
          provide: WalletService,
          useValue: {
            reverseTransaction: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<ReversalProcessor>(ReversalProcessor);
    walletService = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should process reversal successfully', async () => {
    const job = mockJob({
      transactionId: 'txn-123',
      billTransactionId: 'bill-456',
      reason: 'Testing success',
    });

    await processor.handleReversal(job);

    expect(walletService.reverseTransaction).toHaveBeenCalledWith('txn-123');
  });

  it('should log error on reversal failure', async () => {
    const job = mockJob({
      transactionId: 'txn-789',
      billTransactionId: 'bill-999',
      reason: 'Testing failure',
    });

    jest
      .spyOn(walletService, 'reverseTransaction')
      .mockRejectedValueOnce(new Error('Reversal failed'));

    await processor.handleReversal(job);

    expect(walletService.reverseTransaction).toHaveBeenCalledWith('txn-789');
  });
});
