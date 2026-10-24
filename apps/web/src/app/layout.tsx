import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'BookStay - Homestay Hà Nội, dễ đặt, an tâm ở',
    template: '%s | BookStay',
  },
  description:
    'Đặt phòng homestay tại Hà Nội dễ dàng: tìm kiếm theo địa điểm, ngày, số khách; thanh toán VNPay an toàn; chat trực tiếp với chủ nhà.',
  keywords: ['homestay', 'đặt phòng', 'Hà Nội', 'BookStay', 'phòng nghỉ', 'căn hộ'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'BookStay',
    title: 'BookStay - Homestay Hà Nội, dễ đặt, an tâm ở',
    description: 'Marketplace đặt homestay tại Hà Nội với thanh toán VNPay an toàn.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
