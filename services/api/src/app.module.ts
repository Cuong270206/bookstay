import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { ImagesModule } from './modules/images/images.module';
import { HostModule } from './modules/host/host.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ChatModule } from './modules/chat/chat.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limit toàn cục: mặc định 100 request/phút/IP (THROTTLER_TTL, THROTTLER_LIMIT)
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLER_TTL || 60) * 1000,
        limit: Number(process.env.THROTTER_LIMIT || 100),
      },
    ]),
    PrismaModule,
    CloudinaryModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    ImagesModule,
    HostModule,
    BookingsModule,
    PaymentsModule,
    CalendarModule,
    ChatModule,
    ReviewsModule,
    AdminModule,
  ],
  providers: [
    // Áp dụng rate limit cho mọi route; route cụ thể có thể override bằng @SkipThrottle/@Throttle
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
