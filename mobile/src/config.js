import Constants from 'expo-constants';

const LOCAL_API_PORT = 4000;

/**
 * Resolves the base URL of the shared REST API:
 * 1. EXPO_PUBLIC_API_URL, inlined at build time (release builds point at the deployed HTTPS API).
 * 2. In development, port 4000 on the machine running Metro, so Expo Go on a phone on the
 *    same Wi-Fi reaches the local backend without extra setup.
 * 3. The Android emulator's alias for the host machine.
 */
function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  const devServerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (__DEV__ && devServerHost) return `http://${devServerHost}:${LOCAL_API_PORT}/api`;

  return `http://10.0.2.2:${LOCAL_API_PORT}/api`;
}

export const API_URL = resolveApiUrl();
export const REQUEST_TIMEOUT_MS = 20_000;
