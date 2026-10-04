# Bản Google Apps Script — Scientist Profile

Thư mục này là bản chuyển đổi từ website GitHub Pages sang **Google Apps Script Web App**.

## Các file cần tạo trong Apps Script

Tạo một Apps Script project và tạo đúng các file sau:

- `Code.gs`
- `Auth.gs`
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

Ứng dụng không yêu cầu quyền Google Drive hoặc Google Sheets.

## Dữ liệu được lưu ở đâu?

- Thông tin cá nhân và các bảng hồ sơ lưu trên máy chủ, khóa theo email đã xác thực. Google và email/mật khẩu cùng email dùng chung bộ hồ sơ; email khác dùng bộ riêng. Cần triển khai với **User accessing the web app** để tách biệt tài khoản.
- File hỗ trợ chỉ nhận PDF, tối đa 20 MB, lưu bằng IndexedDB theo tài khoản trong trình duyệt hiện tại. File không được gửi lên máy chủ, Drive hoặc quản trị viên; đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ không còn file đã lưu.
- Đã bỏ phần đồng bộ Google Sheets/Drive. Dữ liệu cũ trên Drive không bị xóa.
- Word xuất thành `.docx` từ mẫu Bộ trong repo, giữ định dạng, bảng, đầu trang và chân trang của mẫu.

## Tìm bài báo

Phần tìm bài báo được chuyển sang chạy ở phía Apps Script bằng `UrlFetchApp`, tránh lỗi CORS từ trình duyệt.

## Google login

Bản này **không cần Firebase** để bắt người dùng đăng nhập Google.

Google Apps Script Web App xử lý quyền Google ở tầng triển khai. Khi Web App chạy dưới quyền **User accessing the web app**, thông tin cá nhân được lưu riêng theo tài khoản người đang truy cập.

Nút "Đăng nhập bằng tài khoản Google" trên trang Login sẽ dẫn vào ứng dụng. Google sẽ hiện màn hình đăng nhập/cấp quyền khi cần.

## Cập nhật code sau này

Mỗi lần sửa code:

1. Save project.
2. **Deploy → Manage deployments**.
3. Chọn deployment hiện tại → **Edit**.
4. Tạo **New version**.
5. Deploy lại.

Không cần đổi URL Web App sau mỗi lần cập nhật deployment.

## Cập nhật bản sửa hồ sơ

Tạo thêm tệp mã `Auth.gs`. Thay nội dung `Code.gs`, `Index.html`, `Login.html`, `Script.html` và `appsscript.json` bằng bản trong thư mục này. Giữ `Styles.html`. Lưu dự án, sau đó cập nhật deployment bằng **New version** theo hướng dẫn trên. `Script.html` đã nhúng JSZip và mẫu Word, không cần thêm file JavaScript.

## Đăng nhập và tách hồ sơ

- Bắt buộc giữ **Execute as: User accessing the web app**. Nếu chạy dưới quyền chủ dự án, ứng dụng từ chối đọc/lưu hồ sơ để tránh dùng chung danh tính.
- Email được lấy từ tài khoản Google hoặc phiên mật khẩu đã xác thực; không lấy email đang chỉnh trong hồ sơ làm khóa lưu.
- Tạo mật khẩu chỉ được khi email nhập trùng tài khoản Google đang đăng nhập. Mật khẩu riêng tối thiểu 12 ký tự, lưu bằng PBKDF2-HMAC-SHA256 (100.000 vòng). Không nhập mật khẩu Google.
- Phiên mật khẩu hết hạn sau 24 giờ; đăng xuất thu hồi phiên. Sau 5 lần thử đăng nhập, tài khoản tạm khóa thử tiếp trong 15 phút.
- Google và mật khẩu cùng email dùng chung thông tin cá nhân và các bảng. PDF hỗ trợ vẫn chỉ lưu trong trình duyệt, theo email.
- Dữ liệu dùng chung của bản cũ không tự gán cho tài khoản mới, vì không xác định được ai là chủ sở hữu. Các file Drive cũ không bị xóa.
- Do chạy trên Apps Script, Google vẫn có thể yêu cầu đăng nhập/cấp quyền truy cập ứng dụng, kể cả khi dùng mật khẩu riêng.

## Kiểm tra

Chạy `npm install` và `npm test` ở thư mục gốc. Kiểm tra gồm tách hai tài khoản, cùng email dùng chung hồ sơ, chặn chạy dưới quyền chủ dự án, đăng ký/đăng nhập mật khẩu, thu hồi phiên, giới hạn thử mật khẩu và lưu/tải lại bảng hồ sơ.
