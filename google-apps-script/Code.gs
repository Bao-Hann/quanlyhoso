/**
 * Scientist Profile - Google Apps Script edition
 *
 * Multi-account safe architecture:
 * - Web app executes as deployer and is publicly reachable.
 * - Google account selection is handled by OAuth 2.0 with prompt=select_account.
 * - User session is a signed stateless token (no dynamic Script Properties).
 * - User/profile data is stored in the configured Drive folder (UPLOAD_FOLDER_ID).
 */

const APP_TITLE = 'Scientist Profile';

function appConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    webAppUrl: String(props.getProperty('WEB_APP_URL') || '').trim(),
    uploadFolderId: String(props.getProperty('UPLOAD_FOLDER_ID') || '').trim(),
    googleClientId: String(props.getProperty('GOOGLE_CLIENT_ID') || '').trim(),
    googleClientSecret: String(props.getProperty('GOOGLE_CLIENT_SECRET') || '').trim(),
    adminEmails: String(props.getProperty('ADMIN_EMAILS') || '').trim()
  };
}

function canonicalWebAppUrl_() {
  const config = appConfig_();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.webAppUrl)) {
    throw new Error('WEB_APP_URL chưa đúng định dạng deployment /macros/s/.../exec.');
  }
  return config.webAppUrl;
}

function doGet(e) {
  const params = (e && e.parameter) || {};

  if (params.code || params.error) {
    try {
      return completeGoogleOAuth_(params);
    } catch (err) {
      return renderLogin_('Đăng nhập Google thất bại: ' + String(err.message || err));
    }
  }

  const page = String(params.page || 'login').toLowerCase();

  if (page === 'diag') return renderDeploymentDiagnostic_();

  if (page === 'admin') {
    const t = HtmlService.createTemplateFromFile('Admin');
    t.webAppUrl = canonicalWebAppUrl_();
    return t.evaluate()
      .setTitle('Admin Dashboard - ' + APP_TITLE)
      .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png');
  }

  if (page === 'app' || page === 'home') {
    const t = HtmlService.createTemplateFromFile('Index');
    t.userJson = JSON.stringify({provider:'local'}).replace(/</g, '\\u003c');
    t.authTokenJson = JSON.stringify('');
    t.webAppUrlJson = JSON.stringify(canonicalWebAppUrl_());
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
  t.googleOAuthUrl = googleOAuthStartUrl_();
  return t.evaluate().setTitle('Đăng nhập - ' + APP_TITLE);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getWebAppUrl() {
  return canonicalWebAppUrl_();
}

function googleOAuthStartUrl_() {
  const config = appConfig_();
  if (!config.googleClientId || !config.googleClientSecret) {
    throw new Error('Chưa cấu hình GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.');
  }

  const state = createOAuthState_();
  const params = {
    client_id: config.googleClientId,
    redirect_uri: canonicalWebAppUrl_(),
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    access_type: 'online',
    include_granted_scopes: 'true',
    state: state
  };

  return 'https://accounts.google.com/o/oauth2/v2/auth?' +
    Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
}

function completeGoogleOAuth_(params) {
  if (params.error) throw new Error('Google không hoàn tất đăng nhập: ' + params.error);

  const code = String(params.code || '').trim();
  const state = String(params.state || '').trim();
  if (!code || !state) throw new Error('Phản hồi OAuth không hợp lệ.');
  verifyOAuthState_(state);

  const config = appConfig_();
  const tokenResponse = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: {
      code: code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: canonicalWebAppUrl_(),
      grant_type: 'authorization_code'
    },
    muteHttpExceptions: true
  });

  if (tokenResponse.getResponseCode() !== 200) {
    throw new Error('Không đổi được mã đăng nhập Google.');
  }

  const tokens = JSON.parse(tokenResponse.getContentText() || '{}');
  const accessToken = String(tokens.access_token || '').trim();
  if (!accessToken) throw new Error('Google không trả access token.');

  const profileResponse = UrlFetchApp.fetch(
    'https://openidconnect.googleapis.com/v1/userinfo',
    {
      headers: {Authorization: 'Bearer ' + accessToken},
      muteHttpExceptions: true
    }
  );

  if (profileResponse.getResponseCode() !== 200) {
    throw new Error('Không đọc được hồ sơ Google.');
  }

  const profile = JSON.parse(profileResponse.getContentText() || '{}');
  const email = String(profile.email || '').trim().toLowerCase();
  const name = String(profile.name || '').trim();
  const picture = String(profile.picture || '').trim();
  const sub = String(profile.sub || '').trim();

  if (!email) throw new Error('Google không trả email.');

  const user = {
    userId: 'email:' + email,
    googleSub: sub,
    provider: 'google',
    email: email,
    name: name,
    displayName: name,
    picture: picture
  };

  upsertUserLogin_(user);

  const session = createAppSession_(user);
  const t = HtmlService.createTemplateFromFile('Index');
  t.userJson = JSON.stringify(session.user).replace(/</g, '\\u003c');
  t.authTokenJson = JSON.stringify(session.token);
  t.webAppUrlJson = JSON.stringify(canonicalWebAppUrl_());

  return t.evaluate()
    .setTitle(APP_TITLE)
    .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png');
}

