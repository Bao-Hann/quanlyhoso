// Các hàm nội bộ kết thúc bằng dấu _ nên không gọi được từ trình duyệt.
function hashId_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8).map(b => ('0'+((b+256)%256).toString(16)).slice(-2)).join('');
}
function passwordHash_(password, salt) {
  // PBKDF2-HMAC-SHA256, 100.000 vòng; không lưu mật khẩu gốc.
  const key = Utilities.newBlob(password).getBytes();
  let u = Utilities.computeHmacSha256Signature(Utilities.newBlob(salt+'\x00\x00\x00\x01').getBytes(), key);
  const result = u.slice();
  for (let i=1;i<100000;i++) {
    u=Utilities.computeHmacSha256Signature(u,key);
    for(let j=0;j<result.length;j++) result[j]=(((result[j]^u[j])+128)%256+256)%256-128;
  }
  return Utilities.base64Encode(result);
}
function sameHash_(a,b) {
  if(a.length!==b.length) return false;
  let diff=0;for(let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
function normalizedEmail_(value) {
  const email=String(value||'').trim().toLowerCase();
  if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email không hợp lệ.');
  return email;
}
function registerLocal() {
  throw new Error('Đăng ký bằng email/mật khẩu đã tắt. Hãy chọn tài khoản Google để đăng nhập.');
}
function loginLocal() {
  throw new Error('Đăng nhập bằng email/mật khẩu đã tắt. Hãy chọn tài khoản Google để đăng nhập.');
}
function localSession_(token) {
  if(typeof token!=='string' || token.length>100) throw new Error('Phiên đăng nhập không hợp lệ.');
  const props=PropertiesService.getScriptProperties(),key='AUTH_SESSION_'+hashId_(token),raw=props.getProperty(key);
  if(!raw) throw new Error('Hãy đăng nhập lại.');
  const session=JSON.parse(raw);if(session.expires<Date.now()) {props.deleteProperty(key);throw new Error('Phiên đăng nhập đã hết hạn.');}

  // Phiên cũ có thể còn tên = email. Đồng bộ lại ngay từ Google mà không bắt đăng nhập lại.
  try {
    const googleUser=getCurrentUser();
    const googleName=String(googleUser && googleUser.name || '').trim();
    if(googleUser.email===session.user.email && googleName && googleName.toLowerCase()!==session.user.email.toLowerCase()) {
      if(session.user.name!==googleName) {
        session.user.name=googleName;
        props.setProperty(key,JSON.stringify(session));
        const accountKey='AUTH_USER_'+hashId_(session.user.email);
        const accountRaw=props.getProperty(accountKey);
        if(accountRaw) {
          const account=JSON.parse(accountRaw);
          account.name=googleName;
          props.setProperty(accountKey,JSON.stringify(account));
        }
      }
    }
  } catch (_) {}

  if(String(session.user.name || '').trim().toLowerCase()===String(session.user.email || '').trim().toLowerCase()) {
    session.user.name='';
  }
  return session.user;
}
function logoutLocal(token) {
  if(typeof token==='string' && token.length<=100) PropertiesService.getScriptProperties().deleteProperty('AUTH_SESSION_'+hashId_(token));
  return {ok:true};
}
