# Bản Google Apps Script — Scientist Profile

Thư mục này là bản chuyển đổi từ website GitHub Pages sang **Google Apps Script Web App**.

## Các file cần tạo trong Apps Script

Tạo một Apps Script project và tạo đúng các file sau:

- `Code.gs`
- `Index.html`
- `Login.html`
- `Styles.html`
- `Script.html`

Sau đó bật hiển thị manifest và chép nội dung của `appsscript.json`.

> File `Styles.html` đã gói toàn bộ CSS của website.  
> File `Script.html` đã gói JavaScript phía trình duyệt.  
> Logo UTE đã được nhúng trực tiếp vào CSS nên không cần upload file ảnh riêng.

## Cách tạo Apps Script project

1. Truy cập https://script.google.com/
2. Chọn **New project**.
3. Đổi tên project, ví dụ: `Scientist Profile`.
4. Xóa code mặc định trong `Code.gs`, dán nội dung `Code.gs` của thư mục này.
5. Bấm dấu **+** cạnh Files → **HTML** để tạo:
   - Index
   - Login
   - Styles
   - Script
6. Dán nội dung tương ứng.
7. Vào **Project Settings** → bật **Show "appsscript.json" manifest file in editor**.
8. Mở `appsscript.json` và thay bằng file manifest trong thư mục này.

## Deploy đúng cách

Vào:

**Deploy → New deployment → Web app**

Cấu hình:

- **Execute as:** User accessing the web app
- **Who has access:** Anyone / Anyone with Google account (tùy tùy chọn Google hiển thị cho tài khoản của bạn)

Sau đó bấm **Deploy** và cấp quyền.

Lần đầu mỗi người dùng truy cập, Google có thể yêu cầu cấp các quyền mà ứng dụng cần để lưu dữ liệu vào Google Drive/Google Sheets của chính họ.

## Dữ liệu được lưu ở đâu?

Trong Google Drive của người đang sử dụng ứng dụng, hệ thống tự tạo:

`Scientist Profile Data/`

Bên trong có:

- `profile.json`: bản dữ liệu hồ sơ đầy đủ.
- thư mục `Evidence/`: file PDF minh chứng.
- Google Sheet `Scientist Profile Database`: bản tóm tắt dữ liệu dạng bảng.

## Tìm bài báo

Phần tìm bài báo được chuyển sang chạy ở phía Apps Script bằng `UrlFetchApp`, tránh lỗi CORS từ trình duyệt.

## Google login

Bản này **không cần Firebase** để bắt người dùng đăng nhập Google.

Google Apps Script Web App xử lý quyền Google ở tầng triển khai. Khi Web App chạy dưới quyền **User accessing the web app**, các thao tác Drive/Sheets chạy dưới tài khoản người đang truy cập.

Nút "Đăng nhập bằng tài khoản Google" trên trang Login sẽ dẫn vào ứng dụng. Google sẽ hiện màn hình đăng nhập/cấp quyền khi cần.

## Cập nhật code sau này

Mỗi lần sửa code:

1. Save project.
2. **Deploy → Manage deployments**.
3. Chọn deployment hiện tại → **Edit**.
4. Tạo **New version**.
5. Deploy lại.

Không cần đổi URL Web App sau mỗi lần cập nhật deployment.
