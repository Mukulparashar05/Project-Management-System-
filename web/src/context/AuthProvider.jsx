import { useCallback, useEffect, useMemo, useState } from 'react';
import { setSessionExpiredHandler } from '../services/apiClient.js';
import { authService } from '../services/authService.js';
import { TOKEN_STORAGE_KEY, tokenStorage } from '../services/tokenStorage.js';
import { AuthContext } from './authContext.js';

/**
 * Session states:
 * - checking: a stored token is being verified with GET /auth/me
 * - authenticated / unauthenticated
 * - unreachable: a token exists but the API could not be reached to verify it
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => ({
    status: tokenStorage.get() ? 'checking' : 'unauthenticated',
    user: null,
  }));
  const [sessionNotice, setSessionNotice] = useState(null);

  const startSession = useCallback(({ user, token }) => {
    tokenStorage.set(token);
    setSessionNotice(null);
    setSession({ status: 'authenticated', user });
  }, []);

  const endSession = useCallback((notice = null) => {
    tokenStorage.clear();
    setSession({ status: 'unauthenticated', user: null });
    setSessionNotice(notice);
  }, []);

  // Any authenticated request rejected with 401 (expired, revoked or invalid token) ends the session.
  useEffect(
    () => setSessionExpiredHandler((error) => endSession(error.message)),
    [endSession],
  );

  useEffect(() => {
    if (session.status !== 'checking') return undefined;

    const controller = new AbortController();
    authService.getCurrentUser({ signal: controller.signal }).then(
      (user) => setSession({ status: 'authenticated', user }),
      (error) => {
        // 401s are already handled by the session-expired handler above.
        if (error.canceled || error.status === 401) return;
        setSession({ status: 'unreachable', user: null });
      },
    );
    return () => controller.abort();
  }, [session.status]);

  // Keep several open tabs in sync when one of them logs in or out.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== TOKEN_STORAGE_KEY) return;
      setSession(
        event.newValue ? { status: 'checking', user: null } : { status: 'unauthenticated', user: null },
      );
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await authService.login(credentials)),
    [startSession],
  );

  const register = useCallback(
    async (details) => startSession(await authService.register(details)),
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // The local session is cleared regardless: an unreachable API must not keep anyone signed in.
    }
    endSession();
  }, [endSession]);

  const retrySessionCheck = useCallback(() => setSession({ status: 'checking', user: null }), []);
  const clearSessionNotice = useCallback(() => setSessionNotice(null), []);

  const value = useMemo(
    () => ({
      status: session.status,
      user: session.user,
      sessionNotice,
      login,
      register,
      logout,
      endSession,
      retrySessionCheck,
      clearSessionNotice,
    }),
    [session, sessionNotice, login, register, logout, endSession, retrySessionCheck, clearSessionNotice],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
