import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'Xin chào, tôi muốn hỏi về homestay' })
  @IsString()
  @MinLength(1, { message: 'Tin nhắn không được trống' })
  @MaxLength(1000, { message: 'Tin nhắn quá dài (tối đa 1000 ký tự)' })
  message: string;
}
