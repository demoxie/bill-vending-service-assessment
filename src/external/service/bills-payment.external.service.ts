import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillPurchaseRequest, BillPurchaseResponse } from '../../bill-payment/dto/bill.dto';
import { ExternalServiceException } from '../../common/exceptions/exceptions';
import { BillType } from '../../bill-payment/enums/bill.enum';

@Injectable()
export class BillsPaymentExternalService{
  private readonly logger = new Logger(BillsPaymentExternalService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get('BILL_PAYMENT_API_URL', 'https://mock-bill-api.com');
    this.apiKey = this.configService.get('BILL_PAYMENT_API_KEY', 'mock-api-key');
  }

  async purchaseBill(request: BillPurchaseRequest): Promise<BillPurchaseResponse> {
    this.logger.log({
      action: 'external_api_call',
      billType: request.billType,
      amount: request.amount,
      meterNumber: request.meterNumber,
    });

    try {
      // Mock external API call - replace with actual HTTP client in production
      const response = await this.mockExternalApiCall(request);

      if (!response.success) {
        throw new ExternalServiceException('BillPaymentAPI', response.message || 'Unknown error');
      }

      this.logger.log({
        action: 'external_api_success',
        reference: response.reference,
        token: response.token,
      });

      return response;
    } catch (error) {
      this.logger.error({
        action: 'external_api_error',
        error: error.message,
        billType: request.billType,
        meterNumber: request.meterNumber,
      });

      if (error instanceof ExternalServiceException) {
        throw error;
      }

      throw new ExternalServiceException('BillPaymentAPI', error.message);
    }
  }

  private async mockExternalApiCall(request: BillPurchaseRequest): Promise<BillPurchaseResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    // Simulate random failures (10% failure rate)
    if (Math.random() < 0.1) {
      return {
        success: false,
        reference: '',
        message: 'External service temporarily unavailable',
      };
    }

    // Simulate different responses based on meter number for testing
    if (request.meterNumber === '9999999999') {
      return {
        success: false,
        reference: '',
        message: 'Invalid meter number',
      };
    }

    // Generate mock response
    const reference = `EXT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let token = '';

    if (request.billType === BillType.ELECTRICITY) {
      token = this.generateElectricityToken();
    }

    return {
      success: true,
      reference,
      token,
      message: 'Transaction processed successfully',
    };
  }

  private generateElectricityToken(): string {
    // Generate a mock electricity token
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(Math.random().toString(10).substr(2, 4));
    }
    return segments.join('-');
  }
}
