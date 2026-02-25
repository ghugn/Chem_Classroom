# Hệ Thống Quản Lý Lớp Hóa - Best Practices Production (Quy mô nhỏ <= 200 Học Sinh)

Vì quy mô nhỏ (dưới 200 học sinh), kiến trúc **Monolith** (nguyên khối) kết hợp với Cơ Sở Dữ Liệu Quan Hệ (PostgreSQL) là quá đủ, dễ bảo trì, ít tốn chi phí và không cần các hệ thống phức tạp như Microservices, Redis hay Kafka. Dưới đây là các phương pháp tối ưu và "best practices" triển khai trên Production.

## 1. Database (PostgreSQL)
- **Indexing (Đã áp dụng)**: Chúng ta đã tạo Index trên các cột thường xuyên được truy vấn bằng từ khóa `WHERE` hoặc `JOIN` như: `role` (bảng `users`), `class_id` (bảng `groups`, `materials`), `group_id` (bảng `student_groups`, `materials`), và `created_at`. Điều này giúp tốc độ đọc gần như tức thời với 200 học sinh.
- **Connection Pooling**: Module `pg` (node-postgres) ngầm định sử dụng Connection Pool. Trên Production, bạn nên truyền tham số `max` vào Pool config (ví dụ: `max: 20`) để giới hạn số kết nối đồng thời tránh làm nghẽn Database.

## 2. Backend (Node.js & Express)
- **Pagination (Đã áp dụng)**: API lấy danh sách học sinh (`GET /api/students`) đã được thêm Pagination (Phân trang) sử dụng mệnh đề `LIMIT` và `OFFSET`. Điều này giúp Payload JSON trả về nhỏ gọn, tiết kiệm băng thông mạng và RAM cho Mobile/Web Client.
- **Bảo mật (Security)**:
  - Dùng `helmet` (giấu các HTTP headers nhạy cảm) và `compression` (nén gzip response) bằng `npm install helmet compression`.
  - Luôn sử dụng biến môi trường (Environment Variables `.env`) và không bao giờ commit JWT_SECRET hay DATABASE_URL lên GitHub.
- **Stateless Authentication (Đã áp dụng)**: Sử dụng JWT giúp Backend hoàn toàn Stateless. API không cần lưu trạng thái đăng nhập, qua đó ta không cần thiết lập Session trên In-memory cache như Redis.

## 3. Quản Lý File (Tài Liệu)
- Hiện tại hệ thống lưu file bằng `multer` xuống thư mục `backend/uploads`. Với quy mô 200 học sinh, số lượng file có thể từ vài chục đến vài trăm MB mỗi tuần.
- **Khuyến cáo Storage**: 
  - Nếu bạn thuê VPS/Server có dung lượng thấp: Hãy cân nhắc tích hợp **AWS S3** hoặc **Cloudinary / Firebase Storage** (miễn phí) để lưu tài liệu giảm tải cho ổ cứng của server chạy code. 
  - Nếu ổ cứng VPS lớn (như 30GB+), thiết lập Cronjob backup thư mục `uploads` hàng tuần là đủ.

## 4. Frontend (React + Vite)
- Chạy lệnh `npm run build` để sinh ra thư mục `dist` tĩnh, thay vì dùng `npm run dev`.
- Render thư mục `dist` bằng Server tĩnh như Nginx. Nginx rất nhẹ, mạnh mẽ, gánh được tải lớn hơn nhiều so với việc dùng Node.js phục vụ các file tĩnh `.html, .js, .css`.

## 5. Deployment / Server Mẫu Đề Xuất
Bạn có thể thuê chung 1 máy chủ ảo (VPS) rẻ tiền (~ 5-10$/tháng) và cấu hình lại.
1. CPU: 1-2 Cores
2. RAM: 1-2 GB
3. Cài OS **Ubuntu 22.04 LTS**.
4. Quản lý ứng dụng bằng `PM2`: `pm2 start server.js --name "chem-class"`. Nó tự động khởi động lại App nếu gặp sự cố crash hoặc khi VPS reboot.
5. Cài đặt chứng chỉ **SSL Let's Encrypt (HTTPS miễn phí)** thông qua Nginx Reverse Proxy để bảo mật dữ liệu đăng nhập và JWT Token của các em học sinh.
