// AES Configuration
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;

/**
 * Get the encryption key
 */
const getEncryptionKey = async (): Promise<CryptoKey> => {
  const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('Encryption key is not configured');
  }

  // Import key from base64 string
  const keyBuffer = Uint8Array.from(atob(key), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    ALGORITHM,
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypt data
 */
export const encryptData = async (data: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encodedData = new TextEncoder().encode(data);

    const encryptedData = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encodedData
    );

    // Create merged array
    const encryptedArray = new Uint8Array(encryptedData);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv, 0);
    combined.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data
 */
export const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    const iv = combined.subarray(0, IV_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};