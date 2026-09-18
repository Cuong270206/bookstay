import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // ===== Public: Get Listing Reviews =====
  @Get('listing/:listingId')
  @ApiOperation({ summary: 'Get reviews for a listing' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getListingReviews(
    @Param('listingId') listingId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.getListingReviews(listingId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  // ===== Guest: Create Review =====
  @Post('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit review for completed booking' })
  async create(
    @Request() req,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(bookingId, req.user.id, dto);
  }

  // ===== Guest: Update Review =====
  @Put(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review (within 48h)' })
  async update(
    @Request() req,
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(reviewId, req.user.id, dto);
  }

  // ===== Guest: Delete Review =====
  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete review' })
  async delete(@Request() req, @Param('reviewId') reviewId: string) {
    return this.reviewsService.delete(reviewId, req.user.id);
  }

  // ===== Host: Flag Review =====
  @Post(':reviewId/flag')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Flag review (host only)' })
  async flagReview(
    @Request() req,
    @Param('reviewId') reviewId: string,
    @Body() body: { reason: string },
  ) {
    return this.reviewsService.flagReview(reviewId, req.user.hostProfile?.id || req.user.id, body.reason);
  }
}
