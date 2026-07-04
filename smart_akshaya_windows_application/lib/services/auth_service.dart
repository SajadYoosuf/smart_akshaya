import 'dart:async';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import '../config/google_sheets_config.dart';
import 'google_sheets_service.dart';

import '../models/staff_member.dart';

abstract class AuthServiceBase {
  Future<String> getSpreadsheetId();
  Future<void> ensureSheetsServiceInitialized();
  Future<String> getDriveFolderId();
}

class AuthService implements AuthServiceBase {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final GoogleSheetsService sheetsService = GoogleSheetsService();

  // Keys for SharedPreferences
  static const String _keyUserEmail = 'logged_in_user_email';
  static const String _keyUserName = 'logged_in_user_name';
  static const String _keyUserRole = 'logged_in_user_role';
  static const String _keyIsLoggedIn = 'is_user_logged_in';
  static const String _keySpreadsheetId = 'google_spreadsheet_id';
  static const String _keyDriveFolderId = 'google_drive_folder_id';

  bool _dotEnvLoaded = false;

  /// Loads the .env file if not already loaded
  Future<void> _initEnv() async {
    if (_dotEnvLoaded) return;
    try {
      await dotenv.load(fileName: ".env");
      _dotEnvLoaded = true;
      GoogleSheetsConfig.spreadsheetId = dotenv.env['SPREADSHEET_ID'] ?? '';
      GoogleSheetsConfig.credentialsPath =
          dotenv.env['CREDENTIALS_PATH'] ??
          'assets/credentials/google_sheets_credentials.json';
      print('Dotenv successfully loaded in AuthService.');
    } catch (e) {
      print('Warning: Failed to load .env file in AuthService: $e');
    }
  }

  /// Ensures the Google Sheets service is initialized with credentials
  Future<void> ensureSheetsServiceInitialized() async {
    if (!sheetsService.isInitialized) {
      final credentialsJson =
          await rootBundle.loadString(GoogleSheetsConfig.credentialsPath);
      await sheetsService.init(credentialsJson);
    }
  }

