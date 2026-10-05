/**
 * Scientist Profile - Google Apps Script edition
 * Deploy as a Web App:
 *   Execute as: User accessing the web app
 *   Who has access: Anyone with a Google account
 */

const APP_TITLE = 'Scientist Profile';

function doGet(e) {
  const page = String((e && e.parameter && e.parameter.page) || 'login').toLowerCase();

  if (page === 'app' || page === 'home') {
    const user = e && e.parameter && e.parameter.mode === "local" ? {provider:"local"} : getCurrentUser();
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
  t.webAppUrl = ScriptApp.getService().getUrl() || '';

  // Luôn cho người dùng chọn tài khoản Google trước khi vào Web App.
  // Điều này tránh trường hợp trình duyệt đang đăng nhập nhiều Gmail và tự dùng sai tài khoản.
  const googleTarget = t.webAppUrl + '?page=app&google=1';
  t.googleAccountChooserUrl =
    'https://accounts.google.com/AccountChooser?service=lso&continue=' +
    encodeURIComponent(googleTarget);

  return t.evaluate().setTitle('Đăng nhập - ' + APP_TITLE);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getWebAppUrl() {
  return ScriptApp.getService().getUrl() || '';
}

// Identity comes from the Apps Script OpenID token of the effective user.
// This mirrors the original source architecture: the login session already carries
// name + email instead of trying to derive a display name from the email address.
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

function accountIdentityKey_(email) {
  return 'ACCOUNT_IDENTITY_' + hashId_(String(email || '').trim().toLowerCase());
}

function stableAccountIdentity_(email, googleName, googlePicture) {
  email = String(email || '').trim().toLowerCase();
  googleName = String(googleName || '').trim();
  googlePicture = String(googlePicture || '').trim();

  const props = PropertiesService.getScriptProperties();
  const key = accountIdentityKey_(email);
  let saved = {};
  try { saved = JSON.parse(props.getProperty(key) || '{}'); } catch (_) {}

  // Google là nguồn chuẩn cho tài khoản Google. Nếu lấy được tên thật,
  // luôn dùng nó và sửa mọi giá trị cũ từng bị lưu nhầm từ hồ sơ/manual.
  if (googleName) {
    const identity = {
      email: email,
      name: googleName,
      picture: googlePicture || String(saved.picture || '').trim(),
      source: 'google'
    };
    props.setProperty(key, JSON.stringify(identity));
    return {name:identity.name, picture:identity.picture};
  }

  // Chỉ tái sử dụng tên đã được xác nhận là đến từ Google.
  if (saved && saved.email === email && saved.source === 'google' && String(saved.name || '').trim()) {
    return {
      name: String(saved.name || '').trim(),
      picture: String(saved.picture || '').trim()
    };
  }

  return {name:'', picture:''};
}

function googleProfileForActiveUser_(email) {
  email = String(email || '').trim().toLowerCase();
  const effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();

  // ScriptApp.getOAuthToken() thuộc effective user.
  // Chỉ gọi userinfo khi effective user chính là người đang truy cập,
  // tránh lấy nhầm tên của chủ project.
  if (!email || effectiveEmail !== email) return {};

  try {
    const response = UrlFetchApp.fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {Authorization:'Bearer ' + ScriptApp.getOAuthToken()},
      muteHttpExceptions:true
    });
    if (response.getResponseCode() !== 200) return {};

    const profile = JSON.parse(response.getContentText() || '{}');
    const profileEmail = String(profile.email || '').trim().toLowerCase();
    if (profileEmail && profileEmail !== email) return {};

    return {
      email: profileEmail || email,
      name: String(profile.name || '').trim(),
      picture: String(profile.picture || '').trim()
    };
  } catch (_) {
    return {};
  }
}

function getCurrentUser() {
  const sessionEmail = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();

  const identity = decodeIdentityToken_();
  const tokenEmail = String(identity.email || '').trim().toLowerCase();
  const email = sessionEmail || tokenEmail;

  if (!email) {
    const temporaryKey = String(Session.getTemporaryActiveUserKey() || '').trim();
    return {
      userId:'temp:' + temporaryKey,
      provider:'google',
      email:'',
      name:'',
      displayName:'',
      picture:''
    };
  }

  // Nguồn 1: OpenID identity token của người dùng.
  let googleName = '';
  let googlePicture = '';
  if (!tokenEmail || tokenEmail === email) {
    googleName = String(identity.name || '').trim();
    googlePicture = String(identity.picture || '').trim();
  }

  // Nguồn 2: userinfo bằng OAuth token, nhưng chỉ khi deployment thực thi
  // dưới quyền chính người truy cập.
  if (!googleName) {
    const profile = googleProfileForActiveUser_(email);
    googleName = String(profile.name || '').trim();
    googlePicture = String(profile.picture || '').trim();
  }

  const accountIdentity = stableAccountIdentity_(email, googleName, googlePicture);

  return {
    userId:'email:' + email,
    provider:'google',
    email:email,
    name:accountIdentity.name,
    displayName:accountIdentity.name,
    picture:accountIdentity.picture,
    executionEmail:effectiveEmail
  };
}

function refreshGoogleIdentity() {
  return getCurrentUser();
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

  // Tuyệt đối không dùng person_name để sửa tên tài khoản.
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
