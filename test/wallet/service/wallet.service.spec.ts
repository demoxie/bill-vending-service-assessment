import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WalletService } from '../../../src/wallet/service/wallet.service';
import { Wallet } from '../../../src/wallet/entity/wallet.entity';
import { Transaction } from '../../../src/transaction/entity/transaction.entity';

describe('WalletService', () => {
  let service: WalletService;
  let walletRepo: Repository<Wallet>;
  let transactionRepo: Repository<Transaction>;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(Wallet),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            manager: {
              findOne: jest.fn(),
              save: jest.fn(),
            }
          },
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                findOne: jest.fn(),
                create: jest.fn(),
                save: jest.fn(),
              },
            }),
            transaction: jest.fn((cb) => cb({
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    walletRepo = module.get<Repository<Wallet>>(getRepositoryToken(Wallet));
    transactionRepo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new wallet if not found on getBalance', async () => {
    const mockWallet = { id: 'w1', userId: 'u1', balance: 0 };
    (walletRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    (walletRepo.create as jest.Mock).mockReturnValue(mockWallet);
    (walletRepo.save as jest.Mock).mockResolvedValue(mockWallet);

    const result = await service.getBalance('u1');
    expect(result).toEqual(mockWallet);
  });

  it('should throw if wallet exists on createWallet', async () => {
    (walletRepo.findOne as jest.Mock).mockResolvedValue({ id: 'wallet-1' });

    await expect(service.createWallet('user-1')).rejects.toThrow(BadRequestException);
  });

  it('should throw if wallet not found in creditWallet', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };

    await expect(service.creditWallet('w1', 100, { manager } as any)).rejects.toThrow(NotFoundException);
  });

  it('should return wallet on findByUserId', async () => {
    const wallet = { id: 'w1', userId: 'u1' };
    (walletRepo.findOne as jest.Mock).mockResolvedValue(wallet);

    const result = await service.findByUserId('u1');
    expect(result).toEqual(wallet);
  });

  it('should throw if wallet not found on findByUserId', async () => {
    (walletRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.findByUserId('u2')).rejects.toThrow(NotFoundException);
  });
});
