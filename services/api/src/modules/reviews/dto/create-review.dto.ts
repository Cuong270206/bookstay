import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1, { message: 'Rating tối thiểu là 1' })
  @Max(5, { message: 'Rating tối đa là 5' })
  @Type(() => Number)
  rating: number;

  @ApiPropertyOptional({ example: 'Homestay rất đẹp, sạch sẽ, chủ nhà thân thiện!' })
  @IsOptional()
  @IsString()
  comment?: string;
}
