import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApplyHostDto } from './dto/apply-host.dto';
import { UpdateHostProfileDto } from './dto/update-host-profile.dto';

@Injectable()
export class HostService {
  constructor(private prisma: PrismaService) {}

  // ===== GUEST: Apply to become Host =====
  async apply(userId: string, dto: ApplyHostDto) {
    // Check if already has host profile
    const existing = await this.prisma.hostProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new ConflictException('Bạn đã gửi đơn đăng ký, đang chờ duyệt');
      }
      if (existing.status === 'APPROVED') {
        throw new ConflictException('Bạn đã là host');
      }
      // If REJECTED, allow re-apply
      if (existing.status === 'REJECTED') {
        return this.prisma.hostProfile.update({
          where: { userId },
          data: {
            status: 'PENDING',
            businessName: dto.businessName,
            businessLicense: dto.businessLicense,
            rejectReason: null,
          },
        });
      }
    }

    // Create new host profile
    return this.prisma.hostProfile.create({
      data: {
        userId,
        businessName: dto.businessName,
        businessLicense: dto.businessLicense,
        status: 'PENDING',
      },
    });
  }

  // ===== HOST: Get My Profile =====
  async getProfile(userId: string) {
    const profile = await this.prisma.hostProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Bạn chưa đăng ký làm host');
    }

    return profile;
  }

  // ===== HOST: Update Profile (including bank account) =====
  async updateProfile(userId: string, dto: UpdateHostProfileDto) {
    const profile = await this.prisma.hostProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Bạn chưa đăng ký làm host');
    }

    return this.prisma.hostProfile.update({
      where: { userId },
      data: {
        businessName: dto.businessName,
        bankName: dto.bankName,
        bankAccountName: dto.bankAccountName,
        bankAccountNumber: dto.bankAccountNumber,
      },
    });
  }

  // ===== HOST: Get Stats =====
  async getStats(userId: string) {
    const profile = await this.prisma.hostProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Bạn chưa đăng ký làm host');
    }

    // Get listing stats
    const listingsCount = await this.prisma.listing.count({
      where: { hostId: profile.id, status: 'PUBLISHED' },
    });

    const pendingListings = await this.prisma.listing.count({
      where: { hostId: profile.id, status: { in: ['PENDING_REVIEW', 'NEEDS_EDIT'] } },
    });

    // Get booking stats
    const activeBookings = await this.prisma.booking.count({
      where: {
        listing: { hostId: profile.id },
        status: 'CONFIRMED',
      },
    });

    const completedBookings = await this.prisma.booking.count({
      where: {
        listing: { hostId: profile.id },
        status: 'COMPLETED',
      },
    });

    // Get revenue (from settlements)
    const earnings = await this.prisma.settlement.aggregate({
      where: {
        booking: { listing: { hostId: profile.id } },
        status: 'SETTLED',
      },
      _sum: { netAmount: true },
    });

    // Get reviews
    const reviewsCount = await this.prisma.review.count({
      where: {
        booking: { listing: { hostId: profile.id } },
        deletedAt: null,
      },
    });

    return {
      listingsCount,
      pendingListings,
      activeBookings,
      completedBookings,
      totalEarnings: earnings._sum.netAmount || 0,
      reviewsCount,
    };
  }

  // ===== ADMIN: Get All Applications =====
  async getApplications(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status = 'PENDING' } = params;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.hostProfile.findMany({
        where: { status: status as any },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        },
      }),
      this.prisma.hostProfile.count({ where: { status: status as any } }),
    ]);

    return {
      data: applications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ===== ADMIN: Approve Host Application =====
  async approveApplication(profileId: string, adminId: string) {
    return this.prisma.hostProfile.update({
      where: { id: profileId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  }

  // ===== ADMIN: Reject Host Application =====
  async rejectApplication(profileId: string, adminId: string, reason: string) {
    return this.prisma.hostProfile.update({
      where: { id: profileId },
      data: {
        status: 'REJECTED',
        rejectReason: reason,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  }

  // ===== ADMIN: Suspend Host =====
  async suspendHost(profileId: string) {
    return this.prisma.hostProfile.update({
      where: { id: profileId },
      data: { status: 'SUSPENDED' },
    });
  }

  // ===== ADMIN: Reactivate Host =====
  async reactivateHost(profileId: string) {
    return this.prisma.hostProfile.update({
      where: { id: profileId },
      data: { status: 'APPROVED' },
    });
  }

  // ===== HOST: Get Dashboard (full stats) =====
  async getDashboard(userId: string) {
    const profile = await this.prisma.hostProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Bạn chưa đăng ký làm host');
    }

    // Get stats
    const listings = await this.prisma.listing.findMany({
      where: { hostId: profile.id },
      include: {
        images: { where: { isCover: true }, take: 1 },
        _count: { select: { bookings: true } },
      },
    });

    const activeListings = listings.filter((l) => l.status === 'PUBLISHED').length;

    // Get bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        listing: { hostId: profile.id },
      },
      include: {
        listing: { select: { id: true, title: true, images: { where: { isCover: true }, take: 1 } } },
        guest: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const totalBookings = await this.prisma.booking.count({
      where: { listing: { hostId: profile.id } },
    });

    const pendingBookings = await this.prisma.booking.count({
      where: { listing: { hostId: profile.id }, status: 'PENDING' },
    });

    // Get earnings
    const earnings = await this.prisma.settlement.aggregate({
      where: {
        booking: { listing: { hostId: profile.id } },
        status: 'SETTLED',
      },
      _sum: { netAmount: true },
    });

    const monthlyEarnings = await this.prisma.settlement.aggregate({
      where: {
        booking: { listing: { hostId: profile.id } },
        status: 'SETTLED',
        createdAt: { gte: new Date(new Date().setDate(1)) }, // This month
      },
      _sum: { netAmount: true },
    });

    // Get reviews average
    const reviews = await this.prisma.review.aggregate({
      where: {
        booking: { listing: { hostId: profile.id } },
        deletedAt: null,
      },
      _avg: { rating: true },
      _count: true,
    });

    return {
      listings: listings.slice(0, 5),
      totalListings: listings.length,
      activeListings,
      recentBookings: bookings,
      totalBookings,
      pendingBookings,
      totalEarnings: earnings._sum.netAmount || 0,
      monthlyEarnings: monthlyEarnings._sum.netAmount || 0,
      averageRating: reviews._avg.rating || 0,
      totalReviews: reviews._count,
    };
  }

  // ===== HOST: Get My Listings =====
  async getMyListings(userId: string, params: { status?: string; page?: number; limit?: number }) {
    const profile = await this.prisma.hostProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Bạn chưa đăng ký làm host');
    }

    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { hostId: profile.id };
    if (status) where.status = status;

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { where: { isCover: true }, take: 1 },
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

  // ===== HOST: Get My Bookings =====
  async getMyBookings(userId: string, params: { status?: string; page?: number; limit?: number }) {
    const profile = await this.prisma.hostProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Bạn chưa đăng ký làm host');
    }

    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { listing: { hostId: profile.id } };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            select: { id: true, title: true, images: { where: { isCover: true }, take: 1 } },
          },
          guest: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
