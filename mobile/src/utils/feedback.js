import { Platform, ToastAndroid } from 'react-native';

/** Short, non-blocking confirmation using the native Android toast. Never throws. */
export function showToast(message) {
  if (Platform.OS !== 'android') return;
  try {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } catch (error) {
    console.warn('Toast could not be shown', error);
  }
}
