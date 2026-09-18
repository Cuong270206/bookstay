import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HostService } from './host.service';
import { ApplyHostDto } from './dto/apply-host.dto';
import { UpdateHostProfileDto } from './dto/update-host-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Host')
@Controller('host')
export class HostController {
  constructor(private hostService: HostService) {}

  // ===== GUEST: Apply to become Host =====
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to become a host' })
  async apply(@Request() req, @Body() dto: ApplyHostDto) {
    return this.hostService.apply(req.user.id, dto);
  }

  // ===== HOST: Get My Profile =====
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my host profile' })
  async getProfile(@Request() req) {
    return this.hostService.getProfile(req.user.id);
  }

  // ===== HOST: Update Profile =====
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update host profile (including bank account)' })
  async updateProfile(@Request() req, @Body() dto: UpdateHostProfileDto) {
    return this.hostService.updateProfile(req.user.id, dto);
  }

  // ===== HOST: Get Stats =====
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard stats' })
  async getStats(@Request() req) {
    return this.hostService.getStats(req.user.id);
  }

  // ===== ADMIN: Get Applications =====
  @Get('admin/applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOperation({ summary: '[Admin] Get host applications' })
  async getApplications(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hostService.getApplications({
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  // ===== ADMIN: Approve Application =====
  @Post('admin/applications/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Approve host application' })
  async approveApplication(@Request() req, @Body() body: { profileId: string }) {
    return this.hostService.approveApplication(body.profileId, req.user.id);
  }

  // ===== ADMIN: Reject Application =====
  @Post('admin/applications/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Reject host application' })
  async rejectApplication(
    @Request() req,
    @Body() body: { profileId: string; reason: string },
  ) {
    return this.hostService.rejectApplication(body.profileId, req.user.id, body.reason);
  }

  // ===== ADMIN: Suspend Host =====
  @Post('admin/suspend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Suspend host' })
  async suspendHost(@Body() body: { profileId: string }) {
    return this.hostService.suspendHost(body.profileId);
  }

  // ===== ADMIN: Reactivate Host =====
  @Post('admin/reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Reactivate host' })
  async reactivateHost(@Body() body: { profileId: string }) {
    return this.hostService.reactivateHost(body.profileId);
  }
}
