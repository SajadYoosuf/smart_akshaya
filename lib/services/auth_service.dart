import 'dart:async';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import '../config/google_sheets_config.dart';
import 'google_sheets_service.dart';
import 'local_excel_service.dart';

class StaffMember {
  final String id;
  final String name;
  final String address;
  final String mobile;
  final String email;
  final String userType; // 'admin' or 'staff'
  final String status;   // 'Active' or 'Inactive'
  final String password;
  final bool synced;

  StaffMember({
    required this.id,
    required this.name,
    required this.address,
    required this.mobile,
    required this.email,
    required this.userType,
    required this.status,
    required this.password,
    this.synced = false,
  });

  factory StaffMember.fromRow(List<dynamic> row) {
    // Expected order: ID, Name, Address, Mobile, Email, User Type, Status, Password, Synced
    return StaffMember(
      id: row.length > 0 ? row[0].toString() : '',
      name: row.length > 1 ? row[1].toString() : '',
      address: row.length > 2 ? row[2].toString() : '',
      mobile: row.length > 3 ? row[3].toString() : '',
      email: row.length > 4 ? row[4].toString() : '',
      userType: row.length > 5 ? row[5].toString().toLowerCase() : 'staff',
      status: row.length > 6 ? row[6].toString() : 'Inactive',
      password: row.length > 7 ? row[7].toString() : '',
      synced: row.length > 8 ? row[8].toString().toLowerCase() == 'true' : false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'mobile': mobile,
      'email': email,
      'userType': userType,
      'status': status,
      'password': password,
      'synced': synced,
    };
  }

  factory StaffMember.fromJson(Map<String, dynamic> json) {
    return StaffMember(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      mobile: json['mobile'] ?? '',
      email: json['email'] ?? '',
      userType: json['userType'] ?? 'staff',
      status: json['status'] ?? 'Inactive',
      password: json['password'] ?? '',
      synced: json['synced'] ?? false,
    );
  }

