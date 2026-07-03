import 'dart:convert';
import 'package:crypto/crypto.dart';

class EncryptionService {
  // Encryption key used for two-way obfuscation.
  // Modify this to a custom unique key for your deployment.
  static const String _key = 'smart_akshaya_key_2026';

  // =========================================================================
  // OPTION A: One-way Hashing (Recommended & Standard for Logins)
  // =========================================================================

  /// Hashes a password using SHA-256. 
  /// This is one-way (irreversible), meaning the original password can never be decrypted.
  /// To verify, you hash the entered password at login and compare the hashes.
  static String hashSHA256(String password) {
    final bytes = utf8.encode(password);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  // =========================================================================
  // OPTION B: Two-way Encryption (For spreadsheet obfuscation & retrieval)
  // =========================================================================

  /// Encrypts a string (XOR + Base64) so it is unreadable in the Spreadsheet,
  /// but can be decrypted back into plain text in the app.
  static String encrypt(String plaintext) {
    if (plaintext.isEmpty) return '';
    final bytes = utf8.encode(plaintext);
    final keyBytes = utf8.encode(_key);
    final encryptedBytes = List<int>.generate(bytes.length, (i) {
      return bytes[i] ^ keyBytes[i % keyBytes.length];
    });
    return base64Url.encode(encryptedBytes);
  }

  /// Decrypts an encrypted string (Base64 + XOR) back to plaintext.
  /// If the decryption fails (e.g. if the value was saved in plain text before),
  /// it returns the raw value.
  static String decrypt(String ciphertext) {
    if (ciphertext.isEmpty) return '';
    try {
      final bytes = base64Url.decode(ciphertext);
      final keyBytes = utf8.encode(_key);
      final decryptedBytes = List<int>.generate(bytes.length, (i) {
        return bytes[i] ^ keyBytes[i % keyBytes.length];
      });
      return utf8.decode(decryptedBytes);
    } catch (e) {
      // Returns raw ciphertext if it is not a valid base64/encrypted string (fallback for plain passwords)
      return ciphertext;
    }
  }
}