// ===== DRIVE STORAGE =====

function dataFolder_() {
  const id = appConfig_().uploadFolderId;
  if (!id) throw new Error('Chưa cấu hình UPLOAD_FOLDER_ID.');
  return DriveApp.getFolderById(id);
}

function userFileName_(email) {
  return 'scientist_user_' + hashId_(String(email || '').trim().toLowerCase()) + '.json';
}

function readUserDocByEmail_(email) {
  const folder = dataFolder_();
  const name = userFileName_(email);
  const files = folder.getFilesByName(name);
  if (!files.hasNext()) return null;

  const file = files.next();
  try {
    return JSON.parse(file.getBlob().getDataAsString() || '{}');
  } catch (_) {
    throw new Error('Dữ liệu người dùng bị lỗi định dạng.');
  }
}

function writeUserDoc_(doc) {
  const email = String(doc && doc.identity && doc.identity.email || '').trim().toLowerCase();
  if (!email) throw new Error('Không xác định được email người dùng.');

  const folder = dataFolder_();
  const name = userFileName_(email);
  const json = JSON.stringify(doc);
  const files = folder.getFilesByName(name);

  if (files.hasNext()) {
    files.next().setContent(json);
  } else {
    folder.createFile(name, json, MimeType.PLAIN_TEXT);
  }
}

function emptyUserDoc_(user) {
  const now = new Date().toISOString();
  return {
    version: 1,
    identity: {
      email: String(user.email || '').trim().toLowerCase(),
      name: String(user.name || user.displayName || '').trim(),
      picture: String(user.picture || '').trim(),
      googleSub: String(user.googleSub || '').trim()
    },
    meta: {
      firstSeen: now,
      lastSeen: now,
      visits: 0
    },
    general: {},
    tables: {}
  };
}

function upsertUserLogin_(user) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let doc = readUserDocByEmail_(user.email) || emptyUserDoc_(user);
    const now = new Date().toISOString();

    doc.identity = doc.identity || {};
    doc.identity.email = String(user.email || '').trim().toLowerCase();
    doc.identity.name = String(user.name || user.displayName || doc.identity.name || '').trim();
    doc.identity.picture = String(user.picture || doc.identity.picture || '').trim();
    doc.identity.googleSub = String(user.googleSub || doc.identity.googleSub || '').trim();

    doc.meta = doc.meta || {};
    doc.meta.firstSeen = doc.meta.firstSeen || now;
    doc.meta.lastSeen = now;
    doc.meta.visits = Math.max(0, Number(doc.meta.visits || 0)) + 1;

    doc.general = doc.general || {};
    doc.tables = doc.tables || {};

    writeUserDoc_(doc);
  } finally {
    lock.releaseLock();
  }
}

function sessionUser_(token) {
  return localSession_(token);
}

