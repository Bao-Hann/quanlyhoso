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


### AUTH-ADMIN-04 — Kiểm tra lỗi Google Drive ở tài khoản khác — 2026-10-08

- Hiện tượng: tài khoản khác mở Web App nhận trang Google Drive “Sorry, unable to open the file at this time”.
- Phát hiện:
  - Script Properties có `WEB_APP_URL`, nhưng trước đó code chưa ưu tiên dùng URL này ở toàn bộ luồng điều hướng.
  - Sau lần sửa đầu tiên, hàm `canonicalWebAppUrl_()` bị lỗi đệ quy ngoài ý muốn; đã sửa ngay ở commit `ad7ad20`.
- Cấu hình cần giữ:
  - `WEB_APP_URL` = đúng URL deployment hiện tại dạng `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`.
  - `ADMIN_EMAILS` = email quản trị.
- Các property `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` không còn được dùng bởi baseline native Apps Script hiện tại; có thể giữ tạm nhưng không nên dựa vào chúng.
- Nếu tài khoản ngoài domain vẫn lỗi sau khi deploy code mới và `WEB_APP_URL` đúng, nguyên nhân còn lại nhiều khả năng nằm ở quyền truy cập của deployment / chính sách Google Workspace, không phải logic login trong HTML.
- Trạng thái: **PENDING TEST**.


### AUTH-ADMIN-05 — External account access + stop dynamic Script Properties — 2026-10-08

- Xác nhận cấu hình người dùng cung cấp:
  - `ADMIN_EMAILS`: cấu hình tĩnh.
  - `UPLOAD_FOLDER_ID`: vị trí database/storage đã có.
  - `WEB_APP_URL`: URL deployment hiện tại.
- Sửa lỗi truy cập tài khoản khác:
  - manifest web app ép `access: ANYONE`;
  - `executeAs: USER_ACCESSING`;
  - mục tiêu là cho mọi tài khoản Google đã đăng nhập được quyền mở Web App, thay vì vô tình bị giới hạn DOMAIN.
- Sửa lưu trữ:
  - dừng hoàn toàn việc tự tạo/cập nhật `USER_REGISTRY_*` trong Script Properties;
  - Script Properties chỉ dùng cho cấu hình tĩnh;
  - registry cũ chỉ được đọc tạm để dashboard không mất dữ liệu lịch sử.
- `Index.html` dùng `WEB_APP_URL` chuẩn qua `getWebAppUrl()`.
- Trạng thái: **PENDING TEST**.
- Nếu tài khoản ngoài domain vẫn nhận trang Google Drive trước khi giao diện app tải, lỗi nằm ở deployment/Workspace policy ngoài logic HTML; kiểm tra deployment phải hiển thị quyền tương đương **Anyone / bất kỳ người dùng đã đăng nhập**.


### AUTH-ADMIN-06 — Phân tách 2 lỗi thực tế khi test nhiều tài khoản — 2026-10-08

- Ảnh test cho thấy **2 lỗi độc lập**:
  1. Một cửa sổ bị Google Drive “Sorry, unable to open the file at this time” khi dùng nhiều tài khoản Google trong cùng phiên trình duyệt.
  2. Một cửa sổ Apps Script báo: `Exception: Không tìm thấy tệp HTML có tên Index. (dòng 15, tệp "code")`.
- Kết luận:
  - Lỗi (2) không phải lỗi auth: deployment Apps Script đang chạy thiếu file `Index.html` hoặc đang chạy một version/project chưa chứa file đó. Repo GitHub hiện có `google-apps-script/Index.html`.
  - Lỗi (1) phù hợp với hạn chế multi-login chính thức của Apps Script; không nên tiếp tục cố ép đổi tài khoản trong cùng Chrome session bằng native Apps Script.
- Cách sửa deployment:
  - đồng bộ đủ `Code.gs`, `Auth.gs`, `Login.html`, `Index.html`, `Admin.html`, `Styles.html`, `Script.html`, `appsscript.json` vào **cùng một Apps Script project**;
  - sau đó tạo **New version** trên đúng deployment;
  - test từng tài khoản bằng Incognito hoặc Chrome Profile riêng.
