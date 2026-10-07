/* global jest */

// Native modules are replaced with in-memory fakes; the app code above them runs unchanged.
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

// The real provider waits for native inset events before rendering its children.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    getItemAsync: jest.fn(async (key) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, String(value));
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
    __resetStore: () => store.clear(),
  };
});

// Native Android toasts do not exist under Jest; tests assert on the messages instead.
jest.mock('./src/utils/feedback', () => ({ showToast: jest.fn() }));

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() },
}));
