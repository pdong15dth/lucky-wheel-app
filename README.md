# 🎰 Lucky Wheel App

Ứng dụng vòng quay may mắn với giao diện Cyberpunk, đồng bộ realtime giữa Admin và Guest.

## ✨ Tính Năng

- 🎡 Vòng quay với hiệu ứng Cyberpunk
- 👥 Quản lý người tham gia
- 🔄 Đồng bộ realtime (Supabase)
- 📱 Responsive design

## 🚀 Cài Đặt

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## 📂 Cấu Trúc

| Đường dẫn | Mô tả |
|-----------|-------|
| `/admin` | Trang quản trị - quay số |
| `/guest` | Trang xem - người tham gia |

---

## 🎲 Thuật Toán Random - Tính Minh Bạch & Công Bằng

### Tổng Quan

Lucky Wheel sử dụng thuật toán random dựa trên JavaScript `Math.random()` để đảm bảo mỗi người tham gia đều có **cơ hội bằng nhau** để chiến thắng.

| Thông số | Giá trị |
|----------|---------|
| Phương pháp random | `Math.random()` (PRNG) |
| Phân phối xác suất | **Đồng đều (Uniform Distribution)** |
| Xác suất mỗi người | `1/n` (n = số người tham gia) |

### Công Thức Tính Toán

**1. Góc mỗi phân đoạn:**
```
segmentAngle = (2 × π) / n
```

**2. Chọn người thắng:**
```javascript
winnerIndex = Math.floor(Math.random() * n)  // Random từ 0 đến n-1
```

**3. Tính góc quay tổng:**
```javascript
fullRotations = 5 + Math.random() * 5  // 5-10 vòng quay
targetRotation = fullRotations × 2π + winnerIndex × segmentAngle
```

### Bảng Xác Suất

| Số người | Xác suất mỗi người |
|----------|-------------------|
| 4 | 25.00% |
| 6 | 16.67% |
| 8 | 12.50% |
| 10 | 10.00% |
| 12 | 8.33% |
| 20 | 5.00% |

### ✅ Cam Kết Công Bằng

1. **Không thiên vị** - Thuật toán không ưu tiên bất kỳ vị trí nào
2. **Phân phối đều** - Mỗi người có xác suất chiến thắng bằng nhau
3. **Đồng bộ hóa** - Admin và Guest thấy cùng một kết quả quay
4. **Không can thiệp** - Kết quả được xác định ngẫu nhiên

### Mã Nguồn

```typescript
// components/LuckyWheel.tsx
export function generateTargetRotation(participantsCount: number) {
    const segmentAngle = (2 * Math.PI) / participantsCount;
    const fullRotations = 5 + Math.random() * 5;
    const winnerIndex = Math.floor(Math.random() * participantsCount);
    const targetRotation = fullRotations * 2 * Math.PI + winnerIndex * segmentAngle;
    return { targetRotation, winnerIndex };
}
```

> ⚠️ **Lưu ý:** `Math.random()` sử dụng PRNG, phù hợp cho mini-game giải trí. Không nên dùng cho mục đích cờ bạc hoặc tài chính.
