// Seed: tạo tài khoản ADMIN + dữ liệu demo cho BookStay
// Chạy: npm run db:seed
// Tài khoản admin có thể override bằng env: ADMIN_EMAIL, ADMIN_PASSWORD

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bookstay.vn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // ===== 1. ADMIN =====
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN' },
    create: {
      email: ADMIN_EMAIL,
      name: 'BookStay Admin',
      phone: '0900000000',
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  // ===== 2. GUEST demo =====
  const guest = await prisma.user.upsert({
    where: { email: 'guest@bookstay.vn' },
    update: {},
    create: {
      email: 'guest@bookstay.vn',
      name: 'Nguyễn Khách Du Lịch',
      phone: '0987654321',
      passwordHash: await bcrypt.hash('Guest@123456', 10),
      role: 'GUEST',
    },
  });
  console.log('✅ Guest demo: guest@bookstay.vn / Guest@123456');

  // ===== 3. HOST demo (đã duyệt) =====
  const hostUser = await prisma.user.upsert({
    where: { email: 'host@bookstay.vn' },
    update: {},
    create: {
      email: 'host@bookstay.vn',
      name: 'Trần Chủ Nhà',
      phone: '0912345678',
      passwordHash: await bcrypt.hash('Host@123456', 10),
      role: 'HOST',
    },
  });

  const host = await prisma.hostProfile.upsert({
    where: { userId: hostUser.id },
    update: {},
    create: {
      userId: hostUser.id,
      businessName: 'Hoàn Kiếm Homestay Group',
      bankName: 'Vietcombank',
      bankAccountName: 'TRAN CHU NHA',
      bankAccountNumber: '0123456789',
      status: 'APPROVED',
    },
  });
  console.log('✅ Host demo: host@bookstay.vn / Host@123456');

  // ===== 4. LISTINGS demo =====
  const listings = [
    {
      key: 'old-quarter-loft',
      data: {
        title: 'Loft view Hồ Gươm giữa Phố Cổ',
        description:
          'Loft studio thiết kế hiện đại ngay trung tâm Phố Cổ, cách Hồ Gươm 3 phút đi bộ. Ban công view tháp Rùa, đầy đủ bếp, máy lạnh, máy giặt. Phù hợp cặp đôi hoặc khách công tác.',
        address: 'Hàng Bài, Hoàn Kiếm, Hà Nội',
        latitude: 21.0285,
        longitude: 105.8524,
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        area: 45,
        basePrice: 850000,
        weekendPrice: 1050000,
        cleaningFee: 100000,
        amenities: ['WiFi', 'Điều hòa', 'Bếp', 'Máy giặt', 'TV', 'Thang máy'],
      },
    },
    {
      key: 'west-lake-villa',
      data: {
        title: 'Villa Hồ Tây sân vườn private',
        description:
          'Biệt thự 3 phòng ngủ sát Hồ Tây, sân vườn 200m², hồ bơi trẻ em, BBQ ngoài trời. Ideal cho nhóm bạn hoặc gia đình nhiều thế hệ.',
        address: 'Xuân La, Tây Hồ, Hà Nội',
        latitude: 21.0669,
        longitude: 105.8214,
        maxGuests: 8,
        bedrooms: 3,
        bathrooms: 3,
        area: 250,
        basePrice: 2500000,
        weekendPrice: 3200000,
        cleaningFee: 300000,
        amenities: ['WiFi', 'Điều hòa', 'Bếp', 'Chỗ đậu xe', 'Hồ bơi', 'BBQ', 'Sân vườn'],
      },
    },
    {
      key: 'ba-dinh-apartment',
      data: {
        title: 'Căn hộ 2PN gần Ba Đình',
        description:
          'Căn hộ 2 phòng ngủ tòa nhà mới, nội thất đầy đủ, an ninh 24/7, gần ga metro, Lotte Center. Giá tốt cho thuê dài hạn.',
        address: 'Liễu Giai, Ba Đình, Hà Nội',
        latitude: 21.0333,
        longitude: 105.8156,
        maxGuests: 5,
        bedrooms: 2,
        bathrooms: 2,
        area: 80,
        basePrice: 1200000,
        weekendPrice: 1400000,
        cleaningFee: 150000,
        amenities: ['WiFi', 'Điều hòa', 'Bếp', 'Thang máy', 'Gym', 'Chỗ đậu xe'],
      },
    },
    {
      key: 'hoan-kiem-boutique',
      data: {
        title: 'Phòng boutique phong cách Indochine',
        description:
          'Phong cách Đông Dương hoài cổ, gỗ tự nhiên, sát Hồ Gươm. Bao sáng, trà chiều miễn phí. Được nhiều khách quốc tế 5 sao.',
        address: 'Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
        latitude: 21.0278,
        longitude: 105.8485,
        maxGuests: 3,
        bedrooms: 1,
        bathrooms: 1,
        area: 35,
        basePrice: 700000,
        weekendPrice: 900000,
        cleaningFee: 80000,
        amenities: ['WiFi', 'Điều hòa', 'Bao sáng', 'TV', 'Máy sấy tóc'],
      },
    },
    {
      key: 'long-bien-garden',
      data: {
        title: 'Nhà vườn đồng quê Long Biên',
        description:
          'Nhà vườn mát mẻ ven sông Hồng, không gian yên tĩnh, trái cây theo mùa. Khách thành phố tránh ồn ào cuối tuần.',
        address: 'Ngọc Thụy, Long Biên, Hà Nội',
        latitude: 21.0600,
        longitude: 105.8900,
        maxGuests: 6,
        bedrooms: 2,
        bathrooms: 2,
        area: 120,
        basePrice: 950000,
        weekendPrice: 1200000,
        cleaningFee: 120000,
        amenities: ['WiFi', 'Điều hòa', 'Sân vườn', 'BBQ', 'Xe đạp miễn phí'],
      },
    },
    {
      key: 'cau-giay-studio',
      data: {
        title: 'Studio tối giản Keangnam',
        description:
          'Studio mới toanh tòa nhà The Manor/Keangnam khu vực Mỹ Đình, gần sân vận động, siêu thị, cafe. Check-in tự động 24/7.',
        address: 'Mễ Trì, Nam Từ Liêm, Hà Nội',
        latitude: 21.0178,
        longitude: 105.7810,
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        area: 32,
        basePrice: 600000,
        weekendPrice: 750000,
        cleaningFee: 60000,
        amenities: ['WiFi', 'Điều hòa', 'Bếp', 'Check-in tự động', 'Thang máy'],
      },
    },
  ];

  for (const item of listings) {
    const existing = await prisma.listing.findFirst({
      where: { title: item.data.title },
    });

    if (existing) {
      console.log(`⏭️  Listing đã tồn tại: ${item.data.title}`);
      continue;
    }

    const created = await prisma.listing.create({
      data: {
        ...item.data,
        hostId: host.id,
        status: 'PUBLISHED',
      },
    });
    console.log(`✅ Listing: ${created.title}`);
  }

  const listingCount = await prisma.listing.count();
  await prisma.hostProfile.update({
    where: { id: host.id },
    data: { listingCount },
  });

  console.log(`\n🎉 Seed hoàn tất: ${listingCount} listings, admin=${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
