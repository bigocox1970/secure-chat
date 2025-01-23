import CryptoJS from 'crypto-js';

export function encryptMessage(message: string, recipientPublicKey: string): string {
  // In a real-world scenario, we would use asymmetric encryption with the recipient's public key
  // For this MVP, we'll use a symmetric encryption with the public key as the password
  const encrypted = CryptoJS.AES.encrypt(message, recipientPublicKey);
  return encrypted.toString();
}

export function decryptMessage(encryptedMessage: string, privateKey: string): string {
  // In a real-world scenario, we would use the private key for asymmetric decryption
  // For this MVP, we'll use symmetric decryption with the private key as the password
  const decrypted = CryptoJS.AES.decrypt(encryptedMessage, privateKey);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

// Helper function to securely store keys in localStorage
export const getFromSecureStorage = (key: string): string | null => {
  return localStorage.getItem(key);
};

export const saveToSecureStorage = (key: string, value: string) => {
  localStorage.setItem(key, value);
};

// Constants for storage keys
export const STORAGE_KEYS = {
  WALLET_ADDRESS: 'wallet_address',
  PRIVATE_KEY: 'private_key',
} as const;
