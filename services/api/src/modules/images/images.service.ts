import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ImagesService {
  constructor(private prisma: PrismaService) {}

  async addImage(listingId: string, hostId: string, url: string, cloudinaryId?: string, order?: number) {
    // Verify ownership
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Homestay không tồn tại');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền thêm ảnh vào homestay này');
    }

    // Get current max order
    const maxOrder = await this.prisma.listingImage.aggregate({
      where: { listingId },
      _max: { order: true },
    });

    return this.prisma.listingImage.create({
      data: {
        listingId,
        url,
        cloudinaryId,
        order: order ?? (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  async deleteImage(imageId: string, hostId: string) {
    const image = await this.prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: true },
    });

    if (!image) {
      throw new NotFoundException('Ảnh không tồn tại');
    }

    if (image.listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền xóa ảnh này');
    }

    return this.prisma.listingImage.delete({
      where: { id: imageId },
    });
  }

  async reorderImages(listingId: string, hostId: string, imageOrders: { id: string; order: number }[]) {
    // Verify ownership
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.hostId !== hostId) {
      throw new ForbiddenException('Bạn không có quyền thực hiện');
    }

    // Update orders
    await Promise.all(
      imageOrders.map((item) =>
        this.prisma.listingImage.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    return { message: 'Đã cập nhật thứ tự ảnh' };
  }
}
