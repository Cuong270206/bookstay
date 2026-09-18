import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ===== Dashboard Stats =====
  async getDashboard() {
    const [
      totalUsers,
      totalHosts,
      totalListings,
      pendingListings,
      totalBookings,
      confirmedBookings,
      completedBookings,
      totalRevenue,
      pendingRefunds,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.hostProfile.count({ where: { status: 'APPROVED' } }),
      this.prisma.listing.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.listing.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.settlement.aggregate({
        where: { status: 'SETTLED' },
        _sum: { commission: true },
      }),
      this.prisma.refund.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      users: totalUsers,
      hosts: totalHosts,
      listings: totalListings,
      pendingListings,
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
      },
      revenue: {
        totalCommission: totalRevenue._sum.commission || 0,
      },
      pendingRefunds,
    };
  }

  // ===== Listing Management =====
  async getListings(params: { page?: number; limit?: number; status?: string; city?: string }) {
    const { page = 1, limit = 20, status, city } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          host: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
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

  async approveListing(id: string, adminId: string) {
    return this.prisma.listing.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  }

  async rejectListing(id: string, adminId: string, reason: string) {
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

  async requestEditListing(id: string, adminId: string, notes: string) {
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

  // ===== User Management =====
  async getUsers(params: { page?: number; limit?: number; role?: string; status?: string }) {
    const { page = 1, limit = 20, role, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          avatar: true,
          createdAt: true,
          hostProfile: {
            select: { status: true, listingCount: true },
          },
          _count: { select: { bookings: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async suspendUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });
  }

  async reactivateUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  // ===== Booking Management =====
  async getBookings(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

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

  // ===== Refund Management =====
  async getRefunds(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status = 'PENDING' } = params;
    const skip = (page - 1) * limit;

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where: { status },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            include: {
              booking: {
                include: {
                  listing: { select: { id: true, title: true } },
                  guest: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.refund.count({ where: { status } }),
    ]);

    return {
      data: refunds,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveRefund(id: string, adminId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!refund) {
      throw new Error('Refund not found');
    }

    // TODO: Call VNPay refund API
    // For now, just mark as completed

    return this.prisma.refund.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        adminId,
        processedAt: new Date(),
      },
    });
  }

  async rejectRefund(id: string, adminId: string, reason: string) {
    return this.prisma.refund.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminId,
        processedAt: new Date(),
      },
    });
  }

  // ===== Reports =====
  async getRevenueReport(params: { startDate?: string; endDate?: string }) {
    const where: any = {};

    if (params.startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(params.startDate) };
    }
    if (params.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(params.endDate) };
    }

    const [settlements, bookings] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        include: {
          booking: {
            include: {
              listing: { select: { id: true, title: true, city: true } },
              guest: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.groupBy({
        by: ['status'],
        _count: true,
        _sum: { totalAmount: true },
        where,
      }),
    ]);

    const totalCommission = settlements.reduce(
      (sum, s) => sum + Number(s.commission),
      0,
    );
    const totalGMV = settlements.reduce(
      (sum, s) => sum + Number(s.grossAmount),
      0,
    );

    return {
      settlements,
      summary: {
        totalGMV,
        totalCommission,
        settlementCount: settlements.length,
        bookingStats: bookings,
      },
    };
  }

  async getCommissionReport(params: { startDate?: string; endDate?: string }) {
    const where: any = { status: 'SETTLED' };

    if (params.startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(params.startDate) };
    }
    if (params.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(params.endDate) };
    }

    const settlements = await this.prisma.settlement.findMany({
      where,
      include: {
        booking: {
          include: {
            listing: { select: { id: true, title: true, city: true } },
          },
        },
      },
    });

    const byCity: Record<string, number> = {};
    settlements.forEach((s) => {
      const city = s.booking.listing.city;
      byCity[city] = (byCity[city] || 0) + Number(s.commission);
    });

    return {
      total: settlements.reduce((sum, s) => sum + Number(s.commission), 0),
      byCity,
      settlements,
    };
  }
}
