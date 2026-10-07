export const TOKEN_STORAGE_KEY = 'orbit.authToken';

// Falls back to memory when storage is blocked (e.g. some private browsing modes),
// so the session still works for the lifetime of the tab.
let memoryToken = null;

export const tokenStorage = {
  get() {
    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? memoryToken;
    } catch {
      return memoryToken;
    }
  },
  set(token) {
    memoryToken = token;
    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // Storage unavailable: keep the in-memory copy only.
    }
  },
  clear() {
    memoryToken = null;
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};
