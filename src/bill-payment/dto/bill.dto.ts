import { BillType } from '../enums/bill.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { TransactionStatus } from '../../transaction/enums/transaction.enum';
import { BaseDto } from '../../common/models/base.dto';


export interface BillPurchaseRequest {
  billType: BillType;
  amount: number;
  meterNumber: string;
  customerName?: string;
}

export interface BillPurchaseResponse {
  success: boolean;
  reference: string;
  token?: string;
  message?: string;
}

export class PurchaseBillDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Type of bill to purchase',
    enum: BillType,
    example: BillType.ELECTRICITY,
  })
  @IsEnum(BillType)
  billType: BillType;

  @ApiProperty({
    description: 'Amount to purchase',
    example: 500.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Meter number',
    example: '12345678901',
  })
  @IsString()
  meterNumber: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerName?: string;
}

export class BillResponseDto extends BaseDto{

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ enum: BillType, example: BillType.ELECTRICITY })
  billType: BillType;

  @ApiProperty({ example: 500.00 })
  amount: number;

  @ApiProperty({ example: '12345678901' })
  meterNumber: string;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiProperty({ enum: TransactionStatus, example: TransactionStatus.PENDING })
  status: TransactionStatus;

  @ApiProperty({ example: 'EXT_REF_123456', required: false })
  externalReference?: string;

  @ApiProperty({ example: '1234-5678-9012-3456', required: false })
  token?: string;
}
