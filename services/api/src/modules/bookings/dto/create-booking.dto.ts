import { IsString, IsNumber, IsOptional, Min, Max, MinLength, IsEmail, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-of-listing' })
  @IsString()
  listingId: string;

  @ApiProperty({ example: '2025-01-15' })
  @IsString()
  checkIn: string;

  @ApiProperty({ example: '2025-01-17' })
  @IsString()
  checkOut: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  guestCount: number;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2)
  guestName: string;

  @ApiProperty({ example: '0912345678' })
  @IsString()
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
  guestPhone: string;

  @ApiProperty({ example: 'email@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  guestEmail: string;

  @ApiPropertyOptional({ example: 'Tôi muốn check-in sớm' })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}
