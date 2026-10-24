'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, Calendar, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/login');
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-2xl font-bold text-primary-600">
            BookStay
          </Link>
          <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}>
            Đăng xuất
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Hồ sơ của tôi</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary-700">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{user?.name}</h2>
                    <p className="text-gray-500">{user?.email}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                      user?.role === 'HOST' ? 'bg-purple-100 text-purple-700' :
                      user?.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {user?.role === 'HOST' ? 'Host' : user?.role === 'ADMIN' ? 'Admin' : 'Khách'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Họ tên</p>
                      <p className="font-medium">{user?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-medium">{user?.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-medium">{user?.address || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Link href="/profile/edit">
                    <Button variant="outline">
                      Chỉnh sửa hồ sơ
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">{user?.bookingsCount || 0}</div>
                    <p className="text-sm text-gray-500">Đặt phòng</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">
                      {user?.reviewsCount || 0}
                    </div>
                    <p className="text-sm text-gray-500">Đánh giá</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">
                      {user?.averageRating || '0.0'} ★
                    </div>
                    <p className="text-sm text-gray-500">Đánh giá TB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Liên kết nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/profile/bookings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Đặt phòng của tôi
                  </Button>
                </Link>
                <Link href="/chat" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Tin nhắn
                  </Button>
                </Link>
                {user?.role === 'HOST' && (
                  <Link href="/host/dashboard" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      Trang Host
                    </Button>
                  </Link>
                )}
                {user?.role === 'ADMIN' && (
                  <Link href="/admin" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      Trang Admin
                    </Button>
                  </Link>
                )}
                <Link href="/profile/settings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Cài đặt
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Member Since */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Thành viên từ</p>
                <p className="font-medium">{formatDate(user?.createdAt)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
