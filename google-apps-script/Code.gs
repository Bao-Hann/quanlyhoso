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
  const params = (e && e.parameter) || {};

  // Google OAuth callback now returns directly to the deployed /exec URL.
  if (params.code || params.error) {
    try {
      return completeGoogleOAuthFromExec_(params);
    } catch (err) {
      return renderLogin_('Đăng nhập Google thất bại: ' + String(err.message || err));
    }
  }

  const page = String(params.page || 'login').toLowerCase();

  if (page === 'oauthdebug') return renderOAuthDebug_();

  if (page === 'oauthcomplete') {
    return renderOAuthHandoff_(String(params.handoff || ''));
  }

  if (page === 'app' || page === 'home') {
    const localMode = params.mode === 'local';
    if (!localMode) return renderLogin_('Hãy đăng nhập để mở hồ sơ.');

    const t = HtmlService.createTemplateFromFile('Index');
    t.userJson = JSON.stringify({provider:'local'}).replace(/</g, '\\u003c');
    return t.evaluate()
      .setTitle(APP_TITLE)
      .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png');
  }

  return renderLogin_('');
}

function googleOAuthConfig_() {
  const props=PropertiesService.getScriptProperties();
  return {
    clientId:String(props.getProperty('GOOGLE_OAUTH_CLIENT_ID') || '').trim(),
    clientSecret:String(props.getProperty('GOOGLE_OAUTH_CLIENT_SECRET') || '').trim()
  };
}

function googleOAuthCallbackUrl_() {
  // Dùng đúng URL Web App đã khai báo trong Google Cloud để tránh redirect_uri_mismatch.
  return 'https://script.google.com/macros/s/AKfycbwdHS77PfHP8CHtLk2eCULLoEPFD7YfHBQkUEI_bnt6QQeD_9gPYog9vUGj58XZltS33w/exec';
}

function getOAuthDebugInfo() {
  const config=googleOAuthConfig_();
  return {
    callbackUrl:googleOAuthCallbackUrl_(),
    clientIdConfigured:Boolean(config.clientId),
    clientSecretConfigured:Boolean(config.clientSecret),
    startUrl:googleOAuthStartUrl_()
  };
}

function googleOAuthStartUrl_() {
  const config=googleOAuthConfig_();
  const redirectUri=googleOAuthCallbackUrl_();
  if(!config.clientId || !config.clientSecret || !redirectUri) return '';

  const state=Utilities.getUuid()+Utilities.getUuid();
  CacheService.getScriptCache().put(
    'GOOGLE_OAUTH_STATE_'+hashId_(state),
    '1',
    600
  );

  const params={
    client_id:config.clientId,
    redirect_uri:redirectUri,
    response_type:'code',
    scope:'openid email profile',
    prompt:'select_account',
    access_type:'online',
    include_granted_scopes:'true',
    state:state
  };

  return 'https://accounts.google.com/o/oauth2/v2/auth?' +
    Object.keys(params)
      .map(k=>encodeURIComponent(k)+'='+encodeURIComponent(params[k]))
      .join('&');
}

function renderOAuthDebug_() {
  const config=googleOAuthConfig_();
  const callback=googleOAuthCallbackUrl_();
  const serviceUrl=ScriptApp.getService().getUrl() || '';
  const safeClientId=String(config.clientId || '');
  const html=[
    '<!doctype html><html><head><meta charset="utf-8"><title>OAuth Debug</title>',
    '<style>body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;line-height:1.6}code{word-break:break-all;background:#f4f4f4;padding:2px 6px;border-radius:4px}.ok{color:#087a38}.bad{color:#b42318}</style>',
    '</head><body>',
    '<h2>Kiểm tra Google OAuth</h2>',
    '<p><b>Callback đang gửi:</b><br><code>'+callback+'</code></p>',
    '<p><b>Web App URL Apps Script trả về:</b><br><code>'+serviceUrl+'</code></p>',
    '<p><b>Client ID đang dùng:</b><br><code>'+safeClientId+'</code></p>',
    '<p><b>Client Secret:</b> '+(config.clientSecret?'<span class="ok">đã cấu hình</span>':'<span class="bad">chưa cấu hình</span>')+'</p>',
    '<p>Hãy so sánh Client ID ở đây với Client ID trong Google Cloud → Google Auth Platform → Clients.</p>',
    '</body></html>'
  ].join('');
  return HtmlService.createHtmlOutput(html).setTitle('OAuth Debug - '+APP_TITLE);
}

function renderLogin_(message) {
  const t = HtmlService.createTemplateFromFile('Login');
  t.message = message || '';
  t.webAppUrl = ScriptApp.getService().getUrl() || '';
  t.googleOAuthUrl = googleOAuthStartUrl_();
  t.googleOAuthReady = Boolean(t.googleOAuthUrl);
  return t.evaluate().setTitle('Đăng nhập - ' + APP_TITLE);
}

function accountIdentityKey_(email) {
  return 'ACCOUNT_IDENTITY_' + hashId_(String(email || '').trim().toLowerCase());
}

