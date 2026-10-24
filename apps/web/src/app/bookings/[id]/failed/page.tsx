'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function BookingFailedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { id } = use(params);
  const { reason } = use(searchParams);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (reason) {
      toast.error(`Thanh toán không thành công: ${reason}`);
    }
  }, [reason]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await api.post(`/payments/${id}/create`);
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }
      toast.error('Không tạo được liên kết thanh toán');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Phiên thanh toán có thể đã hết hạn');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Thanh toán chưa thành công</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600">
              Đơn đặt phòng <span className="font-medium">#{id.slice(0, 8)}</span> chưa được thanh
              toán. Bạn có thể thử thanh toán lại trong thời gian giữ chỗ (20 phút) hoặc quay lại
              trang chủ.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleRetry} disabled={isRetrying} className="w-full sm:w-auto">
                <RefreshCw className="w-4 h-4 mr-2" />
                {isRetrying ? 'Đang tạo liên kết...' : 'Thử thanh toán lại'}
              </Button>
              <Link href="/profile/bookings">
                <Button variant="outline" className="w-full sm:w-auto">
                  Xem đơn của tôi
                </Button>
              </Link>
              <Link href="/home">
                <Button variant="ghost" className="w-full sm:w-auto">
                  <Home className="w-4 h-4 mr-2" />
                  Trang chủ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
