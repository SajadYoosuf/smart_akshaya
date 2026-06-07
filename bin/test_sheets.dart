import 'dart:io';
import '../lib/config/google_sheets_config.dart';
import '../lib/services/google_sheets_service.dart';
import '../lib/services/local_excel_service.dart';

/// Pure Dart helper to read a .env file and return a map of key/value pairs.
/// Required since flutter_dotenv requires a running Flutter framework which is unavailable in CLI mode.
Map<String, String> loadEnvMap(String path) {
  final file = File(path);
  if (!file.existsSync()) {
    print('WARNING: .env file not found at ${file.absolute.path}. Using default config.');
    return {};
  }
  
  final Map<String, String> env = {};
  final lines = file.readAsLinesSync();
  for (var line in lines) {
    final trimmed = line.trim();
    if (trimmed.isEmpty || trimmed.startsWith('#')) continue;
    final index = trimmed.indexOf('=');
    if (index == -1) continue;
    final key = trimmed.substring(0, index).trim();
    final val = trimmed.substring(index + 1).trim();
    env[key] = val;
  }
  return env;
}

void main(List<String> args) async {
  print('=====================================================');
  print('Smart Akshaya Database & API Connection Test');
  print('=====================================================');

  // 1. Load .env manually
  print('Loading environment variables from .env...');
  final env = loadEnvMap('.env');
  final envSpreadsheetId = env['SPREADSHEET_ID'] ?? '';
  final envCredentialsPath = env['CREDENTIALS_PATH'] ?? 'assets/credentials/google_sheets_credentials.json';
  
  print('SPREADSHEET_ID (env): ${envSpreadsheetId.isEmpty ? "NOT SET" : envSpreadsheetId}');
  print('CREDENTIALS_PATH (env): $envCredentialsPath');

  // 2. Test Local Excel Database Creation & Operations (Offline Feature)
  print('\n----------------------------------------');
  print('Testing Local Offline Excel Database...');
  print('----------------------------------------');

  final excelService = LocalExcelService();
  
  try {
    print('Initializing local Excel database file...');
    await excelService.initDatabase('.');
    final dbFile = await excelService.getDatabaseFile();
    print('Database file created successfully at: ${dbFile.absolute.path}');

    // Read staff details
    var localStaff = await excelService.getRows(GoogleSheetsConfig.staffSheetName);
    print('Local staff row count (including headers): ${localStaff.length}');

    // Append a test row locally (marked Synced = false)
    final testName = 'Local Test User ${DateTime.now().millisecondsSinceEpoch}';
    print('Appending local test staff: $testName...');
    final localRow = [
      '105', 
      testName, 
      'Offline House, Calicut', 
      '+91 8888877777', 
      'offline_${DateTime.now().millisecondsSinceEpoch}@example.com', 
      'staff', 
      'Active', 
      'offline123',
      false // Synced = false
    ];
    
    // Add row to staff details in local Excel
    await excelService.appendRow(GoogleSheetsConfig.staffSheetName, localRow);

    // Verify row count changed
    localStaff = await excelService.getRows(GoogleSheetsConfig.staffSheetName);
    print('New local staff row count: ${localStaff.length}');
    print('Last local row: ${localStaff.last}');

    // Check pending sync query
    final pending = await excelService.getPendingSyncRows(GoogleSheetsConfig.staffSheetName);
    print('Local rows pending sync: ${pending.length}');

    print('Offline local Excel creation and database write test SUCCESSFUL!');
  } catch (e) {
    print('ERROR testing local offline database: $e');
  }

  // 3. Test Google Sheets API & Authentication
  print('\n----------------------------------------');
  print('Testing Google Sheets Authentication...');
  print('----------------------------------------');

  final credentialsFile = File(envCredentialsPath);
  if (!credentialsFile.existsSync()) {
    print('ERROR: Service account credentials file not found at: ${credentialsFile.absolute.path}');
    print('Make sure you have copied the credentials JSON file.');
    print('Google Sheets remote API testing will be skipped.');
    exit(0);
  }

  print('Found credentials file at: ${credentialsFile.path}');
  final credentialsJson = credentialsFile.readAsStringSync();

  final sheetsService = GoogleSheetsService();
  try {
    print('Authenticating with Google Sheets API...');
    await sheetsService.init(credentialsJson);
    print('Authentication SUCCESSFUL!');
  } catch (e) {
    print('ERROR: Google Sheets authentication failed: $e');
    exit(1);
  }

  // Determine Spreadsheet ID
  String spreadsheetId = '';
  if (args.isNotEmpty) {
    spreadsheetId = args[0];
    print('Using Spreadsheet ID from command-line argument: $spreadsheetId');
  } else {
    spreadsheetId = envSpreadsheetId;
    if (spreadsheetId.isEmpty) {
      print('\n=====================================================================');
      print('WARNING: No spreadsheet ID configured in .env.');
      print('Please run this test with your Google Spreadsheet ID as an argument:');
      print('  dart run bin/test_sheets.dart <YOUR_SPREADSHEET_ID>');
      print('\nEnsure you share your Google Sheet with the Service Account email:');
      print('  smart-akshaya@smart-akshaya-498217.iam.gserviceaccount.com');
      print('Give it "Editor" permissions so it can read/write.');
      print('=====================================================================');
      
      print('\nSkipping remote spreadsheet connect test (no spreadsheet ID specified).');
      print('=====================================================');
      print('Google Sheets Connection Test COMPLETED!');
      print('=====================================================');
      exit(0);
    } else {
      print('Connecting to configured Spreadsheet ID: $spreadsheetId');
    }
  }

  try {
    spreadsheetId = await sheetsService.getOrCreateSpreadsheet(spreadsheetId);
    print('Google Sheet successfully reached. Spreadsheet ID: $spreadsheetId');

    print('\nTesting Google Sheet CRUD...');
    final testEmail = 'api_staff_${DateTime.now().millisecondsSinceEpoch}@example.com';
    print('Appending test staff row to Google Sheet: $testEmail...');
    final testStaffRow = [
      '101', 
      'Remote API Test Staff', 
      'Cloud Server', 
      '+91 7777766666', 
      testEmail, 
      'Normal User', 
      'Active', 
      'remote123'
    ];
    await sheetsService.appendRow(spreadsheetId, GoogleSheetsConfig.staffSheetName, testStaffRow);
    print('Google Sheets write operation SUCCESSFUL!');

    // Read back
    final googleRows = await sheetsService.getRows(spreadsheetId, GoogleSheetsConfig.staffSheetName);
    print('Google Sheets read row count: ${googleRows.length}');
    print('Last remote row: ${googleRows.last}');
  } catch (e) {
    print('ERROR testing Google Sheet operations: $e');
  }

  print('\n=====================================================');
  print('Smart Akshaya Database & API Connection Test COMPLETED!');
  print('=====================================================');
}
