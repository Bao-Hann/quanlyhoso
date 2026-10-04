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
