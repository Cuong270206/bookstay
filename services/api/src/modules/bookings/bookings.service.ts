import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  // ===== GUEST: Create Booking =====
  async create(guestId: string, dto: CreateBookingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { host: true },
    });

    if (!listing) {
      throw new NotFoundException('Homestay không tồn tại');
    }

    if (listing.status !== 'PUBLISHED') {
      throw new BadRequestException('Homestay không khả dụng');
    }

    if (listing.host.status !== 'APPROVED') {
      throw new BadRequestException('Host chưa được duyệt');
    }

    if (dto.guestCount > listing.maxGuests) {
      throw new BadRequestException(`Số khách tối đa là ${listing.maxGuests}`);
    }

    // Parse dates
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    // Check date validity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      throw new BadRequestException('Ngày check-in không hợp lệ');
    }
    if (checkOut <= checkIn) {
      throw new BadRequestException('Ngày check-out phải sau check-in');
    }
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights > 30) {
      throw new BadRequestException('Tối đa 30 đêm');
    }

    // Calculate pricing
    const isWeekend = this.isWeekend(checkIn) || this.isWeekend(checkOut);
    const nightlyRate = isWeekend && listing.weekendPrice
      ? Number(listing.weekendPrice)
      : Number(listing.basePrice);
    const subtotal = nightlyRate * nights;
    const cleaningFee = listing.cleaningFee ? Number(listing.cleaningFee) : 0;
    const platformFee = Math.round(subtotal * 0.15); // 15% commission
    const totalAmount = subtotal + cleaningFee;

    const lockExpiresAt = new Date(Date.now() + 20 * 60 * 1000);

    // Transaction SERIALIZABLE: conflict check + create booking + payment,
    // loại trừ tuyệt đối 2 request đặt trùng khoảng ngày cùng lúc
    let booking;
    try {
      booking = await this.prisma.$transaction(
        async (tx) => {
          // Booking PENDING_PAYMENT chỉ chiếm chỗ khi phiên thanh toán (khóa 20 phút) còn hiệu lực
          const conflict = await tx.booking.findFirst({
            where: {
              listingId: dto.listingId,
              status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
              payment: { lockExpiresAt: { gt: new Date() } },
              // overlap: cho phép nhận phòng ngay ngày khách khác trả phòng
              checkIn: { lt: checkOut },
              checkOut: { gt: checkIn },
            },
          });

          if (conflict) {
            throw new BadRequestException('Ngày đã có người đặt, vui lòng chọn ngày khác');
          }

          // Check calendar blocks
          const blockConflict = await tx.calendarBlock.findFirst({
            where: {
              listingId: dto.listingId,
              startDate: { lt: checkOut },
              endDate: { gt: checkIn },
            },
          });

          if (blockConflict) {
            throw new BadRequestException('Ngày đã bị block, vui lòng chọn ngày khác');
          }

          const created = await tx.booking.create({
            data: {
              listingId: dto.listingId,
              guestId,
              checkIn,
              checkOut,
              nights,
              guestName: dto.guestName,
              guestPhone: dto.guestPhone,
              guestEmail: dto.guestEmail,
              guestCount: dto.guestCount,
              specialRequests: dto.specialRequests,
              nightlyRate: new Prisma.Decimal(nightlyRate),
              cleaningFee: cleaningFee > 0 ? new Prisma.Decimal(cleaningFee) : null,
              subtotal: new Prisma.Decimal(subtotal),
              platformFee: new Prisma.Decimal(platformFee),
              totalAmount: new Prisma.Decimal(totalAmount),
              status: 'PENDING_PAYMENT',
            },
            include: {
              listing: {
                include: {
                  host: {
                    include: { user: { select: { id: true, name: true } } },
                  },
                },
              },
            },
          });

          // Create payment record with 20-min lock
          await tx.payment.create({
            data: {
              bookingId: created.id,
              vnpAmount: totalAmount * 100, // VNPay uses cents
              vnpOrderInfo: `BookStay-${created.id}`,
              status: 'CREATED',
              lockExpiresAt,
            },
          });

          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e: any) {
      // P2034: serialization conflict (đặt trùng do race) → báo lỗi thân thiện
      if (e?.code === 'P2034') {
        throw new BadRequestException('Ngày vừa có người đặt, vui lòng chọn ngày khác');
      }
      throw e;
    }

    return {
      ...booking,
      bookingId: booking.id, // alias để tương thích client cũ
      lockExpiresAt,
    };
  }

  // ===== GUEST: Get My Bookings =====
  async findMyBookings(guestId: string, params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { guestId };
    if (status) {
      where.status = status as any;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: {
              images: { orderBy: { order: 'asc' }, take: 1 },
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ===== GUEST: Get Booking Detail =====
  async findById(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            images: { orderBy: { order: 'asc' }, take: 5 },
            host: {
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
        payment: true,
        review: true,
        chatMessages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    // Check permission: guest or host
    const isGuest = booking.guestId === userId;
    const isHost = booking.listing.host.userId === userId;
    if (!isGuest && !isHost) {
      throw new ForbiddenException('Bạn không có quyền xem booking này');
    }

    return booking;
  }

  // ===== GUEST: Cancel Booking =====
  async cancel(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    if (booking.guestId !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy booking này');
    }

    if (!['PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('Không thể hủy booking ở trạng thái này');
    }

    // Calculate refund percentage
    const checkIn = new Date(booking.checkIn);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let refundPercent = 0;
    let status: 'CANCELLED' | 'CANCELLED_50' | 'CANCELLED_0' = 'CANCELLED_0';

    if (daysUntilCheckIn >= 7) {
      refundPercent = 100;
      status = 'CANCELLED';
    } else if (daysUntilCheckIn >= 3) {
      refundPercent = 50;
      status = 'CANCELLED_50';
    } else {
      refundPercent = 0;
      status = 'CANCELLED_0';
    }

    const refundAmount = Math.round(Number(booking.totalAmount) * refundPercent / 100);

    // Update booking
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        cancelReason: reason,
        cancelledAt: new Date(),
        refundAmount: refundAmount > 0 ? new Prisma.Decimal(refundAmount) : null,
      },
    });

    // If payment was made, initiate refund
    if (booking.status === 'CONFIRMED' && refundAmount > 0) {
      // TODO: Call VNPay refund API
    }

    return {
      ...updated,
      refundPercent,
      refundAmount,
      message: refundPercent > 0
        ? `Hủy thành công. Hoàn tiền ${refundPercent}%: ${refundAmount.toLocaleString('vi-VN')} VND`
        : 'Hủy thành công. Không hoàn tiền do hủy trong vòng 3 ngày',
    };
  }

  // ===== HOST: Get Incoming Bookings =====
  async findHostBookings(hostId: string, params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      listing: { hostId },
    };
    if (status) {
      where.status = status as any;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { include: { images: { orderBy: { order: 'asc' }, take: 1 } } },
          guest: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ===== ADMIN: Get All Bookings =====
  async findAll(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};
    if (status) {
      where.status = status as any;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { select: { id: true, title: true, address: true } },
          guest: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ===== HELPER: Check weekend =====
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 5 || day === 6; // Friday or Saturday
  }
}
