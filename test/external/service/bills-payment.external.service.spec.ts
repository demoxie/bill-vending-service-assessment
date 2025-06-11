import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BillsPaymentExternalService } from '../../../src/external/service/bills-payment.external.service';
import { BillType } from '../../../src/bill-payment/enums/bill.enum';
import { ExternalServiceException } from '../../../src/common/exceptions/exceptions';
import { Logger } from '@nestjs/common';

describe('BillsPaymentExternalService', () => {
  let service: BillsPaymentExternalService;
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillsPaymentExternalService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<BillsPaymentExternalService>(BillsPaymentExternalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully purchase bill with valid data', async () => {
    const request = {
      billType: BillType.ELECTRICITY,
      amount: 100,
      meterNumber: '1234567890',
      customerName: 'Test User',
    };

    jest.spyOn<any, any>(service, 'mockExternalApiCall').mockResolvedValueOnce({
      success: true,
      reference: 'EXT_TEST_REF',
      token: '1234-5678-9012-3456',
      message: 'Transaction processed successfully',
    });

    const response = await service.purchaseBill(request);

    expect(response.success).toBe(true);
    expect(response.reference).toBe('EXT_TEST_REF');
    expect(response.token).toBe('1234-5678-9012-3456');
  });


  it('should return failure for invalid meter number', async () => {
    const request = {
      billType: BillType.ELECTRICITY,
      amount: 100,
      meterNumber: '9999999999',
      customerName: 'Test User',
    };

    await expect(service.purchaseBill(request)).rejects.toThrow(ExternalServiceException);
  });

  it('should throw ExternalServiceException on simulated API error', async () => {
    const spy = jest.spyOn<any, any>(service, 'mockExternalApiCall');
    spy.mockResolvedValueOnce({
      success: false,
      reference: '',
      message: 'Simulated failure',
    });

    const request = {
      billType: BillType.ELECTRICITY,
      amount: 100,
      meterNumber: '1234567890',
      customerName: 'Test User',
    };

    await expect(service.purchaseBill(request)).rejects.toThrow(ExternalServiceException);
  });
});
