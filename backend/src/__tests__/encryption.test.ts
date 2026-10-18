import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../utils/encryption.js';

describe('AES-256-GCM Token Encryption', () => {
  it('should encrypt and decrypt OAuth refresh tokens faithfully', () => {
    const rawSecretToken = 'ya29.a0AcM6123456789_google_oauth_refresh_token_xyz_production';
    const encrypted = encrypt(rawSecretToken);

    expect(encrypted).not.toBe(rawSecretToken);
    expect(encrypted.split(':').length).toBe(3); // iv:authTag:cipherText

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(rawSecretToken);
  });

  it('should return empty string if input is empty or falsy', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
  });
});
