import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolves the Laravel backend URL automatically:
 *
 *  1. EXPO_PUBLIC_API_URL in mobile/.env (if set) always wins.
 *  2. Web: same hostname the page was loaded from (localhost or LAN IP).
 *  3. Expo Go on a phone / emulator: the IP of the computer running Metro
 *     (taken from the QR-code URL), so no manual IP editing is needed.
 *  4. Fallback: Android emulator alias 10.0.2.2, otherwise localhost.
 */
const BACKEND_PORT = process.env.EXPO_PUBLIC_API_PORT || '8000';

const getDevHost = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    '';
  const host = hostUri.split(':')[0];

  // Tunnel hosts (*.exp.direct) can't reach the local backend — set EXPO_PUBLIC_API_URL instead.
  if (host && !host.endsWith('.exp.direct') && !host.includes('ngrok')) {
    return host;
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

const stripSlash = (url) => url.replace(/\/+$/, '');

const host = getDevHost();

export const API_URL = stripSlash(process.env.EXPO_PUBLIC_API_URL || `http://${host}:${BACKEND_PORT}/api`);

export const STORAGE_URL = stripSlash(
  process.env.EXPO_PUBLIC_STORAGE_URL || API_URL.replace(/\/api$/, '') + '/storage'
);

export const imageUrl = (path) => (path ? `${STORAGE_URL}/${path}` : null);

if (__DEV__) {
  console.log(`[BorrowHub] API_URL = ${API_URL}`);
}
