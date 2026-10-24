import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

export interface VNPayVerificationResult {
  success: boolean;
  bookingId?: string;
  status?: 'CONFIRMED' | 'FAILED';
  responseCode: string; // VNPay IPN response code
  message: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ===== Create VNPay Payment URL =====
  async createPaymentUrl(bookingId: string, userId: string, clientIp?: string) {
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

    const vnp_TmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    const vnp_HashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');
    if (!vnp_TmnCode || !vnp_HashSecret) {
      this.logger.error('VNPay is not configured (VNPAY_TMN_CODE / VNPAY_HASH_SECRET missing)');
      throw new BadRequestException('Cổng thanh toán chưa được cấu hình');
    }

    const vnp_Url =
      this.configService.get<string>('VNPAY_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnp_ReturnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL') ||
      'http://localhost:3001/api/v1/payments/vnpay-return';

    const vnp_TxnRef = booking.id; // Booking ID as transaction ref
    const vnp_Amount = Number(booking.totalAmount) * 100; // VNPay nhận amount x100
    const vnp_OrderInfo = `Thanh toan BookStay - ${booking.id}`;
    const vnp_IpAddr = this.normalizeIp(clientIp);
    const vnp_CreateDate = this.formatVnpayDate(new Date());

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
      vnp_ReturnUrl,
    };
    if (payment.lockExpiresAt) {
      params['vnp_ExpireDate'] = this.formatVnpayDate(payment.lockExpiresAt);
    }

    const signData = this.buildSignData(params);
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

  // ===== VNPay Return / IPN: verify & apply payment result =====
  async handleVNPayReturn(query: Record<string, string>): Promise<VNPayVerificationResult> {
    const vnp_ResponseCode = query['vnp_ResponseCode'];
    const vnp_TxnRef = query['vnp_TxnRef']; // Booking ID
    const vnp_TransactionNo = query['vnp_TransactionNo'];
    const vnp_BankCode = query['vnp_BankCode'];
    const vnp_PayDate = query['vnp_PayDate'];
    const vnp_Amount = query['vnp_Amount'];

    // 1. Verify checksum
    if (!this.verifyChecksum(query)) {
      this.logger.warn(`VNPay checksum mismatch for TxnRef=${vnp_TxnRef}`);
      return { success: false, responseCode: '97', message: 'Invalid checksum' };
    }

    // 2. Find booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: vnp_TxnRef },
      include: { payment: true },
    });

    if (!booking || !booking.payment) {
      this.logger.warn(`VNPay callback for unknown booking=${vnp_TxnRef}`);
      return { success: false, responseCode: '01', message: 'Booking not found' };
    }

    // 3. Verify amount matches booking total (anti-tampering)
    const expectedAmount = Number(booking.totalAmount) * 100;
    if (Number(vnp_Amount) !== expectedAmount) {
      this.logger.error(
        `VNPay amount mismatch for booking=${vnp_TxnRef}: got ${vnp_Amount}, expected ${expectedAmount}`,
      );
      return { success: false, bookingId: booking.id, responseCode: '04', message: 'Invalid amount' };
    }

    const isSuccess = vnp_ResponseCode === '00';
    const paymentData: any = {
      vnpTransactionId: vnp_TransactionNo || null,
      vnpBankCode: vnp_BankCode || null,
      vnpPayDate: this.parseVnpayDate(vnp_PayDate),
      vnpResponseCode: vnp_ResponseCode,
    };

    // 4. Apply result atomically; skip if booking already settled (idempotent IPN)
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({
        where: { id: booking.id },
        select: { status: true },
      });
      if (!current || current.status !== 'PENDING_PAYMENT') {
        return; // already processed by an earlier callback
      }

      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: { ...paymentData, status: isSuccess ? 'SUCCESS' : 'FAILED' },
      });

      if (isSuccess) {
        // Booking giữ PENDING_PAYMENT khi thanh toán thất bại để khách thử lại
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'CONFIRMED' },
        });
      }
    });

    return isSuccess
      ? { success: true, bookingId: booking.id, status: 'CONFIRMED', responseCode: '00', message: 'Confirmed' }
      : { success: false, bookingId: booking.id, status: 'FAILED', responseCode: vnp_ResponseCode, message: 'Payment failed' };
  }

  // ===== Get Payment Status (for polling) =====
  async getPaymentStatus(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { include: { host: true } }, payment: true },
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

  // ===== Signing helpers (VNPay spec: sorted a-z, exclude vnp_SecureHash*, RFC3986-encode values) =====
  private buildSignData(params: Record<string, string>): string {
    return Object.keys(params)
      .filter((k) => params[k] !== '' && params[k] !== undefined && params[k] !== null)
      .sort()
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');
  }

  private verifyChecksum(query: Record<string, string>): boolean {
    const vnp_SecureHash = query['vnp_SecureHash'];
    const vnp_HashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');
    if (!vnp_SecureHash || !vnp_HashSecret) {
      return false;
    }

    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
        params[key] = value;
      }
    }

    const signData = this.buildSignData(params);
    const secureHash = crypto
      .createHmac('sha256', vnp_HashSecret)
      .update(signData)
      .digest('hex');

    return secureHash.toLowerCase() === vnp_SecureHash.toLowerCase();
  }

  // ===== VNPay date format yyyyMMddHHmmss in Vietnam time (UTC+7) =====
  private formatVnpayDate(date: Date): string {
    const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return vn.toISOString().replace(/[-:T]/g, '').split('.')[0];
  }

  // Parse VNPay yyyyMMddHHmmss (UTC+7) → Date
  private parseVnpayDate(str?: string): Date | null {
    if (!str || !/^\d{14}$/.test(str)) return null;
    const utc = Date.UTC(
      +str.slice(0, 4),
      +str.slice(4, 6) - 1,
      +str.slice(6, 8),
      +str.slice(8, 10),
      +str.slice(10, 12),
      +str.slice(12, 14),
    );
    return new Date(utc - 7 * 60 * 60 * 1000);
  }

  private normalizeIp(ip?: string): string {
    if (!ip) return '127.0.0.1';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
    // Take first IP from x-forwarded-for chains
    return ip.split(',')[0].trim() || '127.0.0.1';
  }
}
