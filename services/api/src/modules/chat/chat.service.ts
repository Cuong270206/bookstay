import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // ===== Get Chat Messages =====
  async getMessages(bookingId: string, userId: string, since?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { include: { host: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    // Check permission: guest or host
    const isGuest = booking.guestId === userId;
    const isHost = booking.listing.host.userId === userId;
    if (!isGuest && !isHost) {
      throw new ForbiddenException('Bạn không có quyền xem chat này');
    }

    // Get messages
    const where: any = { bookingId };
    if (since) {
      where.createdAt = { gt: new Date(since) };
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    return {
      messages,
      bookingStatus: booking.status,
      canChat: ['CONFIRMED', 'PENDING_PAYMENT'].includes(booking.status),
    };
  }

  // ===== Send Message =====
  async sendMessage(bookingId: string, senderId: string, dto: SendMessageDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { include: { host: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    // Check permission
    const isGuest = booking.guestId === senderId;
    const isHost = booking.listing.host.userId === senderId;
    if (!isGuest && !isHost) {
      throw new ForbiddenException('Bạn không có quyền gửi tin nhắn');
    }

    // Check if chat is allowed
    if (!['CONFIRMED', 'PENDING_PAYMENT'].includes(booking.status)) {
      throw new BadRequestException('Không thể gửi tin nhắn cho booking đã hủy');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        bookingId,
        senderId,
        message: dto.message,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    return message;
  }

  // ===== Mark Messages as Read =====
  async markAsRead(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { include: { host: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    // Check permission
    const isGuest = booking.guestId === userId;
    const isHost = booking.listing.host.userId === userId;
    if (!isGuest && !isHost) {
      throw new ForbiddenException('Bạn không có quyền');
    }

    // Mark unread messages from the other party as read
    const messages = await this.prisma.chatMessage.updateMany({
      where: {
        bookingId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { updated: messages.count };
  }
}
