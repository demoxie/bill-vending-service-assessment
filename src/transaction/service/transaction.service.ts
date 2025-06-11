import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '../entity/transaction.entity';
import { TransactionStatus } from '../enums/transaction.enum';
import { QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from '../dto/transaction.dto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    queryRunner?: QueryRunner,
  ): Promise<Transaction> {
    const manager = queryRunner?.manager || this.transactionRepository.manager;

    const transaction = manager.create(Transaction, {
      ...createTransactionDto,
      status: TransactionStatus.PENDING,
    });

    return manager.save(transaction);
  }

  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    failureReason?: string,
    queryRunner?: QueryRunner,
  ): Promise<Transaction> {
    const manager = queryRunner?.manager || this.transactionRepository.manager;

    const transaction = await manager.findOne(Transaction, { where: { id: transactionId } });
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = status;
    if (failureReason) {
      transaction.failureReason = failureReason;
    }

    return manager.save(transaction);
  }

  async findById(id: string): Promise<Transaction> {
    return this.transactionRepository.findOne({ where: { id } });
  }

  async findByWalletId(walletId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { wallet: {
        id: walletId,
        } },
      order: { createdAt: 'DESC' },
    });
  }
}