  /// Saves or updates the Spreadsheet ID in local storage
  Future<void> setSpreadsheetId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keySpreadsheetId, id);
  }

  /// Retrieves the current Spreadsheet ID, falling back to .env configuration
  Future<String> getSpreadsheetId() async {
    await _initEnv();
    final prefs = await SharedPreferences.getInstance();
    final localId = prefs.getString(_keySpreadsheetId);
    if (localId != null && localId.isNotEmpty) {
      return localId;
    }
    return GoogleSheetsConfig.spreadsheetId;
  }

  /// Saves or updates the Google Drive Folder ID in local storage
  Future<void> setDriveFolderId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyDriveFolderId, id);
  }

  /// Retrieves the current Google Drive Folder ID
  Future<String> getDriveFolderId() async {
    await _initEnv();
    final prefs = await SharedPreferences.getInstance();
    final localId = prefs.getString(_keyDriveFolderId);
    if (localId != null && localId.isNotEmpty) {
      return localId;
    }
    return dotenv.env['DRIVE_FOLDER_ID'] ?? '1K8ZEvuWoR3lFeoMQP0JL69r5SBl4sUol';
  }

  /// Logs in the user by validating credentials directly from Google Sheets.
  Future<Map<String, dynamic>> login(String email, String password) async {
    await _initEnv();
    final spreadsheetId = await getSpreadsheetId();

    // Developer fallback when spreadsheet ID is not configured
    if (spreadsheetId.isEmpty) {
      if (email == 'admin@gmail.com' && password == 'password') {
        await _saveLoginSession('admin@gmail.com', 'Admin User', 'admin');
        return {
          'success': true,
          'role': 'admin',
          'message': 'Logged in via developer fallback',
        };
      } else if (email == 'staff@gmail.com' && password == '123456') {
        await _saveLoginSession('staff@gmail.com', 'Staff User', 'staff');
        return {
          'success': true,
          'role': 'staff',
          'message': 'Logged in via developer fallback',
        };
      }
      return {
        'success': false,
        'message':
            'Spreadsheet ID not configured. Use admin@gmail.com / password to bypass.',
      };
    }

    try {
      if (!sheetsService.isInitialized) {
        final credentialsJson =
            await rootBundle.loadString(GoogleSheetsConfig.credentialsPath);
        await sheetsService.init(credentialsJson);
      }

      print('Authenticating directly with Google Sheets...');
      final rows = await sheetsService.getRows(
        spreadsheetId,
        GoogleSheetsConfig.staffSheetName,
      );

      if (rows.isEmpty || rows.length <= 1) {
        throw Exception('No staff details found in Google Sheets.');
      }

      final List<StaffMember> staffList = [];
      for (int i = 1; i < rows.length; i++) {
        staffList.add(StaffMember.fromRow(rows[i], rowIndex: i + 1));
      }

      final normalizedEmail = email.trim().toLowerCase();
      final hashedInput = generatePasswordHash(password);

      final validStaff = staffList.firstWhere(
        (s) =>
            s.email.trim().toLowerCase() == normalizedEmail &&
            (s.password.trim() == password ||
                s.password.trim() == hashedInput),
        orElse: () => throw Exception('Invalid email or password'),
      );

      if (validStaff.status.toLowerCase() != 'active') {
        return {
          'success': false,
          'message': 'User account is inactive. Contact Administrator.',
        };
      }

      final role =
          validStaff.userType.toLowerCase() == 'admin' ? 'admin' : 'staff';
      await _saveLoginSession(validStaff.email, validStaff.name, role);

      return {'success': true, 'role': role, 'message': 'Login successful'};
    } catch (e) {
      return {
        'success': false,
        'message': e.toString().replaceFirst('Exception: ', ''),
      };
    }
  }

  /// Checks if a user is logged in
  Future<bool> isLoggedIn() async {
    await _initEnv();
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyIsLoggedIn) ?? false;
  }

  /// Gets the cached user details
  Future<Map<String, String>> getSessionDetails() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'email': prefs.getString(_keyUserEmail) ?? '',
      'name': prefs.getString(_keyUserName) ?? '',
      'role': prefs.getString(_keyUserRole) ?? 'staff',
    };
  }

  /// Log out user — clears session data but keeps sheet/drive settings
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyUserEmail);
    await prefs.remove(_keyUserName);
    await prefs.remove(_keyUserRole);
    await prefs.setBool(_keyIsLoggedIn, false);
  }

  /// Forces refreshing the staff list from Google Sheets (cloud only)
  Future<List<StaffMember>> refreshStaffCache() async {
    await _initEnv();
    final spreadsheetId = await getSpreadsheetId();
    if (spreadsheetId.isEmpty) return [];

    try {
      if (!sheetsService.isInitialized) {
        final credentialsJson =
            await rootBundle.loadString(GoogleSheetsConfig.credentialsPath);
        await sheetsService.init(credentialsJson);
      }

      final rows = await sheetsService.getRows(
        spreadsheetId,
        GoogleSheetsConfig.staffSheetName,
      );
      if (rows.isNotEmpty) {
        return rows
            .skip(1)
            .map((row) => StaffMember.fromRow(row))
            .toList();
      }
    } catch (e) {
      print('Error during refreshStaffCache: $e');
    }
    return [];
  }

  Future<void> _saveLoginSession(String email, String name, String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUserEmail, email);
    await prefs.setString(_keyUserName, name);
    await prefs.setString(_keyUserRole, role);
    await prefs.setBool(_keyIsLoggedIn, true);
  }

  /// Hashes a password using SHA-256 for secure storage
  static String generatePasswordHash(String plainText) {
    var bytes = utf8.encode(plainText);
    var digest = sha256.convert(bytes);
    return digest.toString();
  }
}
