import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ===== Create VNPay Payment URL =====
  async createPaymentUrl(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, guest: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    if (booking.guestId !== userId) {
      throw new BadRequestException('Bạn không có quyền thanh toán booking này');
    }

    if (booking.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('Booking không ở trạng thái chờ thanh toán');
    }

    const payment = booking.payment;
    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    // Check lock expiry
    if (payment.lockExpiresAt && new Date() > payment.lockExpiresAt) {
      throw new BadRequestException('Phiên thanh toán đã hết hạn. Vui lòng tạo booking mới.');
    }

    // VNPay parameters
    const vnp_TmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || 'TEST';
    const vnp_HashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || 'TEST_SECRET';
    const vnp_Url = this.configService.get<string>('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnp_ReturnUrl = this.configService.get<string>('VNPAY_RETURN_URL') || 'http://localhost:3000/payment/callback';

    const vnp_TxnRef = booking.id; // Booking ID as transaction ref
    const vnp_Amount = Number(booking.totalAmount) * 100; // Convert to cents
    const vnp_OrderInfo = `Thanh toan BookStay - ${booking.id}`;
    const vnp_IpAddr = '127.0.0.1';
    const vnp_CreateDate = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];

    // Build query string
    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef,
      vnp_Amount: String(vnp_Amount),
      vnp_OrderInfo,
      vnp_OrderType: 'billpayment',
      vnp_IpAddr,
      vnp_CreateDate,
      vnp_ExpireDate: payment.lockExpiresAt 
        ? new Date(payment.lockExpiresAt.getTime() - 5 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0]
        : '',
      vnp_ReturnUrl,
    };

    // Sort and create hash
    const sortedKeys = Object.keys(params).sort();
    const signData = sortedKeys
      .filter(k => params[k])
      .map(k => `${k}=${params[k]}`)
      .join('&');

    const vnp_SecureHash = crypto
      .createHmac('sha256', vnp_HashSecret)
      .update(signData)
      .digest('hex');

    const paymentUrl = `${vnp_Url}?${signData}&vnp_SecureHash=${vnp_SecureHash}`;

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PENDING' },
    });

    return {
      paymentUrl,
      bookingId: booking.id,
      amount: Number(booking.totalAmount),
      expiresAt: payment.lockExpiresAt,
    };
  }

  // ===== VNPay Return (IPN - background callback) =====
  async handleVNPayReturn(query: Record<string, string>) {
    const vnp_ResponseCode = query['vnp_ResponseCode'];
    const vnp_TxnRef = query['vnp_TxnRef']; // Booking ID
    const vnp_TransactionNo = query['vnp_TransactionNo'];
    const vnp_BankCode = query['vnp_BankCode'];
    const vnp_PayDate = query['vnp_PayDate'];
    const vnp_SecureHash = query['vnp_SecureHash'];

    // Verify checksum
    const isValid = this.verifyChecksum(query);
    if (!isValid) {
      return { success: false, message: 'Invalid checksum' };
    }

    // Find booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: vnp_TxnRef },
      include: { payment: true },
    });

    if (!booking) {
      return { success: false, message: 'Booking not found' };
    }

    // Update payment
    await this.prisma.payment.update({
      where: { id: booking.payment!.id },
      data: {
        vnpTransactionId: vnp_TransactionNo,
        vnpBankCode: vnp_BankCode,
        vnpPayDate: vnp_PayDate ? new Date(vnp_PayDate) : null,
        vnpResponseCode: vnp_ResponseCode,
        status: vnp_ResponseCode === '00' ? 'SUCCESS' : 'FAILED',
      },
    });

    // Update booking status
    if (vnp_ResponseCode === '00') {
      await this.prisma.booking.update({
        where: { id: vnp_TxnRef },
        data: { status: 'CONFIRMED' },
      });
      return { success: true, bookingId: vnp_TxnRef, status: 'CONFIRMED' };
    } else {
      return { success: false, bookingId: vnp_TxnRef, status: 'FAILED' };
    }
  }

  // ===== Get Payment Status (for polling) =====
  async getPaymentStatus(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    // Check permission
    const isGuest = booking.guestId === userId;
    const isHost = booking.listing && booking.listing.host?.userId === userId;
    if (!isGuest && !isHost) {
      throw new BadRequestException('Không có quyền');
    }

    return {
      bookingId: booking.id,
      status: booking.status,
      paymentStatus: booking.payment?.status,
      vnpResponseCode: booking.payment?.vnpResponseCode,
      updatedAt: booking.updatedAt,
    };
  }

  // ===== Verify checksum =====
  private verifyChecksum(query: Record<string, string>): boolean {
    const vnp_SecureHash = query['vnp_SecureHash'];
    const vnp_HashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || 'TEST_SECRET';

    const { vnp_SecureHash: _, ...params } = query;
    const sortedKeys = Object.keys(params).sort();
    const signData = sortedKeys
      .filter(k => params[k])
      .map(k => `${k}=${params[k]}`)
      .join('&');

    const secureHash = crypto
      .createHmac('sha256', vnp_HashSecret)
      .update(signData)
      .digest('hex');

    return secureHash === vnp_SecureHash;
  }
}
