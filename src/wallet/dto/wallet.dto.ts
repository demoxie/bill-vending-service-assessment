import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { BaseDto } from '../../common/models/base.dto';

export class FundWalletDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Amount to fund',
    example: 1000.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Optional reference for the transaction',
    example: 'CARD_FUNDING_REF_123',
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string;
}
//create wallet request
export class CreateWalletRequestDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;
}


export class WalletResponseDto extends BaseDto{
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: 1500.00 })
  balance: number;
}
