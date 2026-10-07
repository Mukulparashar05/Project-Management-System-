import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'orbit.authToken';

// The JWT is persisted only in SecureStore (Android Keystore / iOS Keychain encryption) and
// mirrored in memory so requests do not hit native storage every time. Never AsyncStorage.
let cachedToken = null;

export const tokenStorage = {
  get() {
    return cachedToken;
  },

  async load() {
    try {
      cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      // The keystore entry can become unreadable (e.g. after the device lock changes): start fresh.
      console.warn('Stored session could not be read and was discarded.', error);
      cachedToken = null;
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    }
    return cachedToken;
  },

  async save(token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    cachedToken = token;
  },

  async clear() {
    cachedToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