function saveGeneral(data, token) {
  const user = sessionUser_(token);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Hồ sơ không hợp lệ.');

  const clean = {};
  Object.keys(data).forEach(key => {
    if (/^person_[a-z_]+$/.test(key)) clean[key] = String(data[key] == null ? '' : data[key]);
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const doc = readUserDocByEmail_(user.email) || emptyUserDoc_(user);
    doc.identity = doc.identity || {};
    doc.identity.email = user.email;
    doc.identity.name = user.name || doc.identity.name || '';
    doc.identity.picture = user.picture || doc.identity.picture || '';
    doc.general = clean;
    doc.meta = doc.meta || {};
    doc.meta.lastSeen = new Date().toISOString();
    doc.tables = doc.tables || {};
    writeUserDoc_(doc);
  } finally {
    lock.releaseLock();
  }

  return {ok:true};
}

function loadGeneral(token) {
  const user = sessionUser_(token);
  const doc = readUserDocByEmail_(user.email) || emptyUserDoc_(user);
  return {ok:true, user:user, data:doc.general || {}};
}

function saveTables(data, token) {
  const user = sessionUser_(token);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Các mục hồ sơ không hợp lệ.');
  }

  const allowed = [
    'teachingBody','researchBody','credentialBody','languageBody','workBody',
    'projectBody','articleBody','seminarBody','textbookBody','awardBody'
  ];
  const clean = {};
  allowed.forEach(k => { if (Array.isArray(data[k])) clean[k] = data[k]; });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const doc = readUserDocByEmail_(user.email) || emptyUserDoc_(user);
    doc.tables = clean;
    doc.general = doc.general || {};
    doc.meta = doc.meta || {};
    doc.meta.lastSeen = new Date().toISOString();
    writeUserDoc_(doc);
  } finally {
    lock.releaseLock();
  }

  return {ok:true};
}

function loadTables(token) {
  const user = sessionUser_(token);
  const doc = readUserDocByEmail_(user.email) || emptyUserDoc_(user);
  return {ok:true, data:doc.tables || {}};
}

// ===== ADMIN =====

