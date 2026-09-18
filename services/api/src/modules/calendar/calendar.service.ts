import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  // ===== HOST: Get Calendar for Listing =====
  async getCalendar(listingId: string, hostId: string, month?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Homestay không tồn tại');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền xem calendar này');
    }

    // Get bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        listingId,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        guestName: true,
        status: true,
      },
    });

    // Get blocks
    const blocks = await this.prisma.calendarBlock.findMany({
      where: { listingId },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        reason: true,
        note: true,
        version: true,
      },
    });

    return { bookings, blocks };
  }

  // ===== HOST: Add Calendar Block =====
  async addBlock(listingId: string, hostId: string, dto: CreateBlockDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Homestay không tồn tại');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền thêm block này');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Check for booking conflicts
    const conflict = await this.prisma.booking.findFirst({
      where: {
        listingId,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
        checkIn: { lte: endDate },
        checkOut: { gte: startDate },
      },
    });

    if (conflict) {
      throw new BadRequestException('Ngày đã có booking. Không thể block.');
    }

    // Check for existing blocks
    const blockConflict = await this.prisma.calendarBlock.findFirst({
      where: {
        listingId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (blockConflict) {
      throw new ConflictException('Ngày đã bị block trước đó');
    }

    // Create block
    return this.prisma.calendarBlock.create({
      data: {
        listingId,
        startDate,
        endDate,
        reason: dto.reason,
        note: dto.note,
      },
    });
  }

  // ===== HOST: Update Block =====
  async updateBlock(blockId: string, hostId: string, dto: CreateBlockDto) {
    const block = await this.prisma.calendarBlock.findUnique({
      where: { id: blockId },
      include: { listing: true },
    });

    if (!block) {
      throw new NotFoundException('Block không tồn tại');
    }

    if (block.listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền sửa block này');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Check version for optimistic locking
    try {
      return await this.prisma.calendarBlock.update({
        where: {
          id: blockId,
          version: block.version,
        },
        data: {
          startDate,
          endDate,
          reason: dto.reason,
          note: dto.note,
          version: { increment: 1 },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ConflictException('Block đã được chỉnh sửa bởi người khác. Vui lòng refresh.');
      }
      throw error;
    }
  }

  // ===== HOST: Delete Block =====
  async deleteBlock(blockId: string, hostId: string) {
    const block = await this.prisma.calendarBlock.findUnique({
      where: { id: blockId },
      include: { listing: true },
    });

    if (!block) {
      throw new NotFoundException('Block không tồn tại');
    }

    if (block.listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền xóa block này');
    }

    return this.prisma.calendarBlock.delete({
      where: { id: blockId },
    });
  }
}
