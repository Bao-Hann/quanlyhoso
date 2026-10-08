/**
 * Scientist Profile - Google Apps Script edition
 * Deploy as a Web App:
 *   Execute as: User accessing the web app
 *   Who has access: Anyone with a Google account
 */

const APP_TITLE = 'Scientist Profile';

function canonicalWebAppUrl_() {
  const props = PropertiesService.getScriptProperties();
  const configured = String(props.getProperty('WEB_APP_URL') || '').trim();
  const fallback = String(canonicalWebAppUrl_()).trim();

  // Ưu tiên URL /macros/s/.../exec cố định để tránh Google Workspace tự biến
  // thành /a/macros/<domain>/... khiến tài khoản ngoài domain mở ra trang lỗi Drive.
  const isPublicExec = url =>
    /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url);

  if (isPublicExec(configured)) return configured;
  if (isPublicExec(fallback)) return fallback;

  // Nếu Apps Script trả URL theo domain (/a/macros/...), vẫn trả về để app không chết,
  // nhưng admin nên sửa WEB_APP_URL thành URL /macros/s/.../exec chuẩn.
  return configured || fallback;
}


function doGet(e) {
  const page = String((e && e.parameter && e.parameter.page) || 'login').toLowerCase();

  if (page === 'admin') {
    const admin = getCurrentUser();
    if (!isAdminUser_(admin)) {
      // Không để lộ việc có trang quản trị cho tài khoản thường.
      return renderLogin_('');
    }
    registerUserVisit_(admin);
    const t = HtmlService.createTemplateFromFile('Admin');
    t.adminJson = JSON.stringify(admin).replace(/</g, '\\u003c');
    t.webAppUrl = canonicalWebAppUrl_();
    return t.evaluate()
      .setTitle('Admin Dashboard - ' + APP_TITLE)
      .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png');
  }

  if (page === 'app' || page === 'home') {
    const user = getCurrentUser();
    registerUserVisit_(user);
    const t = HtmlService.createTemplateFromFile('Index');
    t.userJson = JSON.stringify(user).replace(/</g, '\\u003c');
    return t.evaluate()
      .setTitle(APP_TITLE)
      .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png');
  }

  return renderLogin_('');
}
function renderLogin_(message) {
  const t = HtmlService.createTemplateFromFile('Login');
  t.message = message || '';
  t.webAppUrl = canonicalWebAppUrl_();

  // Dùng thẳng native Apps Script login. Không ép AccountChooser vì Apps Script
  // không hỗ trợ ổn định multi-login trong cùng một phiên trình duyệt.
  t.googleAccountChooserUrl = t.webAppUrl + '?page=app';

  return t.evaluate().setTitle('Đăng nhập - ' + APP_TITLE);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getWebAppUrl() {
  return canonicalWebAppUrl_();
}

// Identity comes from the Apps Script OpenID token of the effective user.
// This mirrors the original source architecture: the login session already carries
// name + email instead of trying to derive a display name from the email address.
function getWebAppDiagnostics() {
  const props = PropertiesService.getScriptProperties();
  const configured = String(props.getProperty('WEB_APP_URL') || '').trim();
  const serviceUrl = String(ScriptApp.getService().getUrl() || '').trim();
  return {
    configuredWebAppUrl: configured,
    serviceUrl: serviceUrl,
    canonicalWebAppUrl: canonicalWebAppUrl_(),
    configuredLooksPublic:
      /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(configured),
    activeEmail: String(Session.getActiveUser().getEmail() || '').trim().toLowerCase(),
    effectiveEmail: String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase()
  };
}

function decodeIdentityToken_() {
  try {
    const token = ScriptApp.getIdentityToken();
    if (!token) return {};
    const parts = String(token).split('.');
    if (parts.length < 2) return {};
    const decoded = Utilities.newBlob(
      Utilities.base64DecodeWebSafe(parts[1]),
      'application/json'
    ).getDataAsString();
    return JSON.parse(decoded || '{}');
  } catch (_) {
    return {};
  }
}

function getCurrentUser() {
  // ActiveUser mới là người đang mở Web App. EffectiveUser có thể là chủ project
  // nếu deployment chạy "Execute as me", vì vậy tuyệt đối không chặn app chỉ vì hai email khác nhau.
  const sessionEmail = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();

  const identity = decodeIdentityToken_();
  const tokenEmail = String(identity.email || '').trim().toLowerCase();
  const name = String(identity.name || '').trim();
  const picture = String(identity.picture || '').trim();

  // Ưu tiên email của người truy cập. Chỉ khi Google không trả ActiveUser mới dùng email từ token.
  const email = sessionEmail || tokenEmail;
  if (!email) {
    // Không làm app chết. Dùng khóa tạm riêng theo người truy cập để tránh trộn hồ sơ.
    const temporaryKey = String(Session.getTemporaryActiveUserKey() || '').trim();
    return {
      userId: 'temp:' + temporaryKey,
      provider: 'google',
      email: '',
      name: '',
      displayName: '',
      picture: ''
    };
  }

  // Chỉ nhận tên/ảnh nếu token thuộc đúng người đang truy cập.
  const sameAccount = !tokenEmail || tokenEmail === email;

  return {
    userId: 'email:' + email,
    provider: 'google',
    email: email,
    name: sameAccount ? name : '',
    displayName: sameAccount ? name : '',
    picture: sameAccount ? picture : '',
    executionEmail: effectiveEmail
  };
}

function refreshGoogleIdentity() {
  return getCurrentUser();
}


// ===== ADMIN / USER REGISTRY =====
// Quyền admin KHÔNG dựa vào đường dẫn bí mật. Đường dẫn chỉ để giấu giao diện;
// kiểm tra thật sự luôn nằm ở server-side bằng ADMIN_EMAILS trong Script Properties.
function adminEmails_() {
  const raw = String(
    PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS') || ''
  ).toLowerCase();
  return raw.split(/[;,\n\r\s]+/).map(s => s.trim()).filter(Boolean);
}

function isAdminUser_(user) {
  const email = String(user && user.email || '').trim().toLowerCase();
  return Boolean(email) && adminEmails_().indexOf(email) !== -1;
}

function assertAdmin_() {
  const user = getCurrentUser();
  if (!isAdminUser_(user)) throw new Error('Không có quyền truy cập.');
  return user;
}

function userRegistryKey_(email) {
  return 'USER_REGISTRY_' + hashId_(String(email || '').trim().toLowerCase());
}

function registerUserVisit_(user) {
  const email = String(user && user.email || '').trim().toLowerCase();
  if (!email) return;

  const props = PropertiesService.getScriptProperties();
  const key = userRegistryKey_(email);
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const now = new Date().toISOString();
    let saved = {};
    try { saved = JSON.parse(props.getProperty(key) || '{}'); } catch (_) {}

    const name = String(user.name || user.displayName || '').trim();
    const picture = String(user.picture || '').trim();
    const record = {
      email: email,
      name: name || String(saved.name || ''),
      picture: picture || String(saved.picture || ''),
      firstSeen: saved.firstSeen || now,
      lastSeen: now,
      visits: Math.max(0, Number(saved.visits || 0)) + 1
    };
    props.setProperty(key, JSON.stringify(record));
  } finally {
    lock.releaseLock();
  }
}

