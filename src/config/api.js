import { Platform } from 'react-native';

// API Configuration
// Use different URLs for different platforms
const getApiUrl = () => {
  // For Android emulator, use 10.0.2.2 (Android emulator's way to access host machine)
  // For physical devices, use your computer's local IP
  // For web, use localhost
  
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }
  
  if (Platform.OS === 'ios') {
    return 'http://localhost:8000/api';
  }
  
  // For web or other platforms
  return 'http://localhost:8000/api';
};

export const API_URL = getApiUrl();
export const STORAGE_URL = getApiUrl().replace('/api', '/storage');

// For physical devices, uncomment and set your computer's IP:
// export const API_URL = 'http://192.168.0.115:8000/api';
// export const STORAGE_URL = 'http://192.168.0.115:8000/storage';
