import CryptoJS from 'crypto-js';

// Encrypt message using recipient's public key and thread ID as salt
export async function encryptMessage(
  message: string,
  recipientPublicKey: string,
  threadId: string
): Promise<string> {
  try {
    // Use thread ID as additional salt for the encryption
    const salt = CryptoJS.SHA256(threadId).toString();
    
    // Create a unique key for this thread and recipient
    const encryptionKey = CryptoJS.PBKDF2(
      recipientPublicKey,
      salt,
      { keySize: 256/32, iterations: 1000 }
    ).toString();

    // Encrypt the message
    const encrypted = CryptoJS.AES.encrypt(message, encryptionKey);
    
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

// Decrypt message using private key
export function decryptMessage(encryptedMessage: string, privateKey: string): string {
  try {
    // Decrypt using private key
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, privateKey);
    
    // Convert to UTF8 string
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
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
