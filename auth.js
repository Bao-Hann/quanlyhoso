(() => {
  const USERS_KEY = 'oneform-users-v1';
  const SESSION_KEY = 'oneform-session-v1';
  const FLASH_KEY = 'oneform-flash-v1';

  const readJson = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (err) {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const hashPassword = async password => {
    if (window.crypto?.subtle && window.TextEncoder) {
      const bytes = new TextEncoder().encode(password);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return btoa(unescape(encodeURIComponent(password)));
  };

  const setFlash = (message, type='success') => {
    try { sessionStorage.setItem(FLASH_KEY, JSON.stringify({message, type})); } catch (err) {}
  };

  const consumeFlash = () => {
    try {
      const raw = sessionStorage.getItem(FLASH_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(FLASH_KEY);
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  };

  const getSession = () => readJson(SESSION_KEY, null);
  const setSession = user => writeJson(SESSION_KEY, {
    username: user.username,
    email: user.email,
    loginAt: new Date().toISOString()
  });

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setFlash('Đã đăng xuất thành công.', 'info');
    window.location.replace('./login.html');
  };

  const showMessage = (message, type='error') => {
    const host = document.getElementById('authMessage');
    if (!host) return;
    host.className = 'auth-message auth-message-' + type;
    host.innerHTML = '<span>' + message + '</span><button type="button" aria-label="Close">&times;</button>';
    host.querySelector('button')?.addEventListener('click', () => host.classList.add('d-none'));
  };

  const initProtectedPage = () => {
    const body = document.body;
    const needsAuth = body?.dataset?.authRequired === 'true';
    const session = getSession();

    if (needsAuth && !session) {
      window.location.replace('./login.html?next=index.html');
      return;
    }

    body?.classList.remove('auth-guard-pending');

    if (session) {
      const name = document.getElementById('authUsername');
      const email = document.getElementById('authEmail');
      const welcome = document.getElementById('welcomeName');
      if (name) name.textContent = session.username;
      if (email) email.textContent = session.email;
      if (welcome && (!welcome.textContent.trim() || welcome.textContent.trim() === 'Han Han')) {
        welcome.textContent = session.username;
      }
    }

    document.getElementById('logoutBtn')?.addEventListener('click', event => {
      event.preventDefault();
      logout();
    });
  };

  const initLogin = () => {
    if (getSession()) {
      window.location.replace('./index.html');
      return;
    }
    const flash = consumeFlash();
    if (flash) showMessage(flash.message, flash.type);

    const form = document.getElementById('loginForm');
    document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
      showMessage('Đăng nhập Google cần cấu hình Google OAuth Client ID trên máy chủ.', 'info');
    });

    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const username = form.elements.username.value.trim();
      const password = form.elements.password.value;

      const users = readJson(USERS_KEY, []);
      const normalized = username.toLowerCase();
      const user = users.find(item =>
        item.username.toLowerCase() === normalized ||
        String(item.email || '').toLowerCase() === normalized
      );
      if (!user || user.passwordHash !== await hashPassword(password)) {
        showMessage('Email hoặc mật khẩu không đúng.', 'error');
        return;
      }

      setSession(user);
      setFlash('Đăng nhập thành công.', 'success');
      const params = new URLSearchParams(location.search);
      const next = params.get('next');
      window.location.replace(next && !next.includes('://') ? './' + next.replace(/^\.\//,'') : './index.html');
    });
  };

  const initRegister = () => {
    if (getSession()) {
      window.location.replace('./index.html');
      return;
    }
    const form = document.getElementById('registerForm');
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const username = form.elements.username.value.trim();
      const email = form.elements.email.value.trim();
      const password = form.elements.password1.value;
      const confirm = form.elements.password2.value;

      if (!/^[\w.@+-]{1,150}$/.test(username)) {
        showMessage('Username may contain letters, numbers and @/./+/-/_ only.', 'error');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        showMessage('Enter a valid email address.', 'error');
        return;
      }
      if (password.length < 8) {
        showMessage('Password must contain at least 8 characters.', 'error');
        return;
      }
      if (/^\d+$/.test(password)) {
        showMessage('Password cannot be entirely numeric.', 'error');
        return;
      }
      if (password !== confirm) {
        showMessage('The two password fields did not match.', 'error');
        return;
      }

      const users = readJson(USERS_KEY, []);
      if (users.some(item => item.username.toLowerCase() === username.toLowerCase())) {
        showMessage('A user with that username already exists.', 'error');
        return;
      }
      if (users.some(item => item.email.toLowerCase() === email.toLowerCase())) {
        showMessage('This email is already registered.', 'error');
        return;
      }

      const user = {
        username,
        email,
        passwordHash: await hashPassword(password),
        createdAt: new Date().toISOString()
      };
      users.push(user);
      writeJson(USERS_KEY, users);
      setSession(user);
      setFlash('Welcome ' + username + '! Your account has been created.', 'success');
      window.location.replace('./index.html');
    });
  };

  window.OneFormAuth = { getSession, logout };

  document.addEventListener('DOMContentLoaded', () => {
    initProtectedPage();
    if (document.getElementById('loginForm')) initLogin();
    if (document.getElementById('registerForm')) initRegister();

    const flash = consumeFlash();
    if (flash && document.getElementById('toastHost')) {
      const cls = flash.type === 'error' ? 'danger' : flash.type;
      document.getElementById('toastHost').innerHTML =
        '<div class="alert alert-' + cls + ' shadow">' + flash.message + '</div>';
      setTimeout(() => document.getElementById('toastHost').innerHTML='', 3500);
    }
  });
})();