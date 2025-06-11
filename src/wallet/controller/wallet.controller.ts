import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WalletService } from '../service/wallet.service';
import { CreateWalletRequestDto, FundWalletDto, WalletResponseDto } from '../dto/wallet.dto';
import { TransactionResponseDto } from '../../transaction/dto/transaction.dto';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('fund')
  @ApiOperation({ summary: 'Fund a user wallet' })
  @ApiResponse({ status: 201, description: 'Wallet funded successfully', type: WalletResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async fundWallet(@Body() fundWalletDto: FundWalletDto): Promise<WalletResponseDto> {
    const wallet = await this.walletService.fundWallet(fundWalletDto);
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: Number(wallet.balance),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance retrieved', type: WalletResponseDto })
  async getBalance(@Param('userId', ParseUUIDPipe) userId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletService.getBalance(userId);
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: Number(wallet.balance),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved', type: [TransactionResponseDto] })
  async getTransactionHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ): Promise<TransactionResponseDto[]> {
    const transactions = await this.walletService.getTransactionHistory(userId, limit, offset);
    return transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      reference: transaction.reference,
      status: transaction.status,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }));
  }
  //create wallet
  @Post('create')
  @ApiOperation({ summary: 'Create a new wallet for a user' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully', type: WalletResponseDto })
  async createWallet(@Body() dto: CreateWalletRequestDto): Promise<WalletResponseDto> {
    const wallet = await this.walletService.createWallet(dto.userId);
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: Number(wallet.balance),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}
