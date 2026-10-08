// Stateless signed sessions: no dynamic Script Properties.

function hashId_(value) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  ).map(b => ('0'+((b+256)%256).toString(16)).slice(-2)).join('');
}

function bytesToBase64WebSafe_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/,'');
}

function stringToBase64WebSafe_(value) {
  return bytesToBase64WebSafe_(Utilities.newBlob(String(value)).getBytes());
}

function base64WebSafeToString_(value) {
  return Utilities.newBlob(Utilities.base64DecodeWebSafe(String(value))).getDataAsString();
}

function signingSecret_() {
  const secret = String(
    PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_SECRET') || ''
  ).trim();
  if (!secret) throw new Error('Chưa cấu hình GOOGLE_CLIENT_SECRET.');
  return secret;
}

function signatureFor_(body) {
  const sig = Utilities.computeHmacSha256Signature(
    String(body),
    signingSecret_(),
    Utilities.Charset.UTF_8
  );
  return bytesToBase64WebSafe_(sig);
}

function constantTimeEqual_(a,b) {
  a=String(a||''); b=String(b||'');
  if(a.length!==b.length) return false;
  let diff=0;
  for(let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}

function issueSignedToken_(kind, payload, ttlSeconds) {
  const now = Math.floor(Date.now()/1000);
  const bodyObj = {
    k:kind,
    iat:now,
    exp:now+Math.max(60,Number(ttlSeconds||0)),
    n:Utilities.getUuid(),
    p:payload || {}
  };
  const body = stringToBase64WebSafe_(JSON.stringify(bodyObj));
  return body + '.' + signatureFor_(body);
}

function verifySignedToken_(token, expectedKind) {
  token=String(token||'');
  const parts=token.split('.');
  if(parts.length!==2) throw new Error('Phiên đăng nhập không hợp lệ.');

  const body=parts[0], sig=parts[1];
  if(!constantTimeEqual_(sig,signatureFor_(body))) {
    throw new Error('Phiên đăng nhập không hợp lệ.');
  }

  let data;
  try { data=JSON.parse(base64WebSafeToString_(body)); }
  catch (_) { throw new Error('Phiên đăng nhập không hợp lệ.'); }

  const now=Math.floor(Date.now()/1000);
  if(data.k!==expectedKind || !data.exp || Number(data.exp)<now) {
    throw new Error('Phiên đăng nhập đã hết hạn.');
  }
  return data.p || {};
}

function createOAuthState_() {
  return issueSignedToken_('oauth_state',{purpose:'google-login'},600);
}

function verifyOAuthState_(state) {
  return verifySignedToken_(state,'oauth_state');
}

function createAppSession_(user) {
  const safeUser = {
    userId:String(user.userId||''),
    googleSub:String(user.googleSub||''),
    provider:'google',
    email:String(user.email||'').trim().toLowerCase(),
    name:String(user.name||user.displayName||'').trim(),
    displayName:String(user.name||user.displayName||'').trim(),
    picture:String(user.picture||'').trim()
  };
  return {
    ok:true,
    token:issueSignedToken_('app_session',safeUser,6*60*60),
    user:safeUser
  };
}

function localSession_(token) {
  const user=verifySignedToken_(token,'app_session');
  if(!user.email) throw new Error('Phiên đăng nhập không hợp lệ.');
  return user;
}

function logoutLocal() {
  // Stateless token: logout chỉ cần xóa token ở trình duyệt.
  return {ok:true};
}

function registerLocal() {
  throw new Error('Đăng nhập bằng email/mật khẩu đã tắt.');
}

function loginLocal() {
  throw new Error('Đăng nhập bằng email/mật khẩu đã tắt.');
}
