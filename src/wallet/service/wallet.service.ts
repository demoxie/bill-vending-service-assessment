import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, DataSource, QueryRunner, Repository } from 'typeorm';
import { Wallet } from '../entity/wallet.entity';
import { FundWalletDto } from '../dto/wallet.dto';
import { TransactionStatus, TransactionType } from '../../transaction/enums/transaction.enum';
import { ConcurrentTransactionException, InsufficientFundsException } from '../../common/exceptions/exceptions';
import { Transaction } from '../../transaction/entity/transaction.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  async fundWallet(fundWalletDto: FundWalletDto): Promise<Wallet> {
    const { userId, amount, reference } = fundWalletDto;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        wallet = queryRunner.manager.create(Wallet, {
          id: uuidv4(),
          userId,
          balance: 0,
        });
      }

      // Update wallet balance
      wallet.balance = Number(wallet.balance) + Number(amount);
      await queryRunner.manager.save(wallet);

      // Record the transaction
      const transaction = queryRunner.manager.create(Transaction, {
        id: uuidv4(),
        walletId: wallet.id,
        userId: userId,
        type: TransactionType.CREDIT,
        amount: Number(amount),
        reference: reference || `FUND_${Date.now()}`,
        status: TransactionStatus.COMPLETED,
        metadata: {
          description: 'Wallet funding',
          source: 'internal',
        },
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      this.logger.log({
        action: 'wallet_funded',
        userId,
        amount,
        newBalance: wallet.balance,
        transactionId: transaction.id,
      });

      return wallet;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to fund wallet for user ${userId}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getBalance(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = this.walletRepository.create({
        id: uuidv4(),
        userId,
        balance: 0,
      });
      await this.walletRepository.save(wallet);
    }

    return wallet;
  }

  async debitWallet(userId: string, amount: number, reference: string, metadata?: any): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!wallet) {
        throw new InsufficientFundsException(0, amount);
      }

      if (Number(wallet.balance) < Number(amount)) {
        throw new InsufficientFundsException(Number(wallet.balance), Number(amount));
      }

      // Update balance
      const previousBalance = Number(wallet.balance);
      wallet.balance = previousBalance - Number(amount);

      try {
        await manager.save(wallet);
      } catch (error) {
        if (error.code === '23000' || error.message.includes('version')) {
          throw new ConcurrentTransactionException();
        }
        throw error;
      }

      // Create transaction record
      const transaction = manager.create(Transaction, {
        userId: userId,
        walletId: wallet.id,
        type: TransactionType.DEBIT,
        amount: Number(amount),
        reference,
        status: TransactionStatus.COMPLETED,
        metadata,
      });
      await manager.save(transaction);

      this.logger.log({
        action: 'wallet_debited',
        userId,
        amount,
        previousBalance,
        newBalance: wallet.balance,
        transactionId: transaction.id,
      });

      return transaction;
    });
  }

  async reverseTransaction(transactionId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const originalTransaction = await manager.findOne(Transaction, {
        where: { id: transactionId },
        relations: ['wallet'],
      });

      if (!originalTransaction) {
        this.logger.warn(`Transaction ${transactionId} not found for reversal`);
        return;
      }

      if (originalTransaction.status === TransactionStatus.REVERSED) {
        this.logger.warn(`Transaction ${transactionId} already reversed`);
        return;
      }

      // Lock the wallet
      const wallet = await manager.findOne(Wallet, {
        where: { id: originalTransaction.wallet.id },
        lock: { mode: 'pessimistic_write' }
      });

      if (!wallet) {
        this.logger.error(`Wallet not found for reversal: ${originalTransaction.wallet.id}`);
        return;
      }

      // Reverse the transaction
      if (originalTransaction.type === TransactionType.DEBIT) {
        wallet.balance = Number(wallet.balance) + Number(originalTransaction.amount);
      } else {
        wallet.balance = Number(wallet.balance) - Number(originalTransaction.amount);
      }

      await manager.save(wallet);

      // Mark original transaction as reversed
      originalTransaction.status = TransactionStatus.REVERSED;
      await manager.save(originalTransaction);

      // Create reversal transaction
      const reversalTransaction = manager.create(Transaction, {
        id: uuidv4(),
        walletId: wallet.id,
        type: originalTransaction.type === TransactionType.DEBIT ? TransactionType.CREDIT : TransactionType.DEBIT,
        amount: originalTransaction.amount,
        reference: `REVERSAL_${originalTransaction.reference}`,
        status: TransactionStatus.COMPLETED,
        metadata: {
          ...originalTransaction.metadata,
          originalTransactionId: transactionId,
          description: 'Transaction reversal',
        },
      });
      await manager.save(reversalTransaction);

      this.logger.log({
        action: 'transaction_reversed',
        originalTransactionId: transactionId,
        reversalTransactionId: reversalTransaction.id,
        userId: wallet.userId,
        amount: originalTransaction.amount,
        newBalance: wallet.balance,
      });
    });
  }

  async getTransactionHistory(userId: string, limit = 20, offset = 0): Promise<Transaction[]> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet) {
      return [];
    }

    return this.transactionRepository.find({
      where: { wallet: {
        id: wallet.id,
        } },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async createWallet(userId: string): Promise<Wallet> {
    const existingWallet = await this.walletRepository.findOne({ where: { userId } });
    if (existingWallet) {
      throw new BadRequestException('Wallet already exists for this user');
    }

    const wallet = this.walletRepository.create({ userId, balance: 0 });
    return this.walletRepository.save(wallet);
  }

  async creditWallet(walletId: string, amount: number, queryRunner?: QueryRunner): Promise<Wallet> {
    const manager = queryRunner?.manager || this.walletRepository.manager;

    const wallet = await manager.findOne(Wallet, {
      where: { id: walletId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    wallet.balance = Number(wallet.balance) + amount;
    wallet.version += 1;

    return manager.save(wallet);
  }

  async findByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }
}
