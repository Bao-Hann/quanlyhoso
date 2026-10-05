# Scientist Profile Clone

Django rebuild of the scientific-profile page referenced in the project. The UI mirrors the source layout: fixed light-blue sidebar, full-screen sections, Bootstrap forms/tables/modals, and the same scientific-profile information groups.

## Included
- Authentication (register/login/logout)
- Thông tin cơ bản: view -> Edit -> Save
- Thông tin bổ sung + 4 preference switches
- Môn học có thể giảng dạy / Hướng nghiên cứu
- Học hàm - học vị / Ngoại ngữ
- Quá trình công tác
- Đề tài tham gia
- Công bố khoa học
- Giải thưởng / chuyển giao công nghệ
- Upload PDF support file (stored in the current browser per account)
- Export a `.docx` scientific CV

## Run
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations profiles
python manage.py migrate
python manage.py runserver
```

Open `http://127.0.0.1:8000/`.

## Notes
The supplied Ministry Word template is copied into `templates_docx/` for the next export-mapping pass. Current export already creates a usable Word document from saved profile data, but pixel-perfect field mapping into the original template is the next refinement.

## Nhật ký chỉnh sửa & quy tắc thử nghiệm

> Mục tiêu: tránh sửa chồng nhiều hướng khi chưa biết hướng nào thực sự hoạt động. Mỗi lần thử phải có giả thuyết, commit, kết quả test và điểm quay lui rõ ràng.

### Quy tắc làm việc từ bây giờ
1. Mỗi thay đổi chỉ kiểm tra **một giả thuyết chính**.
2. Sau khi deploy, kết quả phải được ghi lại ngay trong README với trạng thái: `PASS`, `PARTIAL` hoặc `FAIL`.
3. Nếu `FAIL`: không tiếp tục chồng thêm sửa đổi lên hướng đó. Trước lần thử kế tiếp phải đối chiếu và quay về **checkpoint gần nhất đã được xác nhận hoạt động** đối với phần đang sửa.
4. Một commit chỉ được đánh dấu **checkpoint thành công** khi đã được test thực tế trên Web App, không dựa vào việc code nhìn có vẻ đúng.
5. Google OAuth phải test tối thiểu:
   - tài khoản quản trị / tài khoản trường;
   - một tài khoản Google khác ngoài tài khoản quản trị;
   - vào được giao diện hồ sơ sau OAuth;
   - tên, email, avatar đúng tài khoản đã chọn;
   - reload trang vẫn giữ đúng phiên;
   - đăng xuất rồi đăng nhập tài khoản khác không bị lẫn dữ liệu.
6. Không commit `GOOGLE_OAUTH_CLIENT_SECRET`, access token, refresh token hoặc thông tin bí mật vào GitHub.

### Checkpoint hiện tại
- **Google OAuth full login:** chưa có checkpoint PASS.
- **Điểm đã xác nhận một phần:** Google đã hiển thị bước chọn tài khoản và màn hình đồng ý cấp thông tin ở một số lần thử, nhưng chưa hoàn tất ổn định bước vào ứng dụng.
- Vì chưa có lần Google OAuth nào PASS hoàn chỉnh, các commit OAuth bên dưới đều được xem là **thử nghiệm**, không được coi là baseline ổn định.

### Nhật ký Google OAuth — 2026-10-05

| Lần thử | Commit / thay đổi | Kết quả thực tế | Trạng thái |
|---|---|---|---|
| OAuth-01 | `fde171e`, `5b3363a`, `052b409` — chuyển sang server-side Google OAuth, tách local auth | Chọn Google + cấp quyền được, sau đó lỗi state token / không vào app ổn định | FAIL |
| OAuth-02 | `e2be412` — bỏ `/usercallback`, callback về Web App `/exec` và dùng state riêng | Xuất hiện `redirect_uri_mismatch` | FAIL |
| OAuth-03 | `41dce62` — ghim callback vào URL deployment đã biết | Vẫn `redirect_uri_mismatch` | FAIL |
| OAuth-04 | `5d4d1ed` — thêm trang `?page=oauthdebug` | Trang debug không hiện trên deployment đang test; phát hiện đang dùng sai Deployment ID | PARTIAL |
| OAuth-05 | `2953938` — cập nhật callback sang Deployment ID hiện tại `AKfycbywj...` | Tài khoản admin đi qua OAuth đến trang “Đang hoàn tất đăng nhập Google...”; tài khoản khác vẫn lỗi / không vào app | PARTIAL |
| OAuth-06 | `c912b68` — sửa redirect sau OAuth và script tag | Vẫn không hoàn tất đăng nhập | FAIL |
| OAuth-07 | `1a6e504`, `193b826`, `3c3e1cf` — render thẳng app sau callback, bootstrap session trực tiếp, bỏ refresh identity cũ | Sau test vẫn bị văng ra, không đăng nhập vào app được | FAIL |

### Quy tắc rollback cho nhánh OAuth
- **Không lấy OAuth-07 làm baseline thành công.**
- Trước thử nghiệm OAuth kế tiếp, phải kiểm tra diff của lần thử mới so với lần gần nhất có hành vi tốt hơn.
- Nếu thay đổi mới làm hành vi xấu hơn, revert thay đổi đó thay vì vá tiếp lên trên.
- Khi có một lần test PASS hoàn chỉnh, ghi rõ:
  - commit SHA;
  - Deployment ID;
  - redirect URI;
  - tài khoản đã test;
  - kết quả reload / logout / đổi tài khoản;
  và đánh dấu commit đó là **LAST KNOWN GOOD**.

### Mẫu ghi cho các lần thử tiếp theo

```text
[YYYY-MM-DD HH:mm] TEST-ID
Giả thuyết:
Thay đổi:
Commit:
Deployment ID:
Cách test:
Kết quả:
Trạng thái: PASS / PARTIAL / FAIL
Rollback về:
Ghi chú:
```


### Rollback login — 2026-10-05

- **ROLLBACK-01**
- Mục tiêu: bỏ toàn bộ luồng OAuth Client ID/Client Secret + callback `/exec` đang fail và quay lại kiến trúc đăng nhập Google native của Apps Script tại commit `e97347cb648f6a88beea3a995856515fac72f1f0`.
- Luồng phục hồi: `Login.html → ?page=app → Session.getActiveUser()/ScriptApp.getIdentityToken() → Index.html`.
- Các file phục hồi logic auth: `Code.gs`, `Auth.gs`, `Login.html`, bootstrap auth trong `Index.html`, `appsscript.json`.
- Giữ yêu cầu mới: tên tài khoản **không** lấy từ trường `person_name` của hồ sơ khoa học.
- Không revert các phần UI/Word export/theme trong `Script.html`.
- Trạng thái hiện tại: **PENDING TEST** — chỉ đổi thành PASS sau khi người dùng xác nhận vào được app thực tế.
- Deployment cần dùng mô hình native: **Execute as: User accessing the web app** và quyền truy cập dành cho tài khoản Google phù hợp.

