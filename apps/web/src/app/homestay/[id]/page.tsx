'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, Users, Bed, Bath, Wifi, Car, Coffee, Wind, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Listing, Review } from '@/types';
import toast from 'react-hot-toast';

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-5 w-5" />,
  parking: <Car className="h-5 w-5" />,
  kitchen: <Coffee className="h-5 w-5" />,
  ac: <Wind className="h-5 w-5" />,
};

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await api.get(`/listings/${id}`);
      setListing(res.data);
      setReviews(res.data.reviews || []);
    } catch (error) {
      toast.error('Không tìm thấy homestay');
      router.push('/search');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-6" />
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const images = listing.images?.length > 0 
    ? listing.images.sort((a, b) => a.order - b.order) 
    : [{ url: 'https://via.placeholder.com/800x600', order: 0 }];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-2xl font-bold text-primary-600">
            BookStay
          </Link>
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="relative mb-8">
          <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
            <img
              src={images[currentImage]?.url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((i) => Math.max(0, i - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setCurrentImage((i) => Math.min(images.length - 1, i + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-2 h-2 rounded-full ${i === currentImage ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
            <div className="flex items-center gap-4 text-gray-600 mb-4">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {listing.address}
              </span>
              {listing.averageRating && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {listing.averageRating} ({listing.reviewCount} đánh giá)
                </span>
              )}
            </div>

            {/* Property Details */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span>{listing.maxGuests} khách</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-400" />
                    <span>{listing.bedrooms} phòng ngủ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-400" />
                    <span>{listing.bathrooms} phòng tắm</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Mô tả</h2>
              <p className="text-gray-600 whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Tiện nghi</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {listing.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-gray-600">
                      {amenityIcons[amenity] || <Wifi className="h-5 w-5" />}
                      <span className="capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Đánh giá</h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-semibold">
                              {review.reviewer?.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{review.reviewer?.name}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && <p className="text-gray-600">{review.comment}</p>}
                        <p className="text-sm text-gray-400 mt-2">{formatDate(review.createdAt)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Chưa có đánh giá nào</p>
              )}
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(Number(listing.basePrice))}
                  </span>
                  <span className="text-gray-500">/đêm</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Ngày nhận phòng</label>
                  <Input type="date" className="mt-1" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="text-sm font-medium">Ngày trả phòng</label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Số khách</label>
                  <Input type="number" className="mt-1" min={1} max={listing.maxGuests} defaultValue={1} />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{formatCurrency(Number(listing.basePrice))} x 1 đêm</span>
                    <span>{formatCurrency(Number(listing.basePrice))}</span>
                  </div>
                  {listing.cleaningFee && (
                    <div className="flex justify-between text-sm mb-1">
                      <span>Phí dọn dẹp</span>
                      <span>{formatCurrency(Number(listing.cleaningFee))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Tổng cộng</span>
                    <span className="text-primary-600">{formatCurrency(Number(listing.basePrice) + (listing.cleaningFee ? Number(listing.cleaningFee) : 0))}</span>
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={() => router.push(`/bookings/new?listingId=${listing.id}`)}>
                  <Calendar className="mr-2 h-5 w-5" />
                  Đặt phòng
                </Button>
                <p className="text-xs text-gray-500 text-center">Bạn sẽ chưa bị tính phí</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
