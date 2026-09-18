import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // ===== Get Listing Reviews =====
  async getListingReviews(listingId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          booking: { listingId },
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.review.count({
        where: { booking: { listingId }, deletedAt: null },
      }),
    ]);

    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ===== Create Review =====
  async create(bookingId: string, userId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    if (booking.guestId !== userId) {
      throw new ForbiddenException('Bạn không có quyền đánh giá booking này');
    }

    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Chỉ có thể đánh giá sau khi checkout');
    }

    // Check if already reviewed
    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá booking này');
    }

    // Check 14-day deadline
    const checkoutDate = new Date(booking.checkOut);
    const deadlineDate = new Date(checkoutDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (new Date() > deadlineDate) {
      throw new BadRequestException('Đã hết thời hạn đánh giá (14 ngày sau checkout)');
    }

    return this.prisma.review.create({
      data: {
        bookingId,
        reviewerId: userId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  // ===== Update Review (within 48h) =====
  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review không tồn tại');
    }

    if (review.reviewerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa đánh giá này');
    }

    if (review.deletedAt) {
      throw new BadRequestException('Review đã bị xóa');
    }

    // Check 48h edit window
    const createdAt = new Date(review.createdAt);
    const editDeadline = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
    if (new Date() > editDeadline && dto.rating !== undefined) {
      throw new BadRequestException('Đã hết thời hạn sửa đánh giá (48 giờ)');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating,
        comment: dto.comment,
        editedAt: new Date(),
      },
    });
  }

  // ===== Delete Review =====
  async delete(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review không tồn tại');
    }

    if (review.reviewerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });
  }

  // ===== Flag Review (Host) =====
  async flagReview(reviewId: string, hostId: string, reason: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { booking: { include: { listing: true } } },
    });

    if (!review) {
      throw new NotFoundException('Review không tồn tại');
    }

    if (review.booking.listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền báo cáo review này');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        flagged: true,
        flagReason: reason,
      },
    });
  }
}
