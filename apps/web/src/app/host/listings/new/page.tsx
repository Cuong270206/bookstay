'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Image, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const listingSchema = z.object({
  title: z.string().min(10, 'Tiêu đề phải có ít nhất 10 ký tự'),
  description: z.string().min(50, 'Mô tả phải có ít nhất 50 ký tự'),
  address: z.string().min(5),
  city: z.string().min(1, 'Vui lòng chọn thành phố'),
  maxGuests: z.number().min(1),
  bedrooms: z.number().min(1),
  bathrooms: z.number().min(1),
  basePrice: z.number().min(10000, 'Giá tối thiểu 10,000đ'),
  weekendPrice: z.number().optional(),
  cleaningFee: z.number().optional(),
  amenities: z.string(),
});

type ListingForm = z.infer<typeof listingSchema>;

export default function NewListingPage() {
  const router = useRouter();
  const [images, setImages] = useState<{ url: string; order: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      city: 'Hà Nội',
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      basePrice: 500000,
    },
  });

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          { url: reader.result as string, order: prev.length },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ListingForm) => {
    if (images.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 hình ảnh');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create listing
      const listingRes = await api.post('/listings', {
        ...data,
        amenities: data.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      });

      const listingId = listingRes.data.id;

      // Upload images (in production, would upload to cloud storage first)
      for (const [index, img] of images.entries()) {
        await api.post(`/listings/${listingId}/images`, {
          url: img.url,
          order: index,
        });
      }

      toast.success('Tạo homestay thành công!');
      router.push('/host/listings');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/host/listings" className="text-2xl font-bold text-primary-600">
            BookStay
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Đăng Homestay Mới</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề *</label>
                <Input {...register('title')} placeholder="VD: Căn hộ view đẹp quận Ba Đình" />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium">Mô tả *</label>
                <textarea
                  {...register('description')}
                  className="w-full border rounded-lg p-3 min-h-[150px]"
                  placeholder="Mô tả chi tiết về homestay của bạn..."
                />
                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Thành phố *</label>
                  <select {...register('city')} className="w-full border rounded-lg p-2">
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Nha Trang">Nha Trang</option>
                    <option value="Vũng Tàu">Vũng Tàu</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Địa chỉ *</label>
                  <Input {...register('address')} placeholder="Số nhà, đường, quận" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phòng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Số khách tối đa *</label>
                  <Input type="number" {...register('maxGuests', { valueAsNumber: true })} min={1} />
                </div>
                <div>
                  <label className="text-sm font-medium">Phòng ngủ *</label>
                  <Input type="number" {...register('bedrooms', { valueAsNumber: true })} min={1} />
                </div>
                <div>
                  <label className="text-sm font-medium">Phòng tắm *</label>
                  <Input type="number" {...register('bathrooms', { valueAsNumber: true })} min={1} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Giá cả</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Giá ngày thường (VNĐ) *</label>
                  <Input type="number" {...register('basePrice', { valueAsNumber: true })} min={10000} />
                  {errors.basePrice && <p className="text-sm text-red-500 mt-1">{errors.basePrice.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Giá cuối tuần (VNĐ)</label>
                  <Input type="number" {...register('weekendPrice', { valueAsNumber: true })} placeholder="Tùy chọn" />
                </div>
                <div>
                  <label className="text-sm font-medium">Phí dọn dẹp (VNĐ)</label>
                  <Input type="number" {...register('cleaningFee', { valueAsNumber: true })} placeholder="Tùy chọn" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Tiện nghi</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium">Tiện nghi (phân cách bằng dấu phẩy)</label>
                <Input
                  {...register('amenities')}
                  placeholder="wifi, parking, kitchen, ac, tv, washer, pool"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ví dụ: wifi, parking, kitchen, ac, tv, washer, pool, gym
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-primary-600 text-white text-xs px-2 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}

                <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50">
                  <Plus className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-500 mt-1">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddImage}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">Tối thiểu 1 ảnh, tối đa 10 ảnh. Ảnh đầu tiên sẽ là ảnh bìa.</p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo Homestay'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
