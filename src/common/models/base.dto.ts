import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export abstract class BaseDto{
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  updatedAt?: Date;
}
