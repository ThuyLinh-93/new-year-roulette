import { GOOGLE_SESSION_KEY } from "./constants";

const KAKAO_PLACEHOLDER = "YOUR_KAKAO_JAVASCRIPT_KEY";
const GOOGLE_PLACEHOLDER = "YOUR_GOOGLE_CLIENT_ID";

export function getEnv() {
  return {
    kakaoJsKey: import.meta.env.VITE_KAKAO_JS_KEY,
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  };
}

export function isConfiguredKakao(key) {
  return Boolean(key && key !== KAKAO_PLACEHOLDER);
}

export function isConfiguredGoogle(clientId) {
  return Boolean(clientId && clientId !== GOOGLE_PLACEHOLDER);
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function parseJwt(token) {
  const payload = token.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(""),
  );
  return JSON.parse(json);
}

export function saveGoogleSession(profile) {
  sessionStorage.setItem(GOOGLE_SESSION_KEY, JSON.stringify(profile));
}

export function loadGoogleSession() {
  const raw = sessionStorage.getItem(GOOGLE_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearGoogleSession() {
  sessionStorage.removeItem(GOOGLE_SESSION_KEY);
}
