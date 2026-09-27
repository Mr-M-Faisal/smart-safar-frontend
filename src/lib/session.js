const TOKEN_KEY = "smart-safar-token";

export function saveSessionToken(token) {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function readSessionToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearSessionToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}
