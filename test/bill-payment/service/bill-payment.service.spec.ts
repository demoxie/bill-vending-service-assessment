import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { BillPaymentService } from '../../../src/bill-payment/service/bill-payment.service';
import { BillTransaction } from '../../../src/bill-payment/entity/bill.entity';
import { WalletService } from '../../../src/wallet/service/wallet.service';
import { BillsPaymentExternalService } from '../../../src/external/service/bills-payment.external.service';
import { TransactionStatus } from '../../../src/transaction/enums/transaction.enum';
import { BillType } from '../../../src/bill-payment/enums/bill.enum';
import { Logger } from '@nestjs/common';

describe('BillPaymentService', () => {
  let service: BillPaymentService;
  let repo: Repository<BillTransaction>;
  let walletService: WalletService;
  let externalService: BillsPaymentExternalService;
  let reversalQueue: Queue;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillPaymentService,
        {
          provide: getRepositoryToken(BillTransaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: WalletService,
          useValue: {
            debitWallet: jest.fn(),
          },
        },
        {
          provide: BillsPaymentExternalService,
          useValue: {
            purchaseBill: jest.fn(),
          },
        },
        {
          provide: 'BullQueue_reversal',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BillPaymentService>(BillPaymentService);
    repo = module.get<Repository<BillTransaction>>(getRepositoryToken(BillTransaction));
    walletService = module.get<WalletService>(WalletService);
    externalService = module.get<BillsPaymentExternalService>(BillsPaymentExternalService);
    reversalQueue = module.get<Queue>('BullQueue_reversal');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create and process a bill transaction', async () => {
    const dto = {
      userId: 'user-123',
      billType: BillType.ELECTRICITY,
      amount: 500,
      meterNumber: '1234567890',
      customerName: 'John Doe',
    };

    const createdTransaction = {
      id: 'trans-1',
      ...dto,
      transactionId: null,
      status: TransactionStatus.PENDING,
    };

    const walletTxn = { id: 'wallet-txn-id' };
    const apiResponse = { reference: 'ref-123', token: 'tok-abc' };

    repo.create = jest.fn().mockReturnValue(createdTransaction);
    repo.save = jest.fn().mockResolvedValue(createdTransaction);
    walletService.debitWallet = jest.fn().mockResolvedValue(walletTxn);
    externalService.purchaseBill = jest.fn().mockResolvedValue(apiResponse);

    const result = await service.purchaseBill(dto);

    expect(repo.create).toHaveBeenCalled();
    expect(walletService.debitWallet).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledTimes(3); // initial save, update with txnId, final save after API
    expect(result).toMatchObject({
      userId: dto.userId,
      billType: dto.billType,
      amount: dto.amount,
    });
  });

  it('should handle external API failure and queue a reversal', async () => {
    const billTransaction = {
      id: 'bill-txn-id',
      transactionId: 'wallet-txn-id',
      billType: 'electricity',
      amount: 100,
      meterNumber: '123456',
      customerName: 'Jane',
      status: TransactionStatus.PENDING,
    };

    repo.save = jest.fn().mockResolvedValue({});
    externalService.purchaseBill = jest.fn().mockRejectedValue(new Error('API failure'));
    reversalQueue.add = jest.fn();

    await service.processBillPayment(billTransaction as any);

    expect(repo.save).toHaveBeenCalled();
    expect(reversalQueue.add).toHaveBeenCalledWith(
      'reverse-transaction',
      expect.objectContaining({
        transactionId: 'wallet-txn-id',
        reason: 'External API failure',
      }),
      expect.any(Object)
    );
  });
});
