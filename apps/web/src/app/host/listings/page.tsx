'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HostListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await api.get('/hosts/listings');
      setListings(res.data.data || []);
    } catch (error: any) {
      if (error.response?.status === 403) {
        router.push('/host/onboarding');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Bạn có chắc muốn xóa homestay này?')) return;

    try {
      await api.delete(`/listings/${listingId}`);
      toast.success('Xóa homestay thành công');
      fetchListings();
    } catch (error: any) {
      toast.error('Không thể xóa homestay');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-2xl font-bold text-primary-600">
            BookStay
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/host/dashboard" className="text-gray-600">Dashboard</Link>
            <Link href="/host/listings" className="font-medium">Homestay</Link>
            <Link href="/host/bookings" className="text-gray-600">Đặt phòng</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Quản lý Homestay</h1>
          <Link href="/host/listings/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Homestay
            </Button>
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden">
                <div className="relative h-48">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                    listing.status === 'ACTIVE' ? 'bg-green-500 text-white' :
                    listing.status === 'PENDING' ? 'bg-yellow-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {listing.status === 'ACTIVE' ? 'Hoạt động' :
                     listing.status === 'PENDING' ? 'Chờ duyệt' : listing.status}
                  </span>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">{listing.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{listing.city}</p>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Giá:</span>
                      <span className="font-medium ml-1">{formatCurrency(Number(listing.basePrice))}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Đặt:</span>
                      <span className="font-medium ml-1">{listing.bookingsCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Đánh giá:</span>
                      <span className="font-medium ml-1">
                        {listing.averageRating ? `${listing.averageRating}★` : 'Chưa có'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/homestay/${listing.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                    </Link>
                    <Link href={`/host/listings/${listing.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-1" />
                        Sửa
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(listing.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Chưa có homestay nào</h2>
            <p className="text-gray-500 mb-6">Bắt đầu đăng homestay đầu tiên của bạn</p>
            <Link href="/host/listings/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Thêm Homestay
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
