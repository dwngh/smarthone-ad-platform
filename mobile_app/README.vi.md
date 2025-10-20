# Ứng dụng di động Smart Home Gateway 🏠

Một ứng dụng mẫu cho nhà thông minh xây dựng bằng React Native, Expo Router và Firebase Cloud Messaging (FCM). Ứng dụng hiển thị dữ liệu cảm biến theo thời gian thực qua MQTT và nhận thông báo đẩy.

## Tính năng

- Giao diện tối, tối giản
- Thông báo thời gian thực qua FCM (foreground/background/killed)
- Bảng điều khiển cảm biến (nhiệt độ, độ ẩm, ánh sáng) qua MQTT
- Hệ thống cảnh báo (alerts)

## Yêu cầu trước

- Node.js 18+ và npm
- Android Studio + Android SDK
- Thiết bị Android hoặc trình giả lập
- Dự án Firebase với Cloud Messaging bật

## Cài đặt

1. Cài phụ thuộc

```bash
npm install
```

2. Các package Firebase đã có trong `package.json`, nhưng nếu cần cài lại:

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

## Cấu hình Firebase (Android)

1. Tạo dự án trong Firebase Console và bật Cloud Messaging.
2. Thêm Android app với package name `com.iotlab.homegateway`.
3. Tải `google-services.json` và sao chép vào `android/app/google-services.json`.
4. Project đã có cấu hình Gradle cần thiết (plugin `com.google.gms:google-services`).

## Chạy ứng dụng (Android)

Sử dụng lệnh:

```bash
npm run android
```

Lưu ý: dùng `npm run android` để build và cài app native (không dùng `npm start`).

## Kiểm thử FCM

1. Mở app trên thiết bị Android → tab Alerts → nhấn "FCM Token" để lấy token.
2. Vào Firebase Console → Cloud Messaging → gửi tin thử cho token đó.
3. Kiểm tra trạng thái app: Foreground / Background / Killed.

## Các giá trị demo (hardcoded) — Nên biết chỗ thay đổi

Ứng dụng này có một vài giá trị demo hardcoded để dễ chạy. Nếu muốn thay đổi:

1) `components/control-card.tsx`
   - Mảng thiết bị cảm biến khởi tạo trong `MainControlSection`.
   - Thay `device_id`, `name`, `icon`, `unit`, `iconBackgroundColor`, `iconColor`, và `data` (timestamp, id, value).

2) `services/mqttService.ts`
   - Thay cấu hình broker: `brokerHost` (mặc định `broker.hivemq.com`), `brokerPort` (mặc định `8000`), `salt`/`clientId`.
   - Topic mặc định trong `subscribeToDevices()` hiện là `/home_1/devices` — thay thành topic của bạn.

3) `components/fcm-test-panel.tsx`
   - Thay tên topic ví dụ (`'test_topic'`) nếu bạn dùng topic-based FCM.

4) `services/fcmService.ts`
   - Cập nhật các ví dụ `subscribeToTopic(...)` và hàm điều hướng (`navigateToScreen`, `navigateToDevice`) để phù hợp router của bạn.

5) `android/app/google-services.json`
   - Thay bằng file `google-services.json` từ dự án Firebase của bạn (phù hợp `applicationId`).

## Mẹo

- Dùng `broker.hivemq.com` và topic `/home_1/devices` để thử nhanh. Cho môi trường production, chạy broker riêng.
- Để clientId cố định, truyền `clientId` vào `MQTTService` thay vì dùng `salt` mặc định.
- Giữ định dạng payload MQTT/FCM nhất quán giữa backend/device và app.

---

Nếu bạn muốn, tôi có thể chèn ghi chú (TODO) trực tiếp vào các file nguồn để dễ tìm chỗ chỉnh sửa hơn.