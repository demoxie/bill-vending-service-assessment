import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from '../../../src/wallet/controller/wallet.controller';
import { WalletService } from '../../../src/wallet/service/wallet.service';
import { TransactionStatus, TransactionType } from '../../../src/transaction/enums/transaction.enum';
import { Wallet } from '../../../src/wallet/entity/wallet.entity';

describe('WalletController', () => {
  let controller: WalletController;
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: {
            fundWallet: jest.fn(),
            getBalance: jest.fn(),
            getTransactionHistory: jest.fn(),
            createWallet: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should fund a wallet and return WalletResponseDto', async () => {
    const wallet = {
      id: 'wallet-1',
      userId: 'user-1',
      balance: 1000,
      version: 1,
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(service, 'fundWallet').mockResolvedValue(wallet);

    const result = await controller.fundWallet({ userId: 'user-1', amount: 1000, reference: 'test-ref' });

    expect(result.userId).toBe(wallet.userId);
    expect(result.balance).toBe(wallet.balance);
  });

  it('should get wallet balance', async () => {
    const wallet = {
      id: 'wallet-2',
      userId: 'user-2',
      balance: 500,
      version: 1,
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(service, 'getBalance').mockResolvedValue(wallet);

    const result = await controller.getBalance('user-2');

    expect(result.userId).toBe(wallet.userId);
    expect(result.balance).toBe(wallet.balance);
  });

  it('should return transaction history', async () => {
    const transactions = [
      {
        id: 'txn-1',
        type: TransactionType.CREDIT,
        amount: 200,
        reference: 'ref-1',
        status: TransactionStatus.COMPLETED,
       externalTransactionId: null,
        meterNumber: null,
        wallet: new Wallet(),
        userId: 'user-1',
        metadata: { description: 'Test' },
        walletId: 'wallet-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    jest.spyOn(service, 'getTransactionHistory').mockResolvedValue(transactions);

    const result = await controller.getTransactionHistory('user-3', 10, 0);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('txn-1');
    expect(result[0].type).toBe(TransactionType.CREDIT);
  });

  it('should create a new wallet', async () => {
    const wallet = {
      id: 'wallet-3',
      userId: 'user-4',
      balance: 0,
      version: 1,
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(service, 'createWallet').mockResolvedValue(wallet);

    const result = await controller.createWallet({ userId: 'user-4' });

    expect(result.userId).toBe('user-4');
    expect(result.balance).toBe(0);
  });
});
