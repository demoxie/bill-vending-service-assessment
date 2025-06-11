import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BillResponseDto, PurchaseBillDto } from '../dto/bill.dto';
import { BillPaymentService } from '../service/bill-payment.service';

@ApiTags('bills')
@Controller('bills')
export class BillPaymentController {
  constructor(private readonly billsService: BillPaymentService) {}

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase a bill' })
  @ApiResponse({ status: 201, description: 'Bill purchase initiated', type: BillResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient funds' })
  async purchaseBill(@Body() purchaseBillDto: PurchaseBillDto): Promise<BillResponseDto> {
    const billTransaction = await this.billsService.purchaseBill(purchaseBillDto);
    return {
      id: billTransaction.id,
      userId: billTransaction.userId,
      billType: billTransaction.billType,
      amount: Number(billTransaction.amount),
      meterNumber: billTransaction.meterNumber,
      customerName: billTransaction.customerName,
      status: billTransaction.status,
      externalReference: billTransaction.externalReference,
      token: billTransaction.token,
      createdAt: billTransaction.createdAt,
    };
  }

  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get bill transaction history' })
  @ApiResponse({ status: 200, description: 'Bill transactions retrieved', type: [BillResponseDto] })
  async getBillTransactions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ): Promise<BillResponseDto[]> {
    const transactions = await this.billsService.getBillTransactions(userId, limit, offset);
    return transactions.map(transaction => ({
      id: transaction.id,
      userId: transaction.userId,
      billType: transaction.billType,
      amount: Number(transaction.amount),
      meterNumber: transaction.meterNumber,
      customerName: transaction.customerName,
      status: transaction.status,
      externalReference: transaction.externalReference,
      token: transaction.token,
      createdAt: transaction.createdAt,
    }));
  }

  @Get('transaction/:id')
  @ApiOperation({ summary: 'Get bill transaction by ID' })
  @ApiResponse({ status: 200, description: 'Bill transaction retrieved', type: BillResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getBillTransaction(@Param('id', ParseUUIDPipe) id: string): Promise<BillResponseDto> {
    const transaction = await this.billsService.getBillTransactionById(id);
    return {
      id: transaction.id,
      userId: transaction.userId,
      billType: transaction.billType,
      amount: Number(transaction.amount),
      meterNumber: transaction.meterNumber,
      customerName: transaction.customerName,
      status: transaction.status,
      externalReference: transaction.externalReference,
      token: transaction.token,
      createdAt: transaction.createdAt,
    };
  }
}