function completeGoogleOAuthFromExec_(params) {
  if(params.error) throw new Error('Google không hoàn tất đăng nhập: ' + params.error);

  const code=String(params.code || '').trim();
  const state=String(params.state || '').trim();
  if(!code || !state) throw new Error('Phản hồi đăng nhập Google không hợp lệ.');

  const cache=CacheService.getScriptCache();
  const stateKey='GOOGLE_OAUTH_STATE_'+hashId_(state);
  if(cache.get(stateKey)!=='1') {
    throw new Error('Phiên đăng nhập Google đã hết hạn hoặc không hợp lệ. Hãy thử đăng nhập lại.');
  }
  cache.remove(stateKey);

  const config=googleOAuthConfig_();
  if(!config.clientId || !config.clientSecret) throw new Error('Chưa cấu hình Google OAuth.');

  const redirectUri=googleOAuthCallbackUrl_();
  const tokenResponse=UrlFetchApp.fetch('https://oauth2.googleapis.com/token',{
    method:'post',
    payload:{
      code:code,
      client_id:config.clientId,
      client_secret:config.clientSecret,
      redirect_uri:redirectUri,
      grant_type:'authorization_code'
    },
    muteHttpExceptions:true
  });

  if(tokenResponse.getResponseCode()!==200) {
    throw new Error('Không đổi được mã đăng nhập Google.');
  }

  const tokens=JSON.parse(tokenResponse.getContentText() || '{}');
  const accessToken=String(tokens.access_token || '').trim();
  if(!accessToken) throw new Error('Google không trả mã truy cập.');

  const profileResponse=UrlFetchApp.fetch(
    'https://openidconnect.googleapis.com/v1/userinfo',
    {
      headers:{Authorization:'Bearer '+accessToken},
      muteHttpExceptions:true
    }
  );

  if(profileResponse.getResponseCode()!==200) {
    throw new Error('Không đọc được hồ sơ Google.');
  }

  const profile=JSON.parse(profileResponse.getContentText() || '{}');
  const email=String(profile.email || '').trim().toLowerCase();
  const name=String(profile.name || '').trim();
  const picture=String(profile.picture || '').trim();
  const sub=String(profile.sub || '').trim();

  if(!email) throw new Error('Google không trả địa chỉ email.');
  if(!name) throw new Error('Google không trả tên tài khoản.');

  const user={
    userId:'email:'+email,
    googleSub:sub,
    provider:'google',
    email:email,
    name:name,
    displayName:name,
    picture:picture
  };

  PropertiesService.getScriptProperties().setProperty(
    accountIdentityKey_(email),
    JSON.stringify({email:email,name:name,picture:picture,source:'google'})
  );

  const session=createAppSession_(user);
  const handoff=Utilities.getUuid()+Utilities.getUuid();
  cache.put('GOOGLE_HANDOFF_'+hashId_(handoff),JSON.stringify(session),120);

  const target=(ScriptApp.getService().getUrl() || '') +
    '?page=oauthcomplete&handoff=' + encodeURIComponent(handoff);

  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><base target="_top"><meta charset="utf-8">'+
    '<title>Đang đăng nhập...</title></head><body>'+
    '<p>Đang hoàn tất đăng nhập Google...</p>'+
    '<script>window.top.location.replace(' + JSON.stringify(target) + ');<\\/script>'+
    '</body></html>'
  ).setTitle('Đang đăng nhập - '+APP_TITLE);
}

function renderOAuthHandoff_(handoff) {
  handoff=String(handoff || '').trim();
  if(!handoff) return renderLogin_('Phiên đăng nhập Google không hợp lệ.');

  const cache=CacheService.getScriptCache();
  const key='GOOGLE_HANDOFF_'+hashId_(handoff);
  const raw=cache.get(key);
  cache.remove(key);
  if(!raw) return renderLogin_('Phiên đăng nhập Google đã hết hạn. Hãy thử lại.');

  const session=JSON.parse(raw);
  const appUrl=(ScriptApp.getService().getUrl() || '')+'?page=app&mode=local';
  const payload=JSON.stringify(session).replace(/</g,'\\u003c');

  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><base target="_top"><meta charset="utf-8">'+
    '<title>Đang mở hồ sơ...</title></head><body>'+
    '<p>Đang mở hồ sơ...</p>'+
    '<script>'+
    'try{sessionStorage.setItem("scientist-local-session",JSON.stringify('+payload+'));}catch(e){};'+
    'window.top.location.replace('+JSON.stringify(appUrl)+');'+
    '<\\/script></body></html>'
  ).setTitle('Đang mở hồ sơ - '+APP_TITLE);
}

function getGoogleOAuthSetupInfo() {
  return {
    redirectUri:googleOAuthCallbackUrl_(),
    webAppUrl:ScriptApp.getService().getUrl() || '',
    requiredScriptProperties:[
      'GOOGLE_OAUTH_CLIENT_ID',
      'GOOGLE_OAUTH_CLIENT_SECRET'
    ]
  };
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
