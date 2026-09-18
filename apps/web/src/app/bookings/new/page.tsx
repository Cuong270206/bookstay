'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const bookingSchema = z.object({
  checkIn: z.string().min(1, 'Vui lòng chọn ngày nhận phòng'),
  checkOut: z.string().min(1, 'Vui lòng chọn ngày trả phòng'),
  guestCount: z.number().min(1),
  guestName: z.string().min(2, 'Vui lòng nhập tên'),
  guestPhone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  guestEmail: z.string().email('Email không hợp lệ'),
  specialRequests: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

function BookingFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');

  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [price, setPrice] = useState({ nights: 0, subtotal: 0, cleaning: 0, total: 0 });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestCount: 1,
    },
  });

  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const guestCount = watch('guestCount');

  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  useEffect(() => {
    if (checkIn && checkOut && listing) {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const nights = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

      if (nights > 0) {
        const isWeekend = d1.getDay() === 5 || d1.getDay() === 6 || d2.getDay() === 5 || d2.getDay() === 6;
        const nightlyRate = isWeekend && listing.weekendPrice ? Number(listing.weekendPrice) : Number(listing.basePrice);
        const subtotal = nightlyRate * nights;
        const cleaning = listing.cleaningFee ? Number(listing.cleaningFee) : 0;

        setPrice({
          nights,
          subtotal,
          cleaning,
          total: subtotal + cleaning,
        });
      }
    }
  }, [checkIn, checkOut, listing]);

  const fetchListing = async () => {
    try {
      const res = await api.get(`/listings/${listingId}`);
      setListing(res.data);
    } catch (error) {
      toast.error('Không tìm thấy homestay');
      router.push('/search');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: BookingForm) => {
    if (!listingId) return;

    setIsSubmitting(true);
    try {
      // Create booking
      const bookingRes = await api.post('/bookings', {
        listingId,
        ...data,
      });

      const { bookingId, lockExpiresAt } = bookingRes.data;

      toast.success('Tạo đơn đặt phòng thành công!');

      // Create payment URL
      const paymentRes = await api.post(`/payments/${bookingId}/create`);

      if (paymentRes.data.paymentUrl) {
        // Redirect to VNPay
        window.location.href = paymentRes.data.paymentUrl;
      } else {
        router.push(`/bookings/${bookingId}/success`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  if (!listing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href={`/homestay/${listingId}`} className="text-2xl font-bold text-primary-600">
            BookStay
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Đặt phòng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin của bạn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Họ và tên</label>
                    <Input {...register('guestName')} placeholder="Nguyễn Văn A" />
                    {errors.guestName && <p className="text-sm text-red-500 mt-1">{errors.guestName.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Số điện thoại</label>
                      <Input {...register('guestPhone')} placeholder="0912345678" />
                      {errors.guestPhone && <p className="text-sm text-red-500 mt-1">{errors.guestPhone.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input {...register('guestEmail')} type="email" placeholder="email@example.com" />
                      {errors.guestEmail && <p className="text-sm text-red-500 mt-1">{errors.guestEmail.message}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ngày và số khách</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nhận phòng</label>
                      <Input
                        type="date"
                        {...register('checkIn')}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.checkIn && <p className="text-sm text-red-500 mt-1">{errors.checkIn.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Trả phòng</label>
                      <Input
                        type="date"
                        {...register('checkOut')}
                        min={checkIn || new Date().toISOString().split('T')[0]}
                      />
                      {errors.checkOut && <p className="text-sm text-red-500 mt-1">{errors.checkOut.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số khách</label>
                    <Input
                      type="number"
                      {...register('guestCount', { valueAsNumber: true })}
                      min={1}
                      max={listing.maxGuests}
                    />
                    {errors.guestCount && <p className="text-sm text-red-500 mt-1">{errors.guestCount.message}</p>}
                    <p className="text-sm text-gray-500 mt-1">Tối đa {listing.maxGuests} khách</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Yêu cầu đặc biệt (tùy chọn)</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    {...register('specialRequests')}
                    className="w-full border rounded-lg p-3 min-h-[100px]"
                    placeholder="Ví dụ: Tôi cần check-in sớm, có người đón sân bay..."
                  />
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
              </Button>

              <div className="flex items-start gap-2 text-sm text-gray-500">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <p>
                  Bằng việc nhấn "Tiếp tục thanh toán", bạn đồng ý với{' '}
                  <Link href="#" className="text-primary-600 hover:underline">Điều khoản dịch vụ</Link>{' '}
                  và{' '}
                  <Link href="#" className="text-primary-600 hover:underline">Chính sách hủy phòng</Link>{' '}
                  của BookStay.
                </p>
              </div>
            </form>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Chi tiết đặt phòng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  {listing.images?.[0] && (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm text-gray-500">{listing.address}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>{formatCurrency(Number(listing.basePrice))} x {price.nights} đêm</span>
                    <span>{formatCurrency(price.subtotal)}</span>
                  </div>
                  {price.cleaning > 0 && (
                    <div className="flex justify-between">
                      <span>Phí dọn dẹp</span>
                      <span>{formatCurrency(price.cleaning)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Tổng cộng</span>
                    <span className="text-primary-600">{formatCurrency(price.total)}</span>
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                  <p className="text-yellow-800">
                    <strong>Chính sách hủy linh hoạt:</strong>
                    <br />- Hủy trước 7 ngày: Hoàn 100%
                    <br />- Hủy 3-7 ngày: Hoàn 50%
                    <br />- Hủy dưới 3 ngày: Không hoàn tiền
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingNewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <BookingFormContent />
    </Suspense>
  );
}
