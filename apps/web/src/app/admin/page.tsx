'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Home, Calendar, DollarSign, Flag, BarChart3, Settings, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền truy cập trang này');
        router.push('/home');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-2xl font-bold text-primary-600">
            BookStay Admin
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-medium">Dashboard</Link>
            <Link href="/admin/users" className="text-gray-600">Người dùng</Link>
            <Link href="/admin/listings" className="text-gray-600">Homestay</Link>
            <Link href="/admin/bookings" className="text-gray-600">Đơn hàng</Link>
            <Link href="/admin/reports" className="text-gray-600">Báo cáo</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-xs text-gray-500">Tháng này: {formatCurrency(stats?.monthlyRevenue || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Đơn đặt phòng</CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
              <p className="text-xs text-green-600">+{stats?.pendingBookings || 0} đang chờ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Người dùng</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-gray-500">{stats?.totalHosts || 0} Hosts</p>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Đơn đặt phòng gần đây</CardTitle>
              <Link href="/admin/bookings">
                <Button variant="ghost" size="sm">Xem tất cả</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentBookings?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentBookings.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{booking.guest?.name}</p>
                        <p className="text-sm text-gray-500">{booking.listing?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(booking.totalPrice)}</p>
                        <p className="text-xs text-gray-500">{formatDate(booking.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Chưa có đơn nào</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Người dùng mới</CardTitle>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">Xem tất cả</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentUsers?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'HOST' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'HOST' ? 'Host' : user.role === 'ADMIN' ? 'Admin' : 'Guest'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Chưa có người dùng nào</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Users className="h-5 w-5" />
                <span>Quản lý Users</span>
              </Button>
            </Link>
            <Link href="/admin/listings">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Home className="h-5 w-5" />
                <span>Quản lý Listings</span>
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FileText className="h-5 w-5" />
                <span>Xem Báo cáo</span>
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Settings className="h-5 w-5" />
                <span>Cài đặt</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
