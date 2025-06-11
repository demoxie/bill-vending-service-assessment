import { HttpException, HttpStatus } from '@nestjs/common';

export class InsufficientFundsException extends HttpException {
  constructor(availableBalance: number, requiredAmount: number) {
    super(
      {
        message: 'Insufficient funds',
        error: 'INSUFFICIENT_FUNDS',
        availableBalance,
        requiredAmount,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ConcurrentTransactionException extends HttpException {
  constructor() {
    super(
      {
        message: 'Transaction conflict detected. Please try again.',
        error: 'CONCURRENT_TRANSACTION',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class ExternalServiceException extends HttpException {
  constructor(service: string, message: string) {
    super(
      {
        message: `External service error: ${service}`,
        error: 'EXTERNAL_SERVICE_ERROR',
        details: message,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class TransactionNotFoundException extends HttpException {
  constructor(transactionId: string) {
    super(
      {
        message: 'Transaction not found',
        error: 'TRANSACTION_NOT_FOUND',
        transactionId,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
