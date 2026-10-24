import { Controller, Get, Post, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ===== Create Payment URL =====
  @Post(':bookingId/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create VNPay payment URL' })
  async createPayment(@Request() req, @Param('bookingId') bookingId: string) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    return this.paymentsService.createPaymentUrl(bookingId, req.user.id, ip);
  }

  // ===== VNPay Return (browser redirect from VNPay) =====
  @Get('vnpay-return')
  @ApiOperation({ summary: 'VNPay return URL (redirect from VNPay)' })
  async vnpayReturn(@Request() req, @Query() query: Record<string, string>, @Res() res: Response) {
    const result = await this.paymentsService.handleVNPayReturn(query);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (result.success && result.bookingId) {
      return res.redirect(`${baseUrl}/bookings/${result.bookingId}/success`);
    }
    if (result.bookingId) {
      return res.redirect(
        `${baseUrl}/bookings/${result.bookingId}/failed?reason=${encodeURIComponent(result.message)}`,
      );
    }
    return res.redirect(`${baseUrl}/home`);
  }

  // ===== VNPay IPN (server-to-server callback) =====
  @Post('vnpay-ipn')
  @ApiOperation({ summary: 'VNPay IPN (server-to-server callback)' })
  async vnpayIpn(@Query() query: Record<string, string>) {
    const result = await this.paymentsService.handleVNPayReturn(query);

    // Response format theo tài liệu IPN của VNPay
    return {
      RspnCode: result.responseCode,
      Message: result.message,
    };
  }

  // ===== Get Payment Status (polling) =====
  @Get(':bookingId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status (for polling)' })
  async getStatus(@Request() req, @Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentStatus(bookingId, req.user.id);
  }
}
