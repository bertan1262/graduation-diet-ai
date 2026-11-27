import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_ACCESS_TOKEN_KEY = 'diet_ai_jwt_access_token';
const AUTH_REFRESH_TOKEN_KEY = 'diet_ai_jwt_refresh_token';

/**
 * Hardware-backed encrypted credential storage for JWT tokens.
 * Uses iOS Keychain / Android EncryptedSharedPreferences (Keystore) on native devices,
 * with a graceful AsyncStorage fallback on Expo Web where native Keychain is unavailable.
 */
const isNativeSecureStoreSupported = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureStorage = {
  isHardwareEncrypted(): boolean {
    return isNativeSecureStoreSupported();
  },

  async setAuthToken(token: string): Promise<void> {
    try {
      if (isNativeSecureStoreSupported()) {
        await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, token, SECURE_OPTIONS);
      } else {
        await AsyncStorage.setItem(AUTH_ACCESS_TOKEN_KEY, token);
      }
    } catch (err) {
      console.warn('Failed to persist JWT access token in SecureStore:', err);
    }
  },

  async getAuthToken(): Promise<string | null> {
    try {
      if (isNativeSecureStoreSupported()) {
        return await SecureStore.getItemAsync(AUTH_ACCESS_TOKEN_KEY, SECURE_OPTIONS);
      }
      return await AsyncStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
    } catch (err) {
      console.warn('Failed to read JWT access token from SecureStore:', err);
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      if (isNativeSecureStoreSupported()) {
        await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, token, SECURE_OPTIONS);
      } else {
        await AsyncStorage.setItem(AUTH_REFRESH_TOKEN_KEY, token);
      }
    } catch (err) {
      console.warn('Failed to persist JWT refresh token in SecureStore:', err);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (isNativeSecureStoreSupported()) {
        return await SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY, SECURE_OPTIONS);
      }
      return await AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
    } catch (err) {
      console.warn('Failed to read JWT refresh token from SecureStore:', err);
      return null;
    }
  },

  async clearAuthToken(): Promise<void> {
    try {
      if (isNativeSecureStoreSupported()) {
        await SecureStore.deleteItemAsync(AUTH_ACCESS_TOKEN_KEY, SECURE_OPTIONS);
        await SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY, SECURE_OPTIONS);
      } else {
        await AsyncStorage.multiRemove([AUTH_ACCESS_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY]);
      }
    } catch (err) {
      console.warn('Failed to clear JWT tokens from SecureStore:', err);
    }
  },
};
