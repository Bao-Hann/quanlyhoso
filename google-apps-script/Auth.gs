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
function registerLocal(email,password) {
  email=normalizedEmail_(email);password=String(password||'');
  const googleUser=getCurrentUser();
  if(googleUser.email!==email) throw new Error('Để đăng ký, hãy đăng nhập Google bằng đúng email này để xác nhận quyền sở hữu email.');
  if(password.length<12 || password.length>128) throw new Error('Mật khẩu cần từ 12 đến 128 ký tự.');
  const key='AUTH_USER_'+hashId_(email),props=PropertiesService.getScriptProperties();
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    if(props.getProperty(key)) throw new Error('Tài khoản đã tồn tại. Hãy đăng nhập.');
    const salt=Utilities.getUuid()+Utilities.getUuid();
    props.setProperty(key,JSON.stringify({salt:salt,hash:passwordHash_(password,salt),email:email}));
  } finally {lock.releaseLock();}
  return {ok:true};
}
function loginLocal(email,password) {
  email=normalizedEmail_(email);password=String(password||'');
  if(password.length>128) throw new Error('Email hoặc mật khẩu không đúng.');
  const key=hashId_(email),props=PropertiesService.getScriptProperties();
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const rateKey='AUTH_RATE_'+key,now=Date.now();
    let rate=JSON.parse(props.getProperty(rateKey)||'{"count":0,"until":0}');
    if(rate.until<now) rate={count:0,until:now+15*60*1000};
    if(rate.count>=5) throw new Error('Đã thử quá nhiều lần. Hãy thử lại sau 15 phút.');
    rate.count++;props.setProperty(rateKey,JSON.stringify(rate));
    const raw=props.getProperty('AUTH_USER_'+key);
    const record=raw ? JSON.parse(raw) : {salt:'unknown-account',hash:''};
    const computed=passwordHash_(password,record.salt);
    if(!raw || !sameHash_(computed,record.hash)) throw new Error('Email hoặc mật khẩu không đúng.');
    props.deleteProperty(rateKey);
    const token=Utilities.getUuid()+Utilities.getUuid();
    const user={userId:'email:'+email,email:email,name:email.split('@')[0],provider:'password'};
    props.setProperty('AUTH_SESSION_'+hashId_(token),JSON.stringify({user:user,expires:now+24*60*60*1000}));
    // Xóa phiên hết hạn, tránh đầy dung lượng lưu trữ.
    const all=props.getProperties();Object.keys(all).filter(k=>k.indexOf('AUTH_SESSION_')===0).forEach(k=>{if(JSON.parse(all[k]).expires<now) props.deleteProperty(k);});
    return {ok:true,token:token,user:user};
  } finally {lock.releaseLock();}
}
function localSession_(token) {
  if(typeof token!=='string' || token.length>100) throw new Error('Phiên đăng nhập không hợp lệ.');
  const props=PropertiesService.getScriptProperties(),key='AUTH_SESSION_'+hashId_(token),raw=props.getProperty(key);
  if(!raw) throw new Error('Hãy đăng nhập lại.');
  const session=JSON.parse(raw);if(session.expires<Date.now()) {props.deleteProperty(key);throw new Error('Phiên đăng nhập đã hết hạn.');}
  return session.user;
}
function logoutLocal(token) {
  if(typeof token==='string' && token.length<=100) PropertiesService.getScriptProperties().deleteProperty('AUTH_SESSION_'+hashId_(token));
  return {ok:true};
}
