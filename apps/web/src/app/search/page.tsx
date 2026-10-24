'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, Filter, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Listing } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || 'Hà Nội',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || '',
    minPrice: '',
    maxPrice: '',
    amenities: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    fetchListings();
  }, [page]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '12',
      };
      if (filters.city) params.city = filters.city;
      if (filters.guests) params.guests = filters.guests;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      const res = await api.get('/listings', { params });
      setListings(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-2xl font-bold text-primary-600">
            BookStay
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Địa điểm</label>
              <Input
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="Hà Nội"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nhận phòng</label>
              <Input
                type="date"
                value={filters.checkIn}
                onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Trả phòng</label>
              <Input
                type="date"
                value={filters.checkOut}
                onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Số khách</label>
              <Input
                type="number"
                min={1}
                value={filters.guests}
                onChange={(e) => setFilters({ ...filters, guests: e.target.value })}
                placeholder="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Giá thấp nhất</label>
              <Input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Giá cao nhất</label>
              <Input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                placeholder="10000000"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Button type="submit">Tìm kiếm</Button>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá thấp đến cao</option>
              <option value="price_desc">Giá cao đến thấp</option>
            </select>
          </div>
        </form>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {total} homestay tại {filters.city || 'Hà Nội'}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

            {/* Pagination */}
            {total > 12 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <span className="px-4 py-2">
                  Trang {page} / {Math.ceil(total / 12)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 12)}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Không tìm thấy homestay nào</p>
            <p className="text-gray-400 mt-2">Thử thay đổi bộ lọc</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8">Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}
