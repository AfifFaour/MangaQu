// src/services/LoginService.js

const TOKEN_COOKIE = "token";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name, value, days = 1) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Expires=${expires}; Path=/; SameSite=Lax`;
}

function deleteCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

const LoginService = {
  // call this after login success
  setToken(token) {
    if (!token) return;
    setCookie(TOKEN_COOKIE, token, 1); // 1 day
  },

  getToken() {
    return getCookie(TOKEN_COOKIE);
  },

  isLoggedIn() {
    return !!getCookie(TOKEN_COOKIE);
  },

  logout() {
    deleteCookie(TOKEN_COOKIE);
  },
};

export default LoginService;
