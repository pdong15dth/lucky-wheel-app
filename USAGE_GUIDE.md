# 📖 Hướng Dẫn Sử Dụng Lucky Wheel

Tài liệu hướng dẫn nhân viên sử dụng ứng dụng Vòng Quay May Mắn của Tora Tech.

---

## 📑 Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Các Trang Trong Ứng Dụng](#2-các-trang-trong-ứng-dụng)
3. [Hướng Dẫn Cho Người Tham Gia](#3-hướng-dẫn-cho-người-tham-gia)
4. [Hướng Dẫn Cho Quản Trị Viên](#4-hướng-dẫn-cho-quản-trị-viên)
5. [Hướng Dẫn Trình Chiếu (Guest)](#5-hướng-dẫn-trình-chiếu-guest)
6. [Câu Hỏi Thường Gặp](#6-câu-hỏi-thường-gặp)

---

## 1. Tổng Quan

Lucky Wheel là ứng dụng vòng quay may mắn với các tính năng:

| Tính Năng | Mô Tả |
|-----------|-------|
| ⚡ **Real-time** | Đồng bộ hóa tức thì giữa các màn hình |
| 🎯 **3 Giải Thưởng** | Quay 3 vòng để chọn 3 người may mắn |
| 📱 **Điểm Danh Dễ Dàng** | Nhân viên tự điểm danh qua điện thoại |
| 🎡 **Công Bằng** | Thuật toán random đảm bảo mọi người có cơ hội bằng nhau |

---

## 2. Các Trang Trong Ứng Dụng

| Đường Dẫn | Trang | Dành Cho |
|-----------|-------|----------|
| `/` | Trang Chủ | Tất cả |
| `/checkin` | Điểm Danh | Người tham gia |
| `/admin` | Quản Trị | Admin (BTC) |
| `/guest` | Trình Chiếu | Màn hình lớn |

---

## 3. Hướng Dẫn Cho Người Tham Gia

### Bước 1: Truy Cập Trang Điểm Danh

- Quét **mã QR** hoặc truy cập link: `[domain]/checkin`
- Bạn sẽ thấy form điểm danh

### Bước 2: Nhập Tên

1. Nhập **họ tên đầy đủ** của bạn
2. Nhấn nút **"Điểm Danh"**
3. Chờ xác nhận thành công

### Bước 3: Xác Nhận

- Sau khi điểm danh thành công, bạn sẽ thấy thông báo xác nhận
- Tên của bạn sẽ xuất hiện trên vòng quay
- **Lưu ý**: Nếu tên bị trùng, hệ thống sẽ tự tạo biệt danh (VD: `DongPH1`)

### ⚠️ Lưu Ý Quan Trọng

- Mỗi thiết bị chỉ điểm danh được **1 lần**
- Không đóng trang điểm danh để cập nhật thông tin nếu cần
- Khi BTC **khóa điểm danh**, bạn sẽ không thể đăng ký thêm

---

## 4. Hướng Dẫn Cho Quản Trị Viên (Admin)

### Truy Cập Trang Admin

1. Vào trang chủ `/`
2. Nhấn **"Trang Quản Trị"**
3. Nhập mật khẩu: `2025`
4. Nhấn **"Đăng nhập"**

### Giao Diện Admin

```
┌─────────────────────────────────────────────────┐
│                  LUCKY WHEEL                    │
│                                                 │
│   ┌─────────────────┐   ┌──────────────────┐   │
│   │                 │   │ Danh sách người  │   │
│   │   VÒNG QUAY     │   │ tham gia         │   │
│   │                 │   │ - Nguyen Van A   │   │
│   │                 │   │ - Tran Thi B     │   │
│   └─────────────────┘   │ - Le Van C       │   │
│                         └──────────────────┘   │
│                                                 │
│  [🎰 QUAY] [🔒 Khóa] [🔄 Reset] [🗑️ Xóa Hết]  │
│                                                 │
│  Người thắng cuộc:                              │
│  🥇 Giải 1:                                     │
│  🥈 Giải 2:                                     │
│  🥉 Giải 3:                                     │
└─────────────────────────────────────────────────┘
```

### Các Chức Năng

| Nút | Chức Năng |
|-----|-----------|
| ➕ **Thêm người tham gia** | Thêm người thủ công (khi user không tự đăng ký được) |
| 🎰 **QUAY** | Bắt đầu quay vòng may mắn |
| 🔒 **Khóa/Mở Khóa** | Khóa hoặc mở khóa điểm danh |
| 🔄 **Reset Game** | Reset trạng thái game (giữ người tham gia) |
| 🗑️ **Xóa Hết** | Xóa tất cả người tham gia |

### Thêm Người Tham Gia Thủ Công

Trong trường hợp người dùng không thể tự điểm danh (lỗi mạng, điện thoại hư, v.v.), Admin có thể thêm họ vào danh sách:

1. Ở panel bên phải, tìm ô **"➕ Thêm người tham gia"**
2. Nhập **họ tên đầy đủ** của người cần thêm
3. Nhấn nút **"Thêm"**
4. Hệ thống sẽ tự tạo biệt danh nếu tên bị trùng

> ⚠️ **Lưu ý**: Không thể thêm người mới khi đã **khóa Check-in**. Cần mở khóa trước.

### Quy Trình Quay Số

> ⚠️ **BẮT BUỘC**: Phải **khóa điểm danh** trước khi quay! Nút QUAY sẽ bị vô hiệu hóa nếu chưa khóa.

1. **Trước khi quay**: Đảm bảo đủ người tham gia
2. **Khóa điểm danh**: Nhấn nút 🔒 để ngăn người mới tham gia *(bước bắt buộc)*
3. **Quay Giải 1**: Nhấn 🎰 QUAY → Đếm ngược 3-2-1 → Vòng quay chạy
4. **Công bố Giải 1**: Màn hình hiển thị người thắng
5. **Quay Giải 2, 3**: Lặp lại (người thắng trước sẽ bị loại khỏi vòng quay)

### Đồng Bộ Hóa

- Vòng quay ở trang **Admin** và **Guest** quay **đồng thời**
- Kết quả hiển thị **giống nhau** trên cả 2 màn hình
- Đảm bảo tính **minh bạch** và **công bằng**

---

## 5. Hướng Dẫn Trình Chiếu (Guest)

### Mục Đích

Trang Guest dùng để **trình chiếu lên màn hình lớn** cho mọi người xem.

### Truy Cập

- Vào link: `[domain]/guest`
- **Không cần mật khẩu**

### Tính Năng

- Hiển thị vòng quay với tên tất cả người tham gia
- **Tự động đồng bộ** khi Admin quay
- Hiển thị **đếm ngược** trước khi quay
- Hiển thị **người thắng** với hiệu ứng đẹp mắt
- Cập nhật **real-time** khi có người mới điểm danh

### Thiết Lập Trình Chiếu

1. Kết nối laptop/máy tính với màn hình lớn/projector
2. Mở trình duyệt → Truy cập `/guest`
3. Nhấn **F11** để vào chế độ toàn màn hình
4. Để nguyên màn hình, Admin sẽ điều khiển từ thiết bị khác

---

## 6. Câu Hỏi Thường Gặp

### ❓ Tôi đã điểm danh nhưng không thấy tên trên vòng quay?

- Kiểm tra lại trang điểm danh xem có thông báo thành công không
- Nếu BTC đã **khóa điểm danh**, bạn không thể tham gia
- Liên hệ BTC để được hỗ trợ

### ❓ Tên tôi bị thêm số đằng sau (VD: DongPH1)?

- Điều này xảy ra khi có người trùng tên
- Hệ thống tự tạo **biệt danh** để phân biệt
- Đây là tên hiển thị trên vòng quay, không ảnh hưởng đến việc trúng thưởng

### ❓ Tôi muốn đổi tên đã đăng ký?

- Quay lại trang điểm danh `/checkin`
- Nếu đã đăng ký, bạn sẽ thấy tùy chọn **cập nhật tên**

### ❓ Kết quả quay có công bằng không?

- **Có!** Thuật toán sử dụng `Math.random()` đảm bảo mỗi người có xác suất bằng nhau
- Admin và Guest thấy **cùng một kết quả** (đồng bộ hóa)
- Xem thêm chi tiết trong file [README.md](./README.md)

### ❓ Tại sao phải khóa điểm danh trước khi quay?

- Để đảm bảo **danh sách cố định** khi quay
- Tránh việc có người nhảy vào giữa chừng
- Đảm bảo **tính công bằng**

---

## 📞 Liên Hệ Hỗ Trợ

Nếu gặp vấn đề kỹ thuật, vui lòng liên hệ bộ phận IT của Tora Tech.

---

*© 2026 Tora Tech. All rights reserved.*
