import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionService } from '../../../src/transaction/service/transaction.service';
import { Transaction } from '../../../src/transaction/entity/transaction.entity';
import { TransactionStatus } from '../../../src/transaction/enums/transaction.enum';

describe('TransactionService', () => {
  let service: TransactionService;
  let repo: Repository<Transaction>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            manager: {
              create: jest.fn(),
              save: jest.fn(),
              findOne: jest.fn(),
            },
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    repo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new transaction', async () => {
    const createDto = {
      wallet: { id: 'wallet-1' },
      amount: 100,
      reference: 'TXN_1234',
    };

    const created = { id: 'txn-1', ...createDto, status: TransactionStatus.PENDING };

    repo.manager.create = jest.fn().mockReturnValue(created);
    repo.manager.save = jest.fn().mockResolvedValue(created);

    const result = await service.createTransaction(createDto as any);

    expect(repo.manager.create).toHaveBeenCalled();
    expect(repo.manager.save).toHaveBeenCalledWith(created);
    expect(result.status).toBe(TransactionStatus.PENDING);
  });

  it('should update transaction status', async () => {
    const existing = {
      id: 'txn-1',
      status: TransactionStatus.PENDING,
      failureReason: null,
    };

    repo.manager.findOne = jest.fn().mockResolvedValue(existing);
    repo.manager.save = jest.fn().mockResolvedValue({
      ...existing,
      status: TransactionStatus.COMPLETED,
    });

    const result = await service.updateTransactionStatus('txn-1', TransactionStatus.COMPLETED);

    expect(repo.manager.findOne).toHaveBeenCalled();
    expect(result.status).toBe(TransactionStatus.COMPLETED);
  });

  it('should throw error if transaction not found during update', async () => {
    repo.manager.findOne = jest.fn().mockResolvedValue(null);

    await expect(
      service.updateTransactionStatus('invalid-id', TransactionStatus.FAILED)
    ).rejects.toThrow('Transaction not found');
  });

  it('should find transaction by id', async () => {
    const txn = { id: 'txn-1' };
    repo.findOne = jest.fn().mockResolvedValue(txn);

    const result = await service.findById('txn-1');

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'txn-1' } });
    expect(result).toBe(txn);
  });

  it('should find transactions by wallet id', async () => {
    const txns = [{ id: 'txn-1' }, { id: 'txn-2' }];
    repo.find = jest.fn().mockResolvedValue(txns);

    const result = await service.findByWalletId('wallet-123');

    expect(repo.find).toHaveBeenCalledWith({
      where: { wallet: { id: 'wallet-123' } },
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual(txns);
  });
});
