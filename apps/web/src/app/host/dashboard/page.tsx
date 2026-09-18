'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, DollarSign, MessageSquare, Plus, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HostDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/hosts/dashboard');
      setStats(res.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Bạn chưa đăng ký làm Host');
        router.push('/host/onboarding');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-2xl font-bold text-primary-600">
            BookStay
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/host/dashboard" className="font-medium">Dashboard</Link>
            <Link href="/host/listings" className="text-gray-600">Homestay</Link>
            <Link href="/host/bookings" className="text-gray-600">Đặt phòng</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Dashboard Host</h1>
          <Link href="/host/listings/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Homestay
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tổng thu nhập</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalEarnings || 0)}</div>
              <p className="text-xs text-gray-500">Tháng này: {formatCurrency(stats?.monthlyEarnings || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Số đặt phòng</CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
              <p className="text-xs text-green-600">+{stats?.pendingBookings || 0} đang chờ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Homestay</CardTitle>
              <Home className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalListings || 0}</div>
              <p className="text-xs text-gray-500">{stats?.activeListings || 0} đang hoạt động</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Đánh giá TB</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageRating?.toFixed(1) || '0.0'} ★</div>
              <p className="text-xs text-gray-500">{stats?.totalReviews || 0} đánh giá</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Đặt phòng gần đây</CardTitle>
              <Link href="/host/bookings">
                <Button variant="ghost" size="sm">Xem tất cả</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentBookings?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentBookings.slice(0, 5).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{booking.listing?.title}</p>
                        <p className="text-sm text-gray-500">
                          {booking.guestName} · {formatCurrency(booking.totalPrice)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status === 'CONFIRMED' ? 'Xác nhận' : booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Chưa có đặt phòng nào</p>
              )}
            </CardContent>
          </Card>

          {/* Host Listings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Homestay của tôi</CardTitle>
              <Link href="/host/listings">
                <Button variant="ghost" size="sm">Xem tất cả</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.listings?.length > 0 ? (
                <div className="space-y-4">
                  {stats.listings.slice(0, 5).map((listing: any) => (
                    <div key={listing.id} className="flex items-center gap-4">
                      {listing.images?.[0] && (
                        <img
                          src={listing.images[0].url}
                          alt={listing.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-sm text-gray-500">{listing.bookingsCount || 0} đặt phòng</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        listing.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.status === 'ACTIVE' ? 'Hoạt động' : listing.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-3">Bạn chưa có homestay nào</p>
                  <Link href="/host/listings/new">
                    <Button size="sm">Thêm homestay đầu tiên</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
