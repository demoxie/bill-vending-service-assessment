// src/shared/providers/mock-bill-api.service.ts
// Simulate external bill payment API
import { Injectable } from '@nestjs/common';

interface PaymentRequest {
  meterNumber: string;
  amount: number;
  transactionId: string;
}

interface PaymentResponse {
  success: boolean;
  message?: string;
  externalTransactionId?: string;
}

@Injectable()
export class MockBillApiService {
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log(`MockBillApiService: Processing payment for meter ${request.meterNumber} with amount ${request.amount}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500)); // 0.5 to 2 seconds

    // Simulate success/failure randomly or based on specific meter numbers for testing
    const isSuccess = Math.random() > 0.3; // 70% success rate
    // Or: const isSuccess = request.meterNumber !== 'FAIL_METER';

    if (isSuccess) {
      return {
        success: true,
        externalTransactionId: `EXT-<span class="math-inline">\{Date\.now\(\)\}\-</span>{Math.random().toString(36).substring(7).toUpperCase()}`,
      };
    } else {
      return {
        success: false,
        message: 'External payment service unavailable or rejected.',
      };
    }
  }
}
