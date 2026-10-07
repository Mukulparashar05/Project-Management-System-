import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { setSessionExpiredHandler } from '../services/apiClient';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';
import { SESSION_EXPIRED_MESSAGE } from '../utils/constants';

export const AuthContext = createContext(null);

/**
 * Session status:
 * - restoring: reading the token from SecureStore and verifying it with GET /auth/me
 * - signedIn / signedOut
 * - unverified: a token exists but the API could not be reached to verify it (offline start)
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState({ status: 'restoring', user: null, error: null });
  const [notice, setNotice] = useState(null);

  const endSession = useCallback(async (message = null) => {
    setSession({ status: 'signedOut', user: null, error: null });
    setNotice(message);
    try {
      await tokenStorage.clear();
    } catch (error) {
      console.warn('Failed to remove the stored session token.', error);
    }
  }, []);

  // Any authenticated request rejected with 401 (expired, revoked or invalid token) lands here.
  useEffect(() => setSessionExpiredHandler(() => endSession(SESSION_EXPIRED_MESSAGE)), [endSession]);

  const restoreSession = useCallback(async () => {
    setSession({ status: 'restoring', user: null, error: null });
    const token = await tokenStorage.load();
    if (!token) {
      setSession({ status: 'signedOut', user: null, error: null });
      return;
    }
    try {
      const user = await authService.getCurrentUser();
      setSession({ status: 'signedIn', user, error: null });
    } catch (error) {
      // A 401 has already ended the session through the handler above.
      if (error.status !== 401) setSession({ status: 'unverified', user: null, error });
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const startSession = useCallback(async ({ user, token }) => {
    await tokenStorage.save(token);
    setNotice(null);
    setSession({ status: 'signedIn', user, error: null });
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
      // Signing out locally must work even when the API is unreachable.
    }
    await endSession();
  }, [endSession]);

  const value = useMemo(
    () => ({
      status: session.status,
      user: session.user,
      sessionError: session.error,
      notice,
      login,
      register,
      logout,
      endSession,
      restoreSession,
      clearNotice: () => setNotice(null),
    }),
    [session, notice, login, register, logout, endSession, restoreSession],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