  List<dynamic> toRow(bool isSynced) {
    return [id, name, address, mobile, email, userType, status, password, isSynced];
  }
}

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final GoogleSheetsService _sheetsService = GoogleSheetsService();
  final LocalExcelService _localExcelService = LocalExcelService();
  
  // Keys for SharedPreferences
  static const String _keyUserEmail = 'logged_in_user_email';
  static const String _keyUserName = 'logged_in_user_name';
  static const String _keyUserRole = 'logged_in_user_role';
  static const String _keyIsLoggedIn = 'is_user_logged_in';
  static const String _keySpreadsheetId = 'google_spreadsheet_id';
  static const String _keyLocalDbPath = 'local_excel_db_path';

  bool _dotEnvLoaded = false;

  /// Loads the .env file if not already loaded
  Future<void> _initEnv() async {
    if (_dotEnvLoaded) return;
    try {
      await dotenv.load(fileName: ".env");
      _dotEnvLoaded = true;
      GoogleSheetsConfig.spreadsheetId = dotenv.env['SPREADSHEET_ID'] ?? '';
      GoogleSheetsConfig.credentialsPath = dotenv.env['CREDENTIALS_PATH'] ?? 'assets/credentials/google_sheets_credentials.json';
      print('Dotenv successfully loaded in AuthService.');
    } catch (e) {
      print('Warning: Failed to load .env file in AuthService: $e');
    }
  }

  /// Saves the user selected directory path for the local Excel database
  Future<void> setLocalDatabasePath(String path) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyLocalDbPath, path);
    // Re-initialize local excel service with the new path
    await _localExcelService.initDatabase(path);
  }

  /// Retrieves the user selected local Excel database directory path.
  /// Returns empty string if not configured (to trigger onboarding dialog).
  Future<String> getLocalDatabasePath() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyLocalDbPath) ?? '';
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

  /// Logs in the user and validates credentials.
  /// If online, pulls fresh staff details from Google Sheets, saves them to local Excel, and processes sync.
  /// If offline, falls back to the local Excel database.
  Future<Map<String, dynamic>> login(String email, String password) async {
    await _initEnv();
    String dbPath = await getLocalDatabasePath();
    if (dbPath.isEmpty) {
      final directory = await getApplicationDocumentsDirectory();
      dbPath = directory.path;
    }
    await _localExcelService.initDatabase(dbPath);
    
    final spreadsheetId = await getSpreadsheetId();

    // Fallback if spreadsheet ID is completely missing
    if (spreadsheetId.isEmpty) {
      if (email == 'admin@gmail.com' && password == 'password') {
        await _saveLoginSession('admin@gmail.com', 'Admin User', 'admin');
        return {'success': true, 'role': 'admin', 'message': 'Logged in via developer fallback'};
      } else if (email == 'staff@gmail.com' && password == '123456') {
        await _saveLoginSession('staff@gmail.com', 'Staff User', 'staff');
        return {'success': true, 'role': 'staff', 'message': 'Logged in via developer fallback'};
      }
      return {
        'success': false,
        'message': 'Spreadsheet ID not configured. Use admin@gmail.com / password to bypass.'
      };
    }

    // Validate credentials directly from Google Sheets
    try {
      if (!_sheetsService.isInitialized) {
        final credentialsJson = await rootBundle.loadString(GoogleSheetsConfig.credentialsPath);
        await _sheetsService.init(credentialsJson);
      }

      print('Authenticating directly with Google Sheets...');
      final rows = await _sheetsService.getRows(spreadsheetId, GoogleSheetsConfig.staffSheetName);
      
      if (rows.isEmpty || rows.length <= 1) {
        throw Exception('No staff details found in Google Sheets.');
      }

      final List<StaffMember> staffList = rows
          .skip(1)
          .map((row) => StaffMember.fromRow(row))
          .toList();

      final normalizedEmail = email.trim().toLowerCase();
      final hashedInput = generatePasswordHash(password);
      
      final validStaff = staffList.firstWhere(
        (s) => s.email.trim().toLowerCase() == normalizedEmail && 
               (s.password.trim() == password || s.password.trim() == hashedInput),
        orElse: () => throw Exception('Invalid email or password')
      );

      if (validStaff.status.toLowerCase() != 'active') {
        return {'success': false, 'message': 'User account is inactive. Contact Administrator.'};
      }

      // Sync the downloaded data to local DB in the background
      _syncFromGoogleSheets(spreadsheetId);

      final role = validStaff.userType.toLowerCase() == 'admin' ? 'admin' : 'staff';
      await _saveLoginSession(validStaff.email, validStaff.name, role);

      return {'success': true, 'role': role, 'message': 'Login successful'};

    } catch (e) {
      return {'success': false, 'message': e.toString().replaceFirst('Exception: ', '')};
    }
  }

  Future<void> _syncFromGoogleSheets(String spreadsheetId) async {
    try {
      // 1. Initialize Sheets Service
      if (!_sheetsService.isInitialized) {
        final credentialsJson = await rootBundle.loadString(GoogleSheetsConfig.credentialsPath);
        await _sheetsService.init(credentialsJson);
      }

      // 2. Fetch fresh staff list from Google Sheets
      print('Online: Fetching fresh staff list from Google Sheets...');
      final rows = await _sheetsService.getRows(spreadsheetId, GoogleSheetsConfig.staffSheetName);
      
      if (rows.isNotEmpty) {
        // Skip header row
        final dataRows = rows.skip(1).toList();
        
        // Prepare headers and data for batch write
        final headers = ['ID', 'Name', 'Address', 'Mobile', 'Email', 'User Type', 'Status', 'Password', 'Synced'];
        
        List<List<dynamic>> batchRows = [headers];
        for (var googleRow in dataRows) {
          final staff = StaffMember.fromRow(googleRow);
          batchRows.add(staff.toRow(true));
        }

        // Write all data to local Excel in a single batch to avoid UI hanging
        await _localExcelService.replaceAllRowsBatch(GoogleSheetsConfig.staffSheetName, batchRows);
        print('Updated local Excel staff details from Google Sheets via Batch.');
      }

      // 3. Trigger background offline data sync since we have internet!
      // Don't await it to avoid blocking login flow
      syncOfflineData();

    } catch (e) {
      print('Network lookup failed during sync: $e. Falling back to local offline Excel database...');
    }
  }

  /// Checks if a user is already logged in
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

  /// Log out user
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyUserEmail);
    await prefs.remove(_keyUserName);
    await prefs.remove(_keyUserRole);
    await prefs.setBool(_keyIsLoggedIn, false);
  }

  /// Background synchronization routine
  /// Scans local Excel files for Synced = FALSE and pushes them to Google Sheets
  Future<void> syncOfflineData() async {
    await _initEnv();
    final spreadsheetId = await getSpreadsheetId();
    if (spreadsheetId.isEmpty) return;

    print('Starting offline synchronization routine...');
    try {
      // Initialize Sheets Service if not already initialized
      if (!_sheetsService.isInitialized) {
        final credentialsJson = await rootBundle.loadString(GoogleSheetsConfig.credentialsPath);
        await _sheetsService.init(credentialsJson);
      }

      // 1. Sync Pending Staff Rows
      final pendingStaff = await _localExcelService.getPendingSyncRows(GoogleSheetsConfig.staffSheetName);
      if (pendingStaff.isNotEmpty) {
        print('Syncing ${pendingStaff.length} pending staff members...');
        for (var item in pendingStaff) {
          final localIndex = item['index'] as int;
          final row = item['row'] as List<String>;
          // Strip the Synced column
          final googleRow = row.sublist(0, row.length - 1);
          
          await _sheetsService.appendRow(spreadsheetId, GoogleSheetsConfig.staffSheetName, googleRow);
          await _localExcelService.markRowAsSynced(GoogleSheetsConfig.staffSheetName, localIndex);
        }
      }

      // 2. Sync Pending Service Rows
      final pendingServices = await _localExcelService.getPendingSyncRows(GoogleSheetsConfig.serviceSheetName);
      if (pendingServices.isNotEmpty) {
        print('Syncing ${pendingServices.length} pending master services...');
        for (var item in pendingServices) {
          final localIndex = item['index'] as int;
          final row = item['row'] as List<String>;
          // Strip the Synced column
          final googleRow = row.sublist(0, row.length - 1);
          
          await _sheetsService.appendRow(spreadsheetId, GoogleSheetsConfig.serviceSheetName, googleRow);
          await _localExcelService.markRowAsSynced(GoogleSheetsConfig.serviceSheetName, localIndex);
        }
      }

      print('Offline synchronization routine COMPLETED.');
    } catch (e) {
      print('Sync failed due to connectivity / api limits: $e');
    }
  }

  /// Forces refreshing the cached staff list from Google Sheets and updating local Excel
  Future<List<StaffMember>> refreshStaffCache() async {
    await _initEnv();
    String dbPath = await getLocalDatabasePath();
    if (dbPath.isEmpty) {
      final directory = await getApplicationDocumentsDirectory();
      dbPath = directory.path;
    }
    await _localExcelService.initDatabase(dbPath);
    
    final spreadsheetId = await getSpreadsheetId();
    if (spreadsheetId.isEmpty) return [];

    try {
      if (!_sheetsService.isInitialized) {
        final credentialsJson = await rootBundle.loadString(GoogleSheetsConfig.credentialsPath);
        await _sheetsService.init(credentialsJson);
      }

      final rows = await _sheetsService.getRows(spreadsheetId, GoogleSheetsConfig.staffSheetName);
      if (rows.isNotEmpty) {
        final dataRows = rows.skip(1).toList();
        
        // Prepare headers and data for batch write
        final headers = ['ID', 'Name', 'Address', 'Mobile', 'Email', 'User Type', 'Status', 'Password', 'Synced'];
        List<List<dynamic>> batchRows = [headers];
        
        final List<StaffMember> list = [];
        for (var googleRow in dataRows) {
          final staff = StaffMember.fromRow(googleRow);
          batchRows.add(staff.toRow(true));
          list.add(staff);
        }

        // Write all data to local Excel in a single batch
        await _localExcelService.replaceAllRowsBatch(GoogleSheetsConfig.staffSheetName, batchRows);
        return list;
      }
    } catch (e) {
      print('Error during refreshStaffCache online query: $e. Using local Excel data.');
    }

    // Fallback: load local rows
    try {
      final localRows = await _localExcelService.getRows(GoogleSheetsConfig.staffSheetName);
      if (localRows.isNotEmpty) {
        return localRows.skip(1).map((row) => StaffMember.fromRow(row)).toList();
      }
    } catch (_) {}
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
