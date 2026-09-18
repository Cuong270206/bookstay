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
}
