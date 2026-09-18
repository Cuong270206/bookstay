import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyHostDto {
  @ApiProperty({ example: 'Công ty TNHH Homestay Hà Nội' })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({ example: 'https://example.com/license.jpg' })
  @IsOptional()
  @IsString()
  businessLicense?: string;
}
