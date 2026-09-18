# BUSINESS BRIEF — BookStay

**Ngày**: 2025-01-09
**Platform**: Web + Mobile (cross-platform)
**Market**: Việt Nam
**Version**: v1.0

---

## 1. VISION

Hệ thống **marketplace đa chủ** kết nối chủ homestay và khách thuê tại **Hà Nội**, hỗ trợ đặt phòng trực tuyến, thanh toán qua VNPay, quản lý lịch trống, đánh giá, chat và thống kê doanh thu.

**Tagline**: "BookStay — Homestay Hà Nội, dễ đặt, an tâm ở."

---

## 2. STAKEHOLDERS

| Vai trò | Mô tả |
|---------|-------|
| **Guest** | Khách thuê homestay — tìm kiếm, đặt phòng, thanh toán, chat chủ, review |
| **Host** | Chủ homestay — đăng listing, quản lý phòng/lịch, nhận booking, xem thống kê |
| **Admin** | Quản trị viên — duyệt listing, xử lý khiếu nại, xem báo cáo hệ thống |

---

## 3. CORE FEATURES (Must-have)

### Guest (Khách thuê)
- [ ] Đăng ký / đăng nhập (email, phone, JWT)
- [ ] Tìm kiếm & lọc homestay (địa điểm, ngày, số khách, giá, tiện nghi)
- [ ] Xem chi tiết homestay (hình ảnh, mô tả, tiện nghi, map, lịch trống)
- [ ] Đặt phòng với lịch cụ thể
- [ ] Thanh toán trực tuyến qua **VNPay**
- [ ] Chat với host trước/sau khi đặt
- [ ] Review & rating sau khi checkout
- [ ] Xem lịch sử booking, trạng thái đơn

### Host (Chủ homestay)
- [ ] Đăng ký / đăng nhập host (onboarding qua Admin duyệt)
- [ ] Tạo & quản lý listing homestay (hình ảnh, mô tả, giá, tiện nghi)
- [ ] Calendar quản lý phòng (tránh overbooking)
- [ ] Xem & quản lý booking requests
- [ ] Nhận thanh toán qua VNPay (settlement)
- [ ] Chat với khách
- [ ] Dashboard thống kê (doanh thu, tỷ lệ lấp đầy, review)
- [ ] Pricing động (theo mùa, cuối tuần)

### Admin
- [ ] Duyệt/từ chối listing mới (manual review)
- [ ] Quản lý user (guest & host)
- [ ] Xử lý khiếu nại/refund
- [ ] Báo cáo tổng hợp hệ thống

---

## 4. REVENUE MODEL

- **Hoa hồng 15%** trên mỗi booking thành công (platform thu từ host)
- Settlement: VNPay chuyển tiền cho host sau khi trừ hoa hồng

---

## 5. CANCELATION POLICY

**Linh hoạt**:
- Hủy **≥ 7 ngày** trước check-in → **Hoàn tiền 100%**
- Hủy **3–7 ngày** trước check-in → **Hoàn tiền 50%**
- Hủy **< 3 ngày** trước check-in → **Không hoàn tiền**

---

## 6. INTEGRATIONS

| Integration | Provider | Mục đích |
|------------|----------|----------|
| Payment | **VNPay** | Thanh toán trực tuyến, QR, ví điện tử |
| Maps | Google Maps / Mapbox | Hiển thị vị trí homestay |
| Image Storage | Cloudinary / S3 | Lưu hình ảnh homestay |
| Notification | FCM / OneSignal | Push notification mobile |
| Auth | JWT + Refresh Token | Xác thực |

---

## 7. USER JOURNEY (High-level)

### Guest Flow
```
Register/Login
  → Search (location: Hà Nội, date, guest count)
  → Filter (price, amenities, rating)
  → View Listing (photos, desc, map, calendar)
  → Check Availability
  → Book (select dates, guest info)
  → Pay via VNPay
  → Confirmation
  → (Optional) Chat Host
  → Stay
  → Review & Rating
```

### Host Flow
```
Register/Login
  → Submit Host Application (Admin review)
  → Create Listing (photos, desc, pricing, amenities)
  → Manage Calendar (block/unblock dates)
  → Receive Booking Request
  → Confirm / Decline
  → Host Guest
  → Get Paid (VNPay settlement after 15% deduction)
  → View Stats Dashboard
```

---

## 8. SCALE TARGET

- **20–200 homestay** tại **Hà Nội** trong 12 tháng đầu
- Cần search/filter tốt, pagination, rate limit từ đầu
- Database: relational (PostgreSQL) cho consistency của booking

---

## 9. OUT OF SCOPE (v1)

- OTA sync (Booking.com, Airbnb)
- Dynamic pricing engine phức tạp
- Multiple currency
- iOS native app (Android + Web trước)

---

## 10. 🚩 OPEN FLAGS

- [x] Mô hình: Marketplace đa chủ
- [x] Revenue: Hoa hồng 15%
- [x] Cancelation: Linh hoạt (7/3 ngày)
- [x] Launch market: Hà Nội
- [x] Payment: VNPay
- [ ] Telegram bot token (cần cấu hình)
- [ ] Chat ID Telegram để nhận ping

---

*Document này là document gốc ngày 0. Khóa scope, không bịa thêm feature.*
