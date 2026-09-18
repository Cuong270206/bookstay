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
import { CalendarService } from './calendar.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  // ===== HOST: Get Calendar =====
  @Get(':listingId')
  @ApiOperation({ summary: 'Get calendar for listing (bookings + blocks)' })
  async getCalendar(
    @Request() req,
    @Param('listingId') listingId: string,
    @Query('month') month?: string,
  ) {
    return this.calendarService.getCalendar(listingId, req.user.hostProfile?.id || req.user.id, month);
  }

  // ===== HOST: Add Block =====
  @Post(':listingId/blocks')
  @ApiOperation({ summary: 'Add calendar block (owner blocked, maintenance)' })
  async addBlock(
    @Request() req,
    @Param('listingId') listingId: string,
    @Body() dto: CreateBlockDto,
  ) {
    return this.calendarService.addBlock(listingId, req.user.hostProfile?.id || req.user.id, dto);
  }

  // ===== HOST: Update Block =====
  @Put('blocks/:blockId')
  @ApiOperation({ summary: 'Update calendar block (optimistic lock)' })
  async updateBlock(
    @Request() req,
    @Param('blockId') blockId: string,
    @Body() dto: CreateBlockDto,
  ) {
    return this.calendarService.updateBlock(blockId, req.user.hostProfile?.id || req.user.id, dto);
  }

  // ===== HOST: Delete Block =====
  @Delete('blocks/:blockId')
  @ApiOperation({ summary: 'Delete calendar block' })
  async deleteBlock(@Request() req, @Param('blockId') blockId: string) {
    return this.calendarService.deleteBlock(blockId, req.user.hostProfile?.id || req.user.id);
  }
}
