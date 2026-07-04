class GoogleSheetsConfig {
  // Spreadsheet ID (can be configured dynamically at runtime)
  static String spreadsheetId = '';

  // Path to Google Service Account Credentials JSON
  static String credentialsPath =
      'assets/credentials/google_sheets_credentials.json';

  static const String staffSheetName = 'Staff Details';
  static const String serviceSheetName = 'Serivce Management';
  static const String customerSheetName = 'Customer Details';
  static const String expenseSheetName = 'Expense Management';
  static const String serviceEntrySheetName = 'Service Entries';
  static const String savedBillsSheetName = 'Saved Bills';

  // Cache duration to avoid unnecessary Google API calls (to prevent "unnecessary use" / exceeding quotas)
  static const Duration cacheDuration = Duration(minutes: 15);

  // Google Sheets Scopes required
  static const List<String> scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
  ];
}
