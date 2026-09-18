import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  // ===== PUBLIC: Search & Filter =====
  async search(params: {
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      city,
      checkIn,
      checkOut,
      guests,
      minPrice,
      maxPrice,
      amenities,
      sortBy = 'newest',
      page = 1,
      limit = 20,
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ListingWhereInput = {
      status: 'PUBLISHED',
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (guests) {
      where.maxGuests = { gte: guests };
    }

    if (minPrice) {
      where.basePrice = { ...where.basePrice, gte: new Prisma.Decimal(minPrice) };
    }

    if (maxPrice) {
      where.basePrice = { ...where.basePrice, lte: new Prisma.Decimal(maxPrice) };
    }

    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim());
      where.amenities = { hasEvery: amenityList };
    }

    // Exclude booked dates
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // Get all listing IDs that are booked in the date range
      const bookedListingIds = await this.prisma.booking.findMany({
        where: {
          status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
          OR: [
            {
              checkIn: { lte: checkOutDate },
              checkOut: { gte: checkInDate },
            },
          ],
        },
        select: { listingId: true },
      });

      const bookedIds = bookedListingIds.map((b) => b.listingId);

      // Exclude booked listings
      where.id = { notIn: bookedIds };
    }

    // Build orderBy
    let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sortBy) {
      case 'price_asc':
        orderBy = { basePrice: 'asc' };
        break;
      case 'price_desc':
        orderBy = { basePrice: 'desc' };
        break;
      case 'rating':
        orderBy = { createdAt: 'desc' }; // Will add rating field later
        break;
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { orderBy: { order: 'asc' }, take: 5 },
          host: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    // Calculate average rating for each listing
    const listingsWithRating = await Promise.all(
      listings.map(async (listing) => {
        const reviews = await this.prisma.review.findMany({
          where: { booking: { listingId: listing.id }, deletedAt: null },
          select: { rating: true },
        });
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        return {
          ...listing,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
        };
      }),
    );

    return {
      data: listingsWithRating,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===== PUBLIC: Get Single Listing =====
  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        host: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Homestay không tồn tại');
    }

    // Get reviews
    const reviews = await this.prisma.review.findMany({
      where: { booking: { listingId: id }, deletedAt: null },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const allReviews = await this.prisma.review.findMany({
      where: { booking: { listingId: id }, deletedAt: null },
      select: { rating: true },
    });

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    return {
      ...listing,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
      reviews,
    };
  }

  // ===== PUBLIC: Get Calendar =====
  async getCalendar(id: string, month?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!listing) {
      throw new NotFoundException('Homestay không tồn tại');
    }

    // Get bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        listingId: id,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      },
      select: {
        checkIn: true,
        checkOut: true,
        guestName: true,
      },
    });

    // Get blocks
    const blocks = await this.prisma.calendarBlock.findMany({
      where: { listingId: id },
      select: {
        startDate: true,
        endDate: true,
        reason: true,
        note: true,
      },
    });

    return { bookings, blocks };
  }

  // ===== HOST: Create Listing =====
  async create(hostId: string, dto: CreateListingDto) {
    // Verify host
    const hostProfile = await this.prisma.hostProfile.findUnique({
      where: { id: hostId },
    });

    if (!hostProfile || hostProfile.status !== 'APPROVED') {
      throw new ForbiddenException('Bạn chưa được duyệt làm host');
    }

    // Create listing as DRAFT
    const listing = await this.prisma.listing.create({
      data: {
        hostId,
        title: dto.title,
        description: dto.description,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        city: dto.city || 'Hà Nội',
        maxGuests: dto.maxGuests || 4,
        bedrooms: dto.bedrooms || 1,
        bathrooms: dto.bathrooms || 1,
        area: dto.area,
        basePrice: new Prisma.Decimal(dto.basePrice),
        weekendPrice: dto.weekendPrice ? new Prisma.Decimal(dto.weekendPrice) : null,
        cleaningFee: dto.cleaningFee ? new Prisma.Decimal(dto.cleaningFee) : null,
        amenities: dto.amenities || [],
        status: 'DRAFT',
      },
    });

    // Update host listing count
    await this.prisma.hostProfile.update({
      where: { id: hostId },
      data: { listingCount: { increment: 1 } },
    });

    return listing;
  }

  // ===== HOST: Get My Listings =====
  async findMyListings(hostId: string, params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = { hostId };
    if (status) {
      where.status = status as any;
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          _count: { select: { bookings: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ===== HOST: Update Listing =====
  async update(id: string, hostId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Homestay không tồn tại');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa homestay này');
    }

    if (listing.status === 'PUBLISHED') {
      throw new BadRequestException('Không thể chỉnh sửa homestay đang hoạt động. Vui lòng tạm dừng trước.');
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        city: dto.city,
        maxGuests: dto.maxGuests,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        area: dto.area,
        basePrice: dto.basePrice ? new Prisma.Decimal(dto.basePrice) : undefined,
        weekendPrice: dto.weekendPrice ? new Prisma.Decimal(dto.weekendPrice) : undefined,
        cleaningFee: dto.cleaningFee ? new Prisma.Decimal(dto.cleaningFee) : undefined,
        amenities: dto.amenities,
        status: dto.status,
      },
    });
  }

  // ===== HOST: Submit for Review =====
  async submitForReview(id: string, hostId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Homestay không tồn tại');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền thực hiện');
    }

    // Check if has images
    const imageCount = await this.prisma.listingImage.count({
      where: { listingId: id },
    });

    if (imageCount === 0) {
      throw new BadRequestException('Vui lòng thêm ít nhất 1 hình ảnh trước khi gửi duyệt');
    }

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'PENDING_REVIEW' },
    });
  }

  // ===== HOST: Delete Listing =====
  async delete(id: string, hostId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Homestay không tồn tại');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền xóa homestay này');
    }

    // Check for active bookings
    if (listing.bookings.length > 0) {
      throw new BadRequestException(
        'Không thể xóa: đang có booking đang hoạt động. Vui lòng chờ sau ngày checkout.',
      );
    }

    // Soft delete
    await this.prisma.listing.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    // Update host count
    await this.prisma.hostProfile.update({
      where: { id: hostId },
      data: { listingCount: { decrement: 1 } },
    });

    return { message: 'Đã xóa homestay' };
  }

  // ===== ADMIN: Get All Listings =====
  async findAll(params: { page?: number; limit?: number; status?: string; city?: string }) {
    const { page = 1, limit = 20, status, city } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {};
    if (status) where.status = status as any;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          host: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ===== ADMIN: Approve Listing =====
  async approve(id: string, adminId: string) {
    return this.prisma.listing.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  }

  // ===== ADMIN: Reject Listing =====
  async reject(id: string, adminId: string, reason: string) {
    return this.prisma.listing.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewNote: reason,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  }

  // ===== ADMIN: Request Edit =====
  async requestEdit(id: string, adminId: string, notes: string) {
    return this.prisma.listing.update({
      where: { id },
      data: {
        status: 'NEEDS_EDIT',
        reviewNote: notes,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  }
}
