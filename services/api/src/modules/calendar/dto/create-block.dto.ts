import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlockDto {
  @ApiProperty({ example: '2025-01-20' })
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2025-01-25' })
  @IsString()
  endDate: string;

  @ApiProperty({ 
    example: 'MAINTENANCE',
    enum: ['OWNER_BLOCKED', 'MAINTENANCE', 'OTHER']
  })
  @IsEnum(['OWNER_BLOCKED', 'MAINTENANCE', 'OTHER'])
  reason: string;

  @ApiPropertyOptional({ example: 'Sửa điều hòa' })
  @IsOptional()
  @IsString()
  note?: string;
}
