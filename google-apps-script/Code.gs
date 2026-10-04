/**
 * Scientist Profile - Google Apps Script edition
 * Deploy as a Web App:
 *   Execute as: User accessing the web app
 *   Who has access: Anyone with a Google account
 */

const APP_TITLE = 'Scientist Profile';
const PROFILE_FOLDER_NAME = 'Scientist Profile Data';
const PROFILE_FILE_NAME = 'profile.json';
const EVIDENCE_FOLDER_NAME = 'Evidence';

function doGet(e) {
  const page = String((e && e.parameter && e.parameter.page) || 'login').toLowerCase();

  if (page === 'app' || page === 'home') {
    const user = getCurrentUser();
    if (!user.email) {
      return renderLogin_('Không lấy được email Google. Hãy triển khai Web App với quyền "User accessing the web app".');
    }

    const t = HtmlService.createTemplateFromFile('Index');
    t.userJson = JSON.stringify(user);
    return t.evaluate()
      .setTitle(APP_TITLE)
      .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png');
  }

  return renderLogin_('');
}

function renderLogin_(message) {
  const t = HtmlService.createTemplateFromFile('Login');
  t.message = message || '';
  t.webAppUrl = ScriptApp.getService().getUrl() || '';
  return t.evaluate().setTitle('Đăng nhập - ' + APP_TITLE);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getWebAppUrl() {
  return ScriptApp.getService().getUrl() || '';
}

function getCurrentUser() {
  const email = Session.getActiveUser().getEmail() || '';
  const name = email ? email.split('@')[0] : '';
  return {
    email: email,
    name: name,
    temporaryKey: Session.getTemporaryActiveUserKey()
  };
}

/**
 * Lưu toàn bộ hồ sơ vào Google Drive của chính người dùng.
 * Dữ liệu được lưu dạng JSON để không bị giới hạn kích thước ô Google Sheet.
 */
function saveProfile(payload) {
  assertSignedIn_();
  const folder = getOrCreateDataFolder_();
  const json = JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    user: getCurrentUser(),
    data: payload || {}
  });

  const files = folder.getFilesByName(PROFILE_FILE_NAME);
  let file;
  if (files.hasNext()) {
    file = files.next();
    file.setContent(json);
  } else {
    file = folder.createFile(PROFILE_FILE_NAME, json, MimeType.PLAIN_TEXT);
  }

  syncSummarySheet_(payload || {}, folder);

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    fileId: file.getId(),
    fileUrl: file.getUrl()
  };
}

function loadProfile() {
  assertSignedIn_();
  const folder = getOrCreateDataFolder_();
  const files = folder.getFilesByName(PROFILE_FILE_NAME);

  if (!files.hasNext()) {
    return { ok: true, exists: false, data: null };
  }

  const file = files.next();
  try {
    const parsed = JSON.parse(file.getBlob().getDataAsString('UTF-8'));
    return {
      ok: true,
      exists: true,
      updatedAt: parsed.updatedAt || '',
      data: parsed.data || {}
    };
  } catch (err) {
    throw new Error('Dữ liệu hồ sơ bị lỗi định dạng: ' + err.message);
  }
}

/**
 * Tạo/cập nhật Google Sheet tóm tắt để người dùng có thể xem dữ liệu dạng bảng.
 */
function syncSummarySheet_(payload, folder) {
  const props = PropertiesService.getUserProperties();
  let sheetId = props.getProperty('PROFILE_SHEET_ID');
  let ss;

  try {
    if (sheetId) ss = SpreadsheetApp.openById(sheetId);
  } catch (err) {
    sheetId = '';
  }

  if (!sheetId) {
    ss = SpreadsheetApp.create('Scientist Profile Database');
    sheetId = ss.getId();
    props.setProperty('PROFILE_SHEET_ID', sheetId);

    try {
      const file = DriveApp.getFileById(sheetId);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } catch (err) {
      // Không làm hỏng thao tác lưu nếu Drive không cho di chuyển.
    }
  }

  const sheet = ss.getSheets()[0];
  sheet.setName('Profile');
  sheet.clearContents();

  const rows = [['Nhóm', 'Trường', 'Giá trị']];

  const pushObject = (group, obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value == null) return;
      if (typeof value === 'object') {
        rows.push([group, key, JSON.stringify(value)]);
      } else {
        rows.push([group, key, String(value)]);
      }
    });
  };

  pushObject('Thông tin cơ bản', payload.general || {});
  pushObject('Cài đặt', { theme: payload.theme || '' });

  const sections = payload.tables || {};
  Object.keys(sections).forEach(sectionName => {
    const list = sections[sectionName];
    if (!Array.isArray(list)) return;
    list.forEach((row, index) => {
      rows.push([sectionName, 'Dòng ' + (index + 1), JSON.stringify(row)]);
    });
  });

  if (rows.length) {
    sheet.getRange(1, 1, rows.length, 3).setValues(rows);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 3);
  }
}

