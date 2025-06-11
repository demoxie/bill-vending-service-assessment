import { Test, TestingModule } from '@nestjs/testing';
import { BillPaymentController } from '../../../src/bill-payment/controller/bill-payment.controller';
import { BillPaymentService } from '../../../src/bill-payment/service/bill-payment.service';
import { PurchaseBillDto } from '../../../src/bill-payment/dto/bill.dto';
import { TransactionStatus } from '../../../src/transaction/enums/transaction.enum';
import { BillType } from '../../../src/bill-payment/enums/bill.enum';

describe('BillPaymentController', () => {
  let controller: BillPaymentController;
  let service: BillPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillPaymentController],
      providers: [
        {
          provide: BillPaymentService,
          useValue: {
            purchaseBill: jest.fn(),
            getBillTransactions: jest.fn(),
            getBillTransactionById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BillPaymentController>(BillPaymentController);
    service = module.get<BillPaymentService>(BillPaymentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.purchaseBill and return response DTO', async () => {
    const dto: PurchaseBillDto = {
      userId: 'user-id',
      billType: BillType.ELECTRICITY,
      amount: 500,
      meterNumber: '123456',
      customerName: 'John Doe',
    };

    const mockTransaction = {
      id: 'txn-id',
      ...dto,
      status: TransactionStatus.PENDING,
      externalReference: null,
      token: null,
      createdAt: new Date(),
    };

    jest.spyOn(service, 'purchaseBill').mockResolvedValue(mockTransaction as any);

    const result = await controller.purchaseBill(dto);

    expect(service.purchaseBill).toHaveBeenCalledWith(dto);
    expect(result).toMatchObject({
      id: 'txn-id',
      userId: 'user-id',
      billType: 'electricity',
      amount: 500,
      meterNumber: '123456',
      customerName: 'John Doe',
    });
  });

  it('should return bill transaction history', async () => {
    const userId = 'user-123';
    const transactions = [{
      id: '1',
      userId,
      billType: 'data',
      amount: 100,
      meterNumber: '9876',
      customerName: 'Jane',
      status: TransactionStatus.COMPLETED,
      externalReference: 'ext-ref',
      token: 'token',
      createdAt: new Date(),
    }];

    jest.spyOn(service, 'getBillTransactions').mockResolvedValue(transactions as any);

    const result = await controller.getBillTransactions(userId, 10, 0);

    expect(service.getBillTransactions).toHaveBeenCalledWith(userId, 10, 0);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(userId);
  });

  it('should return a bill transaction by ID', async () => {
    const transaction = {
      id: 'txn-id',
      userId: 'user-id',
      billType: 'data',
      amount: 250,
      meterNumber: '8765',
      customerName: 'Doe',
      status: TransactionStatus.COMPLETED,
      externalReference: 'ref-xyz',
      token: 'tok-123',
      createdAt: new Date(),
    };

    jest.spyOn(service, 'getBillTransactionById').mockResolvedValue(transaction as any);

    const result = await controller.getBillTransaction('txn-id');

    expect(service.getBillTransactionById).toHaveBeenCalledWith('txn-id');
    expect(result.id).toBe('txn-id');
    expect(result.status).toBe(TransactionStatus.COMPLETED);
  });
});
