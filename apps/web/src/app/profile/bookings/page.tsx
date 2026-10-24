'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';

const statusLabels: Record<BookingStatus, string> = {
  PENDING: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
  REFUNDED: 'Đã hoàn tiền',
};

const statusColors: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  REFUNDED: 'bg-purple-100 text-purple-700',
};

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data.data || []);
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/login');
      } else {
        toast.error('Không thể tải danh sách đặt phòng');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Bạn có chắc muốn hủy đặt phòng này?')) return;

    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      toast.success('Hủy đặt phòng thành công');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể hủy đặt phòng');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['PENDING', 'CONFIRMED'].includes(b.status);
    if (filter === 'completed') return b.status === 'COMPLETED';
    if (filter === 'cancelled') return ['CANCELLED', 'REFUNDED'].includes(b.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-2xl font-bold text-primary-600">
            BookStay
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-gray-600 hover:text-gray-900">Hồ sơ</Link>
            <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} className="text-red-600">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Đặt phòng của tôi</h1>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'upcoming', 'completed', 'cancelled'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Tất cả' :
               f === 'upcoming' ? 'Sắp tới' :
               f === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
            </Button>
          ))}
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-32 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {booking.listing?.images?.[0] && (
                      <img
                        src={booking.listing.images[0].url}
                        alt={booking.listing.title}
                        className="w-full md:w-48 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{booking.listing?.title}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.listing?.address}, {booking.listing?.city}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${statusColors[booking.status as BookingStatus]}`}>
                          {statusLabels[booking.status as BookingStatus]}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Nhận phòng</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(booking.checkIn)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Trả phòng</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(booking.checkOut)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Số khách</p>
                          <p className="font-medium">{booking.guestCount} khách</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tổng tiền</p>
                          <p className="font-bold text-primary-600">{formatCurrency(booking.totalPrice)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/bookings/${booking.id}`}>
                          <Button variant="outline" size="sm">Chi tiết</Button>
                        </Link>

                        {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(booking.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Hủy đặt phòng
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Nhắn tin Host
                            </Button>
                          </>
                        )}

                        {booking.status === 'COMPLETED' && !booking.review && (
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-1" />
                            Đánh giá
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Chưa có đặt phòng nào</p>
            <Button className="mt-4" onClick={() => router.push('/search')}>
              Tìm homestay
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