function getAdminDashboard() {
  const admin = assertAdmin_();
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  const now = Date.now();
  const PROFILE_FIELDS = [
    'person_name','person_gender','person_dob','person_pob','person_hometown',
    'person_ethnicity','person_position','person_work_unit','person_address',
    'person_office_phone','person_home_phone','person_mobile_phone','person_fax',
    'person_email','person_citizen_id','person_date_issue','person_place_issue'
  ];

  const byEmail = {};

  Object.keys(all).forEach(key => {
    if (key.indexOf('USER_REGISTRY_') !== 0) return;
    try {
      const record = JSON.parse(all[key] || '{}');
      const email = String(record.email || '').trim().toLowerCase();
      if (email) byEmail[email] = record;
    } catch (_) {}
  });

  // Backfill những tài khoản local cũ còn lưu email để dashboard không mất dấu.
  Object.keys(all).forEach(key => {
    if (key.indexOf('AUTH_USER_') !== 0) return;
    try {
      const record = JSON.parse(all[key] || '{}');
      const email = String(record.email || '').trim().toLowerCase();
      if (!email) return;
      if (!byEmail[email]) {
        byEmail[email] = {
          email: email,
          name: String(record.name || ''),
          picture: '',
          firstSeen: '',
          lastSeen: '',
          visits: 0
        };
      }
    } catch (_) {}
  });

  const users = Object.keys(byEmail).map(email => {
    const record = byEmail[email];
    const profileBase = 'PROFILE_V3_' + hashId_('email:' + email);
    let general = {};
    try { general = JSON.parse(all[profileBase] || '{}'); } catch (_) {}

    const filled = PROFILE_FIELDS.reduce((count, field) => {
      const value = general[field];
      if (value === 0 || value === false) return count + 1;
      return String(value == null ? '' : value).trim() ? count + 1 : count;
    }, 0);

    const completion = Math.round((filled / PROFILE_FIELDS.length) * 100);
    const tablesMeta = all[profileBase + '_TABLES'];
    const lastSeenMs = record.lastSeen ? new Date(record.lastSeen).getTime() : 0;

    return {
      email: email,
      accountName: String(record.name || ''),
      profileName: String(general.person_name || ''),
      firstSeen: String(record.firstSeen || ''),
      lastSeen: String(record.lastSeen || ''),
      visits: Number(record.visits || 0),
      completion: completion,
      filledFields: filled,
      totalFields: PROFILE_FIELDS.length,
      hasProfile: Boolean(all[profileBase]),
      hasAcademicData: Boolean(tablesMeta),
      active7d: Boolean(lastSeenMs && now - lastSeenMs <= 7 * 24 * 60 * 60 * 1000),
      active30d: Boolean(lastSeenMs && now - lastSeenMs <= 30 * 24 * 60 * 60 * 1000)
    };
  }).sort((a,b) => String(b.lastSeen).localeCompare(String(a.lastSeen)));

  return {
    ok: true,
    admin: {
      email: String(admin.email || ''),
      name: String(admin.name || admin.displayName || '')
    },
    generatedAt: new Date().toISOString(),
    stats: {
      totalUsers: users.length,
      active7d: users.filter(u => u.active7d).length,
      active30d: users.filter(u => u.active30d).length,
      profilesCreated: users.filter(u => u.hasProfile).length,
      academicDataUsers: users.filter(u => u.hasAcademicData).length
    },
    users: users
  };
}