- Trạng thái: **FAIL do deployment thiếu file + multi-login limitation**, chưa thay đổi baseline auth.


### AUTH-ADMIN-07 — Deployment diagnostic — 2026-10-08

- Người dùng xác nhận Apps Script editor trước đó vẫn có `Index.html` đầy đủ.
- Vì vậy lỗi `Không tìm thấy tệp HTML có tên Index` được xem là dấu hiệu deployment đang chạy **snapshot/version hoặc deployment/project khác** với editor đang nhìn, không kết luận rằng source hiện tại thiếu `Index.html`.
- Thêm route `?page=diag` không phụ thuộc file HTML ngoài để hiển thị:
  - Script ID;
  - URL mà Apps Script runtime trả về;
  - `WEB_APP_URL`;
  - build marker `AUTH-ADMIN-07-20261008`.
- Mục tiêu: đối chiếu chính xác URL đang mở có chạy đúng project/version vừa deploy hay không trước khi sửa auth tiếp.
- Trạng thái: **PENDING TEST**.


### AUTH-ADMIN-08 — Runtime đang chạy code khác editor — 2026-10-08

- Lỗi mới hiển thị: `Không tìm thấy tệp HTML có tên Login. (dòng 26, tệp "code")`.
- Đối chiếu với source GitHub hiện tại:
  - dòng 26 của `Code.gs` hiện tại chỉ là dấu đóng hàm `canonicalWebAppUrl_()`;
  - lệnh tạo `Login` nằm khoảng dòng 83.
- Kết luận: runtime/deployment trong ảnh **không chạy cùng snapshot Code.gs hiện tại**. Đây là bằng chứng trực tiếp của deployment/version/project mismatch, chưa phải bằng chứng rằng repo thiếu `Login.html`.
- Thêm hàm `debugDeployment()` chạy trực tiếp trong Apps Script editor để log:
  - build marker;
  - Script ID;
  - service URL;
  - `WEB_APP_URL`;
  - sự tồn tại của Login/Index/Admin/Styles/Script trong chính project editor đang mở.
- Không thay đổi logic đăng nhập trong lần thử này.
- Trạng thái: **PENDING DIAGNOSTIC**.


### AUTH-MULTI-ACCOUNT-01 — Custom Google OAuth account chooser — 2026-10-08

- Mục tiêu: cho phép người dùng đang đăng nhập nhiều tài khoản Google vẫn **chọn đúng tài khoản** khi vào Scientist Profile.
- Lý do đổi kiến trúc:
  - Google xác nhận multi-login không được hỗ trợ ổn định với Apps Script web apps native;
  - Google OAuth 2.0 hỗ trợ `prompt=select_account`, đúng nhu cầu chọn tài khoản.
- Kiến trúc mới:
  - Web App chạy **Execute as: Me / user deploying** và cho phép truy cập công khai;
  - trang login gọi OAuth Google với `prompt=select_account`;
  - callback quay về đúng `WEB_APP_URL`;
  - session được ký stateless, không ghi session/user động vào Script Properties;
  - dữ liệu user/profile/tables được lưu trong Drive folder `UPLOAD_FOLDER_ID`;
  - admin dashboard đọc dữ liệu user từ folder này và xác thực bằng signed session token.
