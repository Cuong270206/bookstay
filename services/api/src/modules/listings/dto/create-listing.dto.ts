import { IsString, IsNumber, IsOptional, IsArray, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @ApiProperty({ example: 'Homestay view hồ Gươm' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Căn hộ 2 phòng ngủ view hồ, đầy đủ tiện nghi...' })
  @IsString()
  description: string;

  @ApiProperty({ example: '42 Phố Đào Tấn, Hoàn Kiếm, Hà Nội' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 21.0285 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 105.8522 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Hà Nội' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxGuests?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  bedrooms?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  bathrooms?: number;

  @ApiPropertyOptional({ example: 65 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  area?: number;

  @ApiProperty({ example: 450000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  basePrice: number;

  @ApiPropertyOptional({ example: 550000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weekendPrice?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cleaningFee?: number;

  @ApiPropertyOptional({ example: ['wifi', 'parking', 'kitchen', 'ac'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
