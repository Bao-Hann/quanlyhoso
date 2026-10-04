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
    const user = getCurrentUser();
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
  const temporaryKey = Session.getTemporaryActiveUserKey() || '';
  const props = PropertiesService.getUserProperties();
  let userId = props.getProperty('APP_USER_ID');
  if (!userId) { userId = Utilities.getUuid(); props.setProperty('APP_USER_ID', userId); }
  const name = email ? email.split('@')[0] : 'Người dùng Google';
  return {
    userId: userId,
    email: email,
    name: name,
    temporaryKey: temporaryKey
  };
}

// Hồ sơ cá nhân được lưu theo người dùng trong ứng dụng, không đồng bộ Drive/Sheets.
function saveGeneral(data) {
  assertSignedIn_();
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Hồ sơ không hợp lệ.');
  const clean = {};
  Object.keys(data).forEach(key => {
    if (/^person_[a-z_]+$/.test(key)) clean[key] = String(data[key] == null ? '' : data[key]);
  });
  const json = JSON.stringify(clean);
  if (Utilities.newBlob(json).getBytes().length > 8500) throw new Error('Thông tin cá nhân quá dài.');
  PropertiesService.getUserProperties().setProperty('GENERAL_PROFILE_V2', json);
  return {ok:true};
}
function loadGeneral() {
  assertSignedIn_();
  const raw = PropertiesService.getUserProperties().getProperty('GENERAL_PROFILE_V2');
  return {ok:true, data:raw ? JSON.parse(raw) : {}};
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

function assertSignedIn_() {
  const user = getCurrentUser();
  if (!user.email && !user.temporaryKey) {
    throw new Error('Không xác định được phiên người dùng Google.');
  }
}