function adminEmails_() {
  return appConfig_().adminEmails
    .toLowerCase()
    .split(/[;,\n\r\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function assertAdmin_(token) {
  const user = sessionUser_(token);
  const email = String(user.email || '').trim().toLowerCase();
  if (!email || adminEmails_().indexOf(email) === -1) {
    throw new Error('Không có quyền truy cập.');
  }
  return user;
}

function getAdminDashboard(token) {
  const admin = assertAdmin_(token);
  const folder = dataFolder_();
  const files = folder.getFiles();
  const users = [];
  const now = Date.now();

  const PROFILE_FIELDS = [
    'person_name','person_gender','person_dob','person_pob','person_hometown',
    'person_ethnicity','person_position','person_work_unit','person_address',
    'person_office_phone','person_home_phone','person_mobile_phone','person_fax',
    'person_email','person_citizen_id','person_date_issue','person_place_issue'
  ];

  while (files.hasNext()) {
    const file = files.next();
    if (!/^scientist_user_[a-f0-9]+\.json$/i.test(file.getName())) continue;

    let doc;
    try {
      doc = JSON.parse(file.getBlob().getDataAsString() || '{}');
    } catch (_) {
      continue;
    }

    const identity = doc.identity || {};
    const meta = doc.meta || {};
    const general = doc.general || {};
    const tables = doc.tables || {};

    const email = String(identity.email || '').trim().toLowerCase();
    if (!email) continue;

    const filled = PROFILE_FIELDS.reduce((count, field) => {
      const value = general[field];
      if (value === 0 || value === false) return count + 1;
      return String(value == null ? '' : value).trim() ? count + 1 : count;
    }, 0);

    const lastSeenMs = meta.lastSeen ? new Date(meta.lastSeen).getTime() : 0;
    const hasAcademicData = Object.keys(tables).some(k => Array.isArray(tables[k]) && tables[k].length);

    users.push({
      email: email,
      accountName: String(identity.name || ''),
      profileName: String(general.person_name || ''),
      firstSeen: String(meta.firstSeen || ''),
      lastSeen: String(meta.lastSeen || ''),
      visits: Number(meta.visits || 0),
      completion: Math.round((filled / PROFILE_FIELDS.length) * 100),
      filledFields: filled,
      totalFields: PROFILE_FIELDS.length,
      hasProfile: Object.keys(general).length > 0,
      hasAcademicData: hasAcademicData,
      active7d: Boolean(lastSeenMs && now - lastSeenMs <= 7 * 24 * 60 * 60 * 1000),
      active30d: Boolean(lastSeenMs && now - lastSeenMs <= 30 * 24 * 60 * 60 * 1000)
    });
  }

  users.sort((a,b) => String(b.lastSeen).localeCompare(String(a.lastSeen)));

  return {
    ok:true,
    admin:{email:admin.email,name:admin.name || admin.displayName || ''},
    generatedAt:new Date().toISOString(),
    stats:{
      totalUsers:users.length,
      active7d:users.filter(u=>u.active7d).length,
      active30d:users.filter(u=>u.active30d).length,
      profilesCreated:users.filter(u=>u.hasProfile).length,
      academicDataUsers:users.filter(u=>u.hasAcademicData).length
    },
    users:users
  };
}

// ===== PUBLICATION SEARCH =====

function searchPublications(query, page, rows, token) {
  sessionUser_(token);

  query = String(query || '').trim();
  if (!query) return {items:[],total:0,page:1};

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
    muteHttpExceptions:true,
    headers:{Accept:'application/json'}
  });

  const responseCode = response.getResponseCode();
  if (responseCode < 200 || responseCode >= 300) {
    throw new Error('Không lấy được dữ liệu bài báo (HTTP ' + responseCode + ').');
  }

  const data = JSON.parse(response.getContentText());

  if (doi) {
    return {
      items:data && data.message ? [normalizePublication_(data.message)] : [],
      total:data && data.message ? 1 : 0,
      page:1,
      exactDoi:true
    };
  }

  const message = data.message || {};
  return {
    items:(message.items || []).map(normalizePublication_),
    total:Number(message['total-results'] || 0),
    page:page,
    exactDoi:false
  };
}

function normalizePublication_(item) {
  const authors = (item.author || []).map(author =>
    [author.given || '', author.family || ''].filter(Boolean).join(' ')
  ).filter(Boolean).join(', ');

  const dates = [
    item['published-print'], item['published-online'], item.published,
    item.issued, item.created
  ];

  let year = '';
  for (let i=0;i<dates.length;i++) {
    const parts = dates[i] && dates[i]['date-parts'];
    if (parts && parts[0] && parts[0][0]) {
      year = parts[0][0];
      break;
    }
  }

  return {
    title:Array.isArray(item.title) ? (item.title[0] || '') : (item.title || ''),
    authors:authors,
    year:year,
    issn:Array.isArray(item.ISSN) ? item.ISSN.join(', ') : (item.ISSN || ''),
    journal:Array.isArray(item['container-title']) ? (item['container-title'][0] || '') : (item['container-title'] || ''),
    doi:item.DOI || '',
    url:item.URL || (item.DOI ? 'https://doi.org/' + item.DOI : ''),
    publisher:item.publisher || '',
    type:item.type || ''
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

// ===== DIAGNOSTIC =====

function renderDeploymentDiagnostic_() {
  const config = appConfig_();
  const html = [
    '<!doctype html><html><head><meta charset="utf-8"><title>Deployment Diagnostic</title></head><body>',
    '<h2>Deployment Diagnostic</h2>',
    '<p><b>Build:</b> AUTH-MULTI-ACCOUNT-01-20261008</p>',
    '<p><b>WEB_APP_URL:</b> '+config.webAppUrl+'</p>',
    '<p><b>Client ID configured:</b> '+Boolean(config.googleClientId)+'</p>',
    '<p><b>Client Secret configured:</b> '+Boolean(config.googleClientSecret)+'</p>',
    '<p><b>UPLOAD_FOLDER_ID configured:</b> '+Boolean(config.uploadFolderId)+'</p>',
    '</body></html>'
  ].join('');
  return HtmlService.createHtmlOutput(html).setTitle('Deployment Diagnostic');
}