- UI: bỏ khối “Ứng dụng chỉ dùng danh tính Google...” và bỏ cảnh báo dùng Incognito.
- Script Properties chỉ còn là cấu hình tĩnh: `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `UPLOAD_FOLDER_ID`, `WEB_APP_URL`.
- Google Cloud phải có Authorized redirect URI đúng bằng giá trị `WEB_APP_URL`.
- Trạng thái: **PENDING TEST**. Nếu fail, rollback về LAST KNOWN GOOD trước khi thử tiếp.


### FORM-EXPORT-01 — 2026-10-09

- Mục tiêu: sửa các ràng buộc ngày/tháng/năm và làm sạch dữ liệu khi xuất Word.
- Thay đổi:
  - Quá trình công tác: trường **Từ** không cho chọn/lưu ngày tương lai.
  - Seminar/Hội thảo và Sách giáo trình: tháng/năm không được vượt thời điểm hiện tại.
  - Kiểm tra lặp lại ở server trước khi `saveTables` để không thể bỏ qua chỉ bằng DevTools.
  - Xuất Word: bảng chỉ giữ **đúng số dòng có dữ liệu**, xóa các dòng trống dự phòng của template.
  - Xuất Word: tự điền **ngày / tháng / năm hiện tại** vào dòng ký có mẫu “ngày ... tháng ... năm ...”.
- File sửa: `google-apps-script/Index.html`, `Script.html`, `Code.gs`.
- Trạng thái: **PENDING TEST** — chưa đánh dấu PASS cho tới khi kiểm thử trên Web App và file Word thực tế.
- Nếu fail: rollback riêng các commit FORM-EXPORT-01, không sửa chồng lên luồng đăng nhập.


### ADMIN-PROFILE-02 — Admin login + full-profile filtering + preferences — 2026-10-09

- Mục tiêu:
  - có luồng **đăng nhập Admin riêng** nhưng lối vào vẫn kín;
  - Admin xem dashboard tổng hợp người dùng và lọc trên toàn bộ dữ liệu hồ sơ;
  - bổ sung nhu cầu **đi dạy/thỉnh giảng** và **tham gia dự án doanh nghiệp**;
  - bản Word luôn lấy **học vị cao nhất** khi điền trường học vị cao nhất.
- Thay đổi:
  - cổng ẩn vẫn là chấm cam cạnh “Hồ sơ khoa học” bấm 5 lần, nhưng nay mở panel “Đăng nhập quản trị” riêng;
  - OAuth state phân biệt `user` và `admin`; tài khoản admin được kiểm tra server-side qua `ADMIN_EMAILS`;
  - callback admin vào thẳng `Admin.html`, lưu session hiện tại và gọi `getAdminDashboard`;
  - dashboard hiển thị tuổi, giới tính, học vị cao nhất, nhu cầu giảng dạy, nhu cầu dự án doanh nghiệp, mức hoàn thiện và lần hoạt động gần nhất;
  - tìm kiếm toàn hồ sơ bằng một ô search; thêm lọc theo bất kỳ trường dữ liệu đã thu thập, giới tính và nhu cầu;
  - nút “Xem” mở chi tiết hồ sơ và toàn bộ dữ liệu học thuật của từng user;
  - các switch mong muốn được lưu vào hồ sơ người dùng và xuất hiện trong dashboard admin;
  - logic học vị cao nhất: Tiến sĩ > Thạc sĩ > Kỹ sư/Cử nhân > khác; cùng bậc chọn năm gần nhất.
- File sửa: `Auth.gs`, `Code.gs`, `Login.html`, `Index.html`, `Script.html`, `Admin.html`.
- Trạng thái: **PENDING TEST**.
- Nếu fail: rollback riêng nhóm commit ADMIN-PROFILE-02 và đối chiếu LAST KNOWN GOOD trước khi sửa tiếp.


### PROFILE-EDIT-01 — Mở lại nút Edit khi tải hồ sơ lỗi — 2026-10-09

- Hiện tượng: phần **Thông tin cơ bản** hiển thị nhưng nút **Edit** không sử dụng được.
- Nguyên nhân trong client: khi `loadGeneral()` lỗi (ví dụ backend/Drive trả lỗi), code đặt `editBtn.disabled = true` nhưng nhánh failure không bật lại.
- Sửa:
  - failure handler của `loadGeneral` luôn bật lại nút **Edit**;
  - đặt `generalReady = true` để người dùng có thể nhập dữ liệu mới;
  - đổi thông báo thành cảnh báo rõ rằng hồ sơ cũ chưa tải được nhưng vẫn có thể chỉnh sửa.
- Lưu ý: nếu backend vẫn báo `DriveApp access denied`, người dùng có thể mở form nhưng thao tác **Save** vẫn có thể lỗi cho đến khi quyền Drive của deployment được xử lý.
- File sửa: `google-apps-script/Script.html`.
- Trạng thái: **PENDING TEST**.


### PROFILE-EDIT-02 — Hard fallback cho nút Edit — 2026-10-09

- Kết quả test PROFILE-EDIT-01: **FAIL** — người dùng vẫn không mở được chế độ chỉnh sửa.
- Giả thuyết mới: luồng JavaScript/server đang lỗi hoặc treo trước/sau khi tải hồ sơ khiến handler chuẩn không hoạt động ổn định.
- Sửa:
  - nút **Edit** có fallback trực tiếp ngay trong `Index.html`, không phụ thuộc `google.script.run` hay việc `Script.html` tải dữ liệu thành công;
  - không còn khóa nút Edit trong lúc gọi `loadGeneral`;
  - thêm delegated click fallback trong `Script.html`;
  - khi Edit được bấm, toàn bộ `.general-field` được bật và nút Save hiện ra ngay.
- Trạng thái: **PENDING TEST**.
- Nếu vẫn fail, kiểm tra deployment/version mismatch trước khi tiếp tục sửa logic.

### ADMIN-DRIVE-02 — Fix thực tế quyền Drive chặn Admin — 2026-10-10

- Xác nhận lần trước code chưa được ghi vào GitHub: `authorizeStorage_()` và `debugStorageAccess()` chưa tồn tại trong `Code.gs`.
- Đã cập nhật thực tế:
  - OAuth admin không còn fail toàn bộ chỉ vì `DriveApp` bị từ chối;
  - admin đúng email vẫn được render Dashboard;
  - Dashboard trả `storageError` và hiển thị cảnh báo nếu chưa đọc được Drive;
  - thêm `authorizeStorage_()` để chạy thủ công và kích hoạt quyền Drive;
  - thêm `debugStorageAccess()` để kiểm tra effective user, active user và folder.
- Trạng thái: **PENDING TEST**.
- Nếu `authorizeStorage_()` vẫn báo `Access denied: DriveApp`, nguyên nhân nằm ở quyền Drive/folder hoặc chính sách Workspace, không phải `ADMIN_EMAILS`.


### PROFILE-SAVE-03 — Save fallback + ngày lịch sử phải trước hiện tại — 2026-10-10

- Kết quả test trước: **FAIL một phần** — Edit đã mở được nhưng Save hồ sơ không thành công; backend đang có lỗi `DriveApp access denied`.
- Sửa storage:
  - đọc/ghi hồ sơ ưu tiên Google Drive;
  - nếu `DriveApp` bị Workspace chặn, tự động fallback sang Script Properties theo từng user và chia dữ liệu thành nhiều chunk;
  - `loadGeneral`, `saveGeneral`, preferences và tables đều dùng chung lớp storage này;
  - Admin Dashboard gộp dữ liệu từ Drive và fallback để vẫn thấy user đã lưu.
- Sửa ngày:
  - mọi input `type=date` có max = **ngày hôm qua**;
  - ngày sinh, ngày cấp CCCD, ngày bắt đầu/kết thúc công tác và ngày bắt đầu/nghiệm thu đề tài không nhận hôm nay hoặc tương lai;
  - kiểm tra lặp lại cả client và server.
- Lưu ý kỹ thuật: Script Properties chỉ là fallback khi Drive bị chặn; dung lượng có giới hạn, nên về lâu dài vẫn nên cấp lại quyền Drive hoặc chuyển sang storage bền vững hơn.
- File sửa: `Code.gs`, `Script.html`.
- Trạng thái: **PENDING TEST**.


### PROFILE-SAVE-04 — Fix lỗi cú pháp Code.gs dòng 622 — 2026-10-10

- Kết quả test PROFILE-SAVE-03: **FAIL trước khi chạy** vì Apps Script báo `SyntaxError: Illegal continue statement: no surrounding iteration statement` tại dòng 622.
- Nguyên nhân: vòng lặp Admin Dashboard đã được đổi từ `while` sang `docs.forEach(...)`, nhưng câu `continue` cũ vẫn còn bên trong callback.
- Sửa: đổi `if (!email) continue;` thành `if (!email) return;` để bỏ qua user hiện tại trong callback `forEach`.
- Không thay đổi logic storage/date ở lần sửa này.
- File sửa: `google-apps-script/Code.gs`.
- Trạng thái: **PENDING TEST**.

