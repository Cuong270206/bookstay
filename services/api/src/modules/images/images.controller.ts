import { Controller, Post, Delete, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Images')
@Controller('images')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post()
  @ApiOperation({ summary: 'Add image to listing' })
  async addImage(
    @Request() req,
    @Body() body: { listingId: string; url: string; cloudinaryId?: string; order?: number },
  ) {
    const hostProfile = req.user.hostProfile;
    if (!hostProfile) {
      return { message: 'Bạn chưa đăng ký làm host' };
    }
    return this.imagesService.addImage(body.listingId, hostProfile.id, body.url, body.cloudinaryId, body.order);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete image' })
  async deleteImage(@Request() req, @Param('id') id: string) {
    const hostProfile = req.user.hostProfile;
    if (!hostProfile) {
      return { message: 'Bạn chưa đăng ký làm host' };
    }
    return this.imagesService.deleteImage(id, hostProfile.id);
  }

  @Put('reorder/:listingId')
  @ApiOperation({ summary: 'Reorder images' })
  async reorderImages(
    @Request() req,
    @Param('listingId') listingId: string,
    @Body() body: { imageOrders: { id: string; order: number }[] },
  ) {
    const hostProfile = req.user.hostProfile;
    if (!hostProfile) {
      return { message: 'Bạn chưa đăng ký làm host' };
    }
    return this.imagesService.reorderImages(listingId, hostProfile.id, body.imageOrders);
  }
}