function profileKey_(token) {
  const user = token ? localSession_(token) : getCurrentUser();
  return 'PROFILE_V3_' + hashId_(user.userId);
}

// Hồ sơ cá nhân được lưu theo người dùng trong ứng dụng, không đồng bộ Drive/Sheets.
function saveGeneral(data, token) {
  const key = profileKey_(token);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Hồ sơ không hợp lệ.');
  const clean = {};
  Object.keys(data).forEach(key => {
    if (/^person_[a-z_]+$/.test(key)) clean[key] = String(data[key] == null ? '' : data[key]);
  });
  const json = JSON.stringify(clean);
  if (Utilities.newBlob(json).getBytes().length > 8500) throw new Error('Thông tin cá nhân quá dài.');
  PropertiesService.getScriptProperties().setProperty(key, json);
  return {ok:true};
}
function loadGeneral(token) {
  const key = profileKey_(token);
  const raw = PropertiesService.getScriptProperties().getProperty(key);
  const data = raw ? JSON.parse(raw) : {};
  const user = token ? localSession_(token) : getCurrentUser();

  registerUserVisit_(user);

  // Tên tài khoản độc lập với trường Họ và tên trong hồ sơ khoa học.
  return {ok:true, user:user, data:data};
}

/**
 * Tìm metadata bài báo ở phía Apps Script để tránh lỗi CORS trên trình duyệt.
 */
function searchPublications(query, page, rows, token) {
  profileKey_(token);

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

function assertSignedIn_() {
  const user = getCurrentUser();
  if (!user.email && !user.temporaryKey) {
    throw new Error('Không xác định được phiên người dùng Google.');
  }
}

function saveTables(data,token) {
  const key=profileKey_(token)+'_TABLES',props=PropertiesService.getScriptProperties();
  if(!data || typeof data!=='object' || Array.isArray(data)) throw new Error('Các mục hồ sơ không hợp lệ.');
  const allowed=['teachingBody','researchBody','credentialBody','languageBody','workBody','projectBody','articleBody','seminarBody','textbookBody','awardBody'];
  const clean={};allowed.forEach(k=>{if(Array.isArray(data[k])) clean[k]=data[k];});
  const encoded=Utilities.base64Encode(Utilities.newBlob(JSON.stringify(clean)).getBytes());
  if(encoded.length>180000) throw new Error('Hồ sơ quá lớn để lưu.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const version=Utilities.getUuid(),parts=Math.ceil(encoded.length/8000),values={};
    for(let i=0;i<parts;i++) values[key+'_'+version+'_'+i]=encoded.slice(i*8000,(i+1)*8000);
    props.setProperties(values);
    const old=JSON.parse(props.getProperty(key)||'null');
    props.setProperty(key,JSON.stringify({version:version,parts:parts}));
    if(old) for(let i=0;i<old.parts;i++) props.deleteProperty(key+'_'+old.version+'_'+i);
  } finally {lock.releaseLock();}
  return {ok:true};
}
function loadTables(token) {
  const key=profileKey_(token)+'_TABLES',props=PropertiesService.getScriptProperties();
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const meta=JSON.parse(props.getProperty(key)||'null');if(!meta) return {ok:true,data:{}};
    let raw='';for(let i=0;i<meta.parts;i++) {const part=props.getProperty(key+'_'+meta.version+'_'+i);if(part===null) throw new Error('Dữ liệu hồ sơ chưa đầy đủ.');raw+=part;}
    return {ok:true,data:JSON.parse(Utilities.newBlob(Utilities.base64Decode(raw)).getDataAsString())};
  } finally {lock.releaseLock();}
}
