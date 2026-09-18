'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Calendar, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Listing } from '@/types';
import { useAuthStore } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState({
    city: 'Hà Nội',
    checkIn: '',
    checkOut: '',
    guests: 1,
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await api.get('/listings', {
        params: { limit: 8 },
      });
      setListings(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.city) params.set('city', search.city);
    if (search.guests) params.set('guests', search.guests.toString());
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            BookStay
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/bookings" className="text-gray-600 hover:text-gray-900">
                  Đơn đặt phòng
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                  Tài khoản
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button>Đăng ký</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            BookStay — Homestay Hà Nội, dễ đặt, an tâm ở
          </h1>
          <p className="text-xl mb-8 text-primary-100">
            Khám phá homestay tuyệt vời tại Hà Nội
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10 text-gray-900"
                  placeholder="Địa điểm"
                  value={search.city}
                  onChange={(e) => setSearch({ ...search, city: e.target.value })}
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10 text-gray-900"
                  type="date"
                  placeholder="Nhận phòng"
                  value={search.checkIn}
                  onChange={(e) => setSearch({ ...search, checkIn: e.target.value })}
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10 text-gray-900"
                  type="date"
                  placeholder="Trả phòng"
                  value={search.checkOut}
                  onChange={(e) => setSearch({ ...search, checkOut: e.target.value })}
                />
              </div>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10 text-gray-900"
                  type="number"
                  placeholder="Số khách"
                  min={1}
                  value={search.guests}
                  onChange={(e) => setSearch({ ...search, guests: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-4 bg-primary-600 hover:bg-primary-700">
              <Search className="mr-2 h-5 w-5" />
              Tìm kiếm
            </Button>
          </form>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Homestay nổi bật</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/homestay/${listing.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="relative h-48">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-t-lg flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {listing.city}
                    </p>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center gap-1">
                      {listing.averageRating ? (
                        <>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{listing.averageRating}</span>
                          <span className="text-sm text-gray-500">({listing.reviewCount})</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Chưa có đánh giá</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {listing.maxGuests} khách · {listing.bedrooms} PN · {listing.bathrooms} WC
                    </p>
                  </CardContent>
                  <CardFooter>
                    <p className="font-bold text-primary-600">
                      {formatCurrency(Number(listing.basePrice))}
                      <span className="text-sm font-normal text-gray-500">/đêm</span>
                    </p>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Chưa có homestay nào</p>
          </div>
        )}

        {listings.length > 0 && (
          <div className="text-center mt-8">
            <Link href="/search">
              <Button variant="outline" size="lg">
                Xem tất cả homestay
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">BookStay</h3>
              <p className="text-gray-400">
                Nền tảng đặt phòng homestay hàng đầu tại Hà Nội
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liên kết</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/search" className="hover:text-white">Tìm kiếm</Link></li>
                <li><Link href="/register" className="hover:text-white">Đăng ký host</Link></li>
                <li><Link href="/login" className="hover:text-white">Đăng nhập</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Hotline: 1900-xxxx</li>
                <li>Email: support@bookstay.vn</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BookStay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
