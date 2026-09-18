'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BookingSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (error) {
      toast.error('Không tìm thấy đơn đặt phòng');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt phòng thành công!</h1>
          <p className="text-gray-600">Cảm ơn bạn đã sử dụng dịch vụ của BookStay</p>
        </div>

        {booking && (
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết đặt phòng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Mã đặt phòng:</span>
                <span className="font-mono font-bold">#{booking.id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg">{booking.listing?.title}</h3>
                <p className="text-gray-500 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {booking.listing?.address}, {booking.listing?.city}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-gray-500">Nhận phòng</p>
                  <p className="font-medium">{formatDate(booking.checkIn)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trả phòng</p>
                  <p className="font-medium">{formatDate(booking.checkOut)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-gray-500">Số khách</p>
                  <p className="font-medium">{booking.guestCount} khách</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.status === 'CONFIRMED' ? 'Đã xác nhận' :
                     booking.status === 'PENDING' ? 'Chờ thanh toán' : booking.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Đặt cọc ({Math.round(Number(booking.totalPrice) * 0.3)}đ)</span>
                  <span>{formatCurrency(Math.round(Number(booking.totalPrice) * 0.3))}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Tổng thanh toán</span>
                  <span className="text-primary-600">{formatCurrency(booking.totalPrice)}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-t pt-4">
                <h4 className="font-medium mb-2">Liên hệ Host</h4>
                <div className="space-y-2 text-sm">
                  {booking.listing?.host?.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {booking.listing.host.phone}
                    </p>
                  )}
                  {booking.listing?.host?.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {booking.listing.host.email}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => router.push('/profile/bookings')}>
            Xem đơn đặt phòng
          </Button>
          <Button className="flex-1" onClick={() => router.push('/home')}>
            Quay về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