/**
 * Nhận PDF dạng base64 và lưu vào Google Drive của người đang dùng web app.
 */
function uploadEvidence(file) {
  assertSignedIn_();

  if (!file || !file.base64 || !file.name) {
    throw new Error('Thiếu dữ liệu file.');
  }

  const mimeType = file.mimeType || 'application/pdf';
  if (mimeType !== 'application/pdf') {
    throw new Error('Chỉ hỗ trợ PDF.');
  }

  const bytes = Utilities.base64Decode(file.base64);
  const blob = Utilities.newBlob(bytes, mimeType, sanitizeFileName_(file.name));
  const folder = getOrCreateEvidenceFolder_();
  const created = folder.createFile(blob);

  return {
    ok: true,
    id: created.getId(),
    name: created.getName(),
    url: created.getUrl()
  };
}

function deleteEvidence(fileId) {
  assertSignedIn_();
  if (!fileId) return { ok: false };
  DriveApp.getFileById(fileId).setTrashed(true);
  return { ok: true };
}

/**
 * Tìm metadata bài báo ở phía Apps Script để tránh lỗi CORS trên trình duyệt.
 */
function searchPublications(query, page, rows) {
  assertSignedIn_();

  query = String(query || '').trim();
  if (!query) return { items: [], total: 0, page: 1 };

  page = Math.max(1, Number(page || 1));
  rows = Math.max(1, Math.min(20, Number(rows || 5)));

  const doi = normalizeDoi_(query);
  let url;

  if (doi) {
    url = 'https://api.crossref.org/v1/works/' + encodeURIComponent(doi);
  } else {
    const offset = (page - 1) * rows;
    url = 'https://api.crossref.org/v1/works?query.bibliographic=' +
      encodeURIComponent(query) + '&rows=' + rows + '&offset=' + offset;
  }

  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { Accept: 'application/json' }
  });

  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('Không lấy được dữ liệu bài báo (HTTP ' + code + ').');
  }

  const data = JSON.parse(response.getContentText());

  if (doi) {
    return {
      items: data && data.message ? [normalizePublication_(data.message)] : [],
      total: data && data.message ? 1 : 0,
      page: 1,
      exactDoi: true
    };
  }

  const message = data.message || {};
  return {
    items: (message.items || []).map(normalizePublication_),
    total: Number(message['total-results'] || 0),
    page: page,
    exactDoi: false
  };
}

function normalizePublication_(item) {
  const authors = (item.author || []).map(author =>
    [author.given || '', author.family || ''].filter(Boolean).join(' ')
  ).filter(Boolean).join(', ');

  const dates = [
    item['published-print'],
    item['published-online'],
    item.published,
    item.issued,
    item.created
  ];

  let year = '';
  for (let i = 0; i < dates.length; i++) {
    const parts = dates[i] && dates[i]['date-parts'];
    if (parts && parts[0] && parts[0][0]) {
      year = parts[0][0];
      break;
    }
  }

  return {
    title: Array.isArray(item.title) ? (item.title[0] || '') : (item.title || ''),
    authors: authors,
    year: year,
    issn: Array.isArray(item.ISSN) ? item.ISSN.join(', ') : (item.ISSN || ''),
    journal: Array.isArray(item['container-title']) ? (item['container-title'][0] || '') : (item['container-title'] || ''),
    doi: item.DOI || '',
    url: item.URL || (item.DOI ? 'https://doi.org/' + item.DOI : ''),
    publisher: item.publisher || '',
    type: item.type || ''
  };
}

function normalizeDoi_(raw) {
  const cleaned = String(raw || '')
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim();
  return /^10\.\d{4,9}\/.+$/i.test(cleaned) ? cleaned : '';
}

function getOrCreateDataFolder_() {
  const props = PropertiesService.getUserProperties();
  let id = props.getProperty('PROFILE_FOLDER_ID');

  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (err) {
      props.deleteProperty('PROFILE_FOLDER_ID');
    }
  }

  const folders = DriveApp.getFoldersByName(PROFILE_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(PROFILE_FOLDER_NAME);
  props.setProperty('PROFILE_FOLDER_ID', folder.getId());
  return folder;
}

function getOrCreateEvidenceFolder_() {
  const dataFolder = getOrCreateDataFolder_();
  const folders = dataFolder.getFoldersByName(EVIDENCE_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : dataFolder.createFolder(EVIDENCE_FOLDER_NAME);
}

function sanitizeFileName_(name) {
  return String(name || 'evidence.pdf').replace(/[\\/:*?"<>|]+/g, '_');
}

function assertSignedIn_() {
  const user = getCurrentUser();
  if (!user.email) {
    throw new Error('Bạn chưa đăng nhập bằng tài khoản Google.');
  }
}
