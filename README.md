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
- Trạng thái hiện tại: **PASS** — người dùng đã xác nhận vào được app thực tế sau rollback.
- Deployment cần dùng mô hình native: **Execute as: User accessing the web app** và quyền truy cập dành cho tài khoản Google phù hợp.



### LAST KNOWN GOOD — Google login

- Ngày xác nhận: **2026-10-05**
- Trạng thái: **PASS**
- Baseline đăng nhập Google: kiến trúc native Google Apps Script phục hồi từ commit `e97347cb648f6a88beea3a995856515fac72f1f0`.
- Các commit rollback đang dùng:
  - `70e519a` — `Code.gs`
  - `9fb3d3a` — `Auth.gs`
  - `fc8e08c` — `Login.html`
  - `e2b6b82` — bootstrap auth trong `Index.html`
  - `4a7637a` — `appsscript.json`
- Cấu hình deployment đã dùng để vào được app:
  - **Execute as: User accessing the web app**
  - Dùng đăng nhập native của Apps Script, không dùng OAuth Client ID/Client Secret tự dựng.
- Xác nhận hiện tại: **đã vào được ứng dụng sau đăng nhập**.
- Chưa đánh dấu đã kiểm thử đầy đủ các tình huống sau cho đến khi test riêng: tài khoản Google ngoài domain, đổi qua lại nhiều tài khoản, reload, logout/login lại, avatar/tên/email đúng mọi tài khoản.
- Quy tắc: nếu sửa auth về sau và phát sinh lỗi, rollback về baseline này trước khi thử hướng mới.


### AUTH-ADMIN-01 — Google-only login + admin dashboard — 2026-10-08

- Xuất phát từ **LAST KNOWN GOOD** native Apps Script login đã PASS.
- Thay đổi:
  - bỏ toàn bộ form email/mật khẩu và nút đăng ký khỏi giao diện;
  - đăng nhập duy nhất qua **Chọn tài khoản Google** bằng Google AccountChooser rồi quay về native Apps Script;
  - vô hiệu hóa tạo mới/đăng nhập bằng mật khẩu ở backend;
  - thêm user registry (email, tên Google, firstSeen, lastSeen, visits);
  - thêm dashboard quản trị: tổng user, active 7/30 ngày, số hồ sơ, dữ liệu học thuật, bảng user và % hoàn thiện hồ sơ;
  - cổng admin bí mật: bấm **chấm cam cạnh “Hồ sơ khoa học” 5 lần**;
  - quyền admin thật sự được kiểm tra server-side bằng Script Property `ADMIN_EMAILS`, không dựa vào việc giấu URL.
- Bảo mật: không hard-code email admin hoặc secret vào repo.
- Cấu hình cần thêm trong Apps Script Script Properties:
  - `ADMIN_EMAILS` = email Google của admin; nhiều admin cách nhau bằng dấu phẩy.
- Deployment vẫn phải giữ **Execute as: User accessing the web app**.
- Trạng thái: **FAIL (forced AccountChooser)** — tài khoản khác xuất hiện lỗi Google Drive “Sorry, unable to open the file”. Phần admin dashboard giữ lại; phần ép chọn tài khoản bị rollback.


### AUTH-ADMIN-02 — Google-only native login, bỏ forced AccountChooser — 2026-10-08

- Nguyên nhân rollback: Google Apps Script không hỗ trợ ổn định multi-login trong cùng một phiên trình duyệt; forced `AccountChooser` dẫn đến lỗi Google Drive ở tài khoản khác.
- Thay đổi:
  - vẫn giữ giao diện **chỉ đăng nhập bằng Google**;
  - bỏ redirect qua `accounts.google.com/AccountChooser`;
  - nút Google quay lại luồng native đã PASS: `?page=app`;
  - giữ nguyên admin dashboard + kiểm tra quyền server-side bằng `ADMIN_EMAILS`.
- Cách dùng tài khoản khác: mở **Incognito** hoặc **Chrome Profile** khác và chỉ đăng nhập tài khoản cần dùng.
- Trạng thái: **PENDING TEST**.
- Rollback nếu fail: LAST KNOWN GOOD ngày 2026-10-05.
