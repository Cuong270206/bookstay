import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  // ===== Get Conversations List =====
  @Get('conversations')
  @ApiOperation({ summary: 'Get chat conversations list' })
  async getConversations(@Request() req) {
    return this.chatService.getConversations(req.user.id);
  }

  // ===== Get Messages (polling) =====
  @Get(':bookingId')
  @ApiOperation({ summary: 'Get chat messages (for polling)' })
  async getMessages(
    @Request() req,
    @Param('bookingId') bookingId: string,
    @Query('since') since?: string,
  ) {
    const messages = await this.chatService.getMessages(bookingId, req.user.id, since);
    return { messages };
  }

  // ===== Send Message =====
  @Post(':bookingId')
  @ApiOperation({ summary: 'Send chat message' })
  async sendMessage(
    @Request() req,
    @Param('bookingId') bookingId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(bookingId, req.user.id, dto);
  }

  // ===== Mark as Read =====
  @Post(':bookingId/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  async markAsRead(@Request() req, @Param('bookingId') bookingId: string) {
    return this.chatService.markAsRead(bookingId, req.user.id);
  }
}
