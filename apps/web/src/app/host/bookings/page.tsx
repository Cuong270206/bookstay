'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Check, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
  REFUNDED: 'Đã hoàn tiền',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  REFUNDED: 'bg-purple-100 text-purple-700',
};

export default function HostBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/hosts/bookings');
      setBookings(res.data.data || []);
    } catch (error: any) {
      if (error.response?.status === 403) {
        router.push('/host/onboarding');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: 'CONFIRMED' });
      toast.success('Đã xác nhận đặt phòng');
      fetchBookings();
    } catch (error: any) {
      toast.error('Không thể xác nhận');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return b.status === 'PENDING';
    if (filter === 'confirmed') return b.status === 'CONFIRMED';
    if (filter === 'completed') return b.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-2xl font-bold text-primary-600">
            BookStay
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/host/dashboard" className="text-gray-600">Dashboard</Link>
            <Link href="/host/listings" className="text-gray-600">Homestay</Link>
            <Link href="/host/bookings" className="font-medium">Đặt phòng</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Quản lý Đặt phòng</h1>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Chờ xác nhận' },
            { key: 'confirmed', label: 'Đã xác nhận' },
            { key: 'completed', label: 'Hoàn thành' },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4"><div className="h-24 bg-gray-200 rounded" /></CardContent>
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
                        alt=""
                        className="w-full md:w-40 h-28 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{booking.listing?.title}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.listing?.city}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${statusColors[booking.status]}`}>
                          {statusLabels[booking.status]}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                        <div>
                          <p className="text-gray-500">Khách</p>
                          <p className="font-medium">{booking.guestName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Nhận phòng</p>
                          <p className="font-medium">{formatDate(booking.checkIn)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Trả phòng</p>
                          <p className="font-medium">{formatDate(booking.checkOut)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tổng tiền</p>
                          <p className="font-bold text-primary-600">{formatCurrency(booking.totalPrice)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {booking.status === 'PENDING' && (
                          <>
                            <Button size="sm" onClick={() => handleConfirm(booking.id)}>
                              <Check className="h-4 w-4 mr-1" />
                              Xác nhận
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <X className="h-4 w-4 mr-1" />
                              Từ chối
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Nhắn tin
                        </Button>
                        <Button size="sm" variant="ghost">Chi tiết</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">Không có đặt phòng nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
