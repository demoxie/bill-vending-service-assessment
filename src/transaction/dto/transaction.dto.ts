import { BaseDto } from '../../common/models/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus, TransactionType } from '../enums/transaction.enum';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class TransactionResponseDto extends BaseDto{

  @ApiProperty({ enum: TransactionType, example: TransactionType.CREDIT })
  type: TransactionType;

  @ApiProperty({ example: 500.00 })
  amount: number;

  @ApiProperty({ example: 'CARD_FUNDING_REF_123' })
  reference: string;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.COMPLETED })
  status: TransactionStatus;
}

export class CreateTransactionDto {
  @IsUUID()
  walletId: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  billPaymentDetails?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;
}
