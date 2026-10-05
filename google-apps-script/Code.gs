/**
 * Scientist Profile - Google Apps Script edition
 * Deploy as a Web App:
 *   Execute as: User deploying the web app
 *   Who has access: Anyone
 *
 * User identity is handled by Google Identity Services, not Apps Script Session.
 */

const APP_TITLE = 'Scientist Profile';

function doGet(e) {
  const page = String((e && e.parameter && e.parameter.page) || 'login').toLowerCase();

  if (page === 'app' || page === 'home') {
    const localMode = e && e.parameter && e.parameter.mode === "local";
    if (!localMode) return renderLogin_('Hãy đăng nhập để mở hồ sơ.');

    const t = HtmlService.createTemplateFromFile('Index');
    t.userJson = JSON.stringify({provider:'local'}).replace(/</g, '\\u003c');
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
  t.googleLoginClientId = googleLoginClientId_();
  t.googleLoginReady = Boolean(t.googleLoginClientId);
  return t.evaluate().setTitle('Đăng nhập - ' + APP_TITLE);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getWebAppUrl() {
  return ScriptApp.getService().getUrl() || '';
}

function accountIdentityKey_(email) {
  return 'ACCOUNT_IDENTITY_' + hashId_(String(email || '').trim().toLowerCase());
}

function googleLoginClientId_() {
  return String(
    PropertiesService.getScriptProperties().getProperty('GOOGLE_LOGIN_CLIENT_ID') || ''
  ).trim();
}

function verifyGoogleIdToken_(credential) {
  credential=String(credential || '').trim();
  if(!credential || credential.length>10000) throw new Error('Thông tin đăng nhập Google không hợp lệ.');

  const clientId=googleLoginClientId_();
  if(!clientId) throw new Error('Chưa cấu hình Google Login Client ID.');

  const response=UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(credential),
    {muteHttpExceptions:true}
  );
  if(response.getResponseCode()!==200) throw new Error('Không xác minh được tài khoản Google.');

  const claims=JSON.parse(response.getContentText() || '{}');
  if(String(claims.aud || '')!==clientId) throw new Error('Google token không thuộc ứng dụng này.');

  const issuer=String(claims.iss || '');
  if(issuer!=='accounts.google.com' && issuer!=='https://accounts.google.com') {
    throw new Error('Nguồn đăng nhập Google không hợp lệ.');
  }

  const exp=Number(claims.exp || 0);
  if(!exp || exp<Math.floor(Date.now()/1000)-30) throw new Error('Phiên Google đã hết hạn.');

  const verified=claims.email_verified===true || String(claims.email_verified || '').toLowerCase()==='true';
  const email=String(claims.email || '').trim().toLowerCase();
  if(!verified || !email) throw new Error('Email Google chưa được xác minh.');

  const name=String(
    claims.name ||
    [claims.given_name,claims.family_name].filter(Boolean).join(' ')
  ).trim();
  if(!name) throw new Error('Google không trả tên tài khoản.');

  return {
    sub:String(claims.sub || '').trim(),
    email:email,
    name:name,
    picture:String(claims.picture || '').trim()
  };
}

function inspectGoogleCredential(credential) {
  const profile=verifyGoogleIdToken_(credential);
  return {email:profile.email,name:profile.name,picture:profile.picture};
}

function loginGoogleCredential(credential) {
  const profile=verifyGoogleIdToken_(credential);
  const user={
    userId:'email:'+profile.email,
    googleSub:profile.sub,
    provider:'google',
    email:profile.email,
    name:profile.name,
    displayName:profile.name,
    picture:profile.picture
  };

  PropertiesService.getScriptProperties().setProperty(
    accountIdentityKey_(profile.email),
    JSON.stringify({
      email:profile.email,
      name:profile.name,
      picture:profile.picture,
      source:'google'
    })
  );

  return createAppSession_(user);
}

function profileKey_(token) {
  if(!token) throw new Error('Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại.');
  const user=localSession_(token);
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
  const user = localSession_(token);

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
