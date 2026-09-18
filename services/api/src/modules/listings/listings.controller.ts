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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  // ===== PUBLIC: Search & Filter =====
  @Get()
  @ApiOperation({ summary: 'Search listings with filters' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'checkIn', required: false })
  @ApiQuery({ name: 'checkOut', required: false })
  @ApiQuery({ name: 'guests', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'amenities', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['newest', 'price_asc', 'price_desc', 'rating'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async search(
    @Query('city') city?: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('guests') guests?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('amenities') amenities?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingsService.search({
      city,
      checkIn,
      checkOut,
      guests: guests ? parseInt(guests) : undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      amenities,
      sortBy,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  // ===== PUBLIC: Get Single Listing =====
  @Get(':id')
  @ApiOperation({ summary: 'Get listing details' })
  async findById(@Param('id') id: string) {
    return this.listingsService.findById(id);
  }

  // ===== PUBLIC: Get Calendar =====
  @Get(':id/calendar')
  @ApiOperation({ summary: 'Get listing availability calendar' })
  @ApiQuery({ name: 'month', required: false, example: '2025-01' })
  async getCalendar(@Param('id') id: string, @Query('month') month?: string) {
    return this.listingsService.getCalendar(id, month);
  }

  // ===== HOST: Create Listing =====
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new listing (as host)' })
  async create(@Request() req, @Body() dto: CreateListingDto) {
    const hostProfile = req.user.hostProfile;
    if (!hostProfile) {
      return { message: 'Bạn chưa đăng ký làm host', status: 403 };
    }
    return this.listingsService.create(hostProfile.id, dto);
  }

  // ===== HOST: Get My Listings =====
  @Get('host/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my listings' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findMyListings(
    @Request() req,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const hostProfile = req.user.hostProfile;
    if (!hostProfile) {
      return { message: 'Bạn chưa đăng ký làm host', status: 403 };
    }
    return this.listingsService.findMyListings(hostProfile.id, {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  // ===== HOST: Update Listing =====
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update listing' })
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateListingDto) {
    const hostProfile = req.user.hostProfile;
    if (!hostProfile) {
      return { message: 'Bạn chưa đăng ký làm host', status: 403 };
    }
    return this.listingsService.update(id, hostProfile.id, dto);
  }

  // ===== HOST: Submit for Review =====
  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit listing for admin review' })
  async submitForReview(@Request() req, @Param('id') id: string) {
    const hostProfile = req.user.hostProfile;
    if (!hostProfile) {
      return { message: 'Bạn chưa đăng ký làm host', status: 403 };
    }
    return this.listingsService.submitForReview(id, hostProfile.id);
  }

  // ===== HOST: Delete Listing =====
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete listing' })
  async delete(@Request() req, @Param('id') id: string) {
    const hostProfile = req.user.hostProfile;
    if (!hostProfile) {
      return { message: 'Bạn chưa đăng ký làm host', status: 403 };
    }
    return this.listingsService.delete(id, hostProfile.id);
  }
}
