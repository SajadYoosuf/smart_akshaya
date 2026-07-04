import 'dart:convert';
import 'dart:typed_data';
import 'package:googleapis/sheets/v4.dart' as sheets;
import 'package:googleapis/drive/v3.dart' as drive;
import 'package:googleapis_auth/auth_io.dart';
import '../config/google_sheets_config.dart';

abstract class GoogleSheetsServiceBase {
  bool get isInitialized;
  Future<void> init(String credentialsJson);
  Future<String> getOrCreateSpreadsheet(String? spreadsheetId);
  Future<String> createNewSpreadsheet();
  Future<void> appendRow(String spreadsheetId, String sheetName, List<dynamic> row);
  Future<List<List<dynamic>>> getRows(String spreadsheetId, String sheetName);
  Future<void> updateRow(String spreadsheetId, String sheetName, int rowIndex, List<dynamic> row);
  Future<void> updateRowColumns(String spreadsheetId, String sheetName, int rowIndex, Map<String, dynamic> columnUpdates);
  Future<void> clearRow(String spreadsheetId, String sheetName, int rowIndex, int numColumns);
  Future<List<Map<String, dynamic>>> fetchDriveFiles(String folderId);
  Future<Uint8List> downloadDriveFile(String fileId);
}

class GoogleSheetsService implements GoogleSheetsServiceBase {
  static final GoogleSheetsService _instance = GoogleSheetsService._internal();
  factory GoogleSheetsService() => _instance;
  GoogleSheetsService._internal();

  sheets.SheetsApi? _sheetsApi;
  drive.DriveApi? _driveApi;
  bool _initialized = false;

  bool get isInitialized => _initialized;

  /// Initializes the Sheets API client with the service account credentials JSON.
  Future<void> init(String credentialsJson) async {
    if (_initialized) return;

    try {
      final Map<String, dynamic> credentialsMap = json.decode(credentialsJson);
      final accountCredentials = ServiceAccountCredentials.fromJson(credentialsMap);
      
      final client = await clientViaServiceAccount(
        accountCredentials,
        GoogleSheetsConfig.scopes,
      );

      _sheetsApi = sheets.SheetsApi(client);
      _driveApi = drive.DriveApi(client);
      _initialized = true;
      print('Google API Services successfully initialized.');
    } catch (e) {
      print('Error initializing Google Sheets Service: $e');
      _initialized = false;
      rethrow;
    }
  }

  sheets.SheetsApi get sheetsApi {
    if (!_initialized || _sheetsApi == null) {
      throw StateError('GoogleSheetsService has not been initialized. Call init() first.');
    }
    return _sheetsApi!;
  }

  drive.DriveApi get driveApi {
    if (!_initialized || _driveApi == null) {
      throw StateError('GoogleSheetsService has not been initialized. Call init() first.');
    }
    return _driveApi!;
  }

  @override
  Future<List<Map<String, dynamic>>> fetchDriveFiles(String folderId) async {
    if (folderId.isEmpty) return [];
    try {
      final query = "'$folderId' in parents and trashed=false";
      final response = await driveApi.files.list(
        q: query,
        $fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)',
        pageSize: 100,
        orderBy: 'name',
      );

      final files = response.files ?? [];
      return files.map((f) => {
        'id': f.id ?? '',
        'title': f.name ?? 'Untitled Form',
        'mime_type': f.mimeType ?? '',
        'drive_link': f.webViewLink ?? '',
        'thumbnail_link': f.thumbnailLink ?? '',
      }).toList();
    } catch (e) {
      print('Error fetching drive files: $e');
      return [];
    }
  }

  @override
  Future<Uint8List> downloadDriveFile(String fileId) async {
    try {
      final response = await driveApi.files.get(
        fileId,
        downloadOptions: drive.DownloadOptions.fullMedia,
      ) as drive.Media;

      final List<int> bytes = [];
      await for (final chunk in response.stream) {
        bytes.addAll(chunk);
      }
      return Uint8List.fromList(bytes);
    } catch (e) {
      print('Error downloading drive file: $e');
      rethrow;
    }
  }

  /// Verifies if sheets "staff details" and "service details" exist, and if not, creates them.
  /// If [spreadsheetId] is null or empty, creates a new spreadsheet and initializes it.
  Future<String> getOrCreateSpreadsheet(String? spreadsheetId) async {
    if (spreadsheetId == null || spreadsheetId.trim().isEmpty) {
      return await createNewSpreadsheet();
    }

    try {
      // Attempt to retrieve spreadsheet details to check if it exists and has the required worksheets
      final spreadsheet = await sheetsApi.spreadsheets.get(spreadsheetId);
      final existingSheetNames = spreadsheet.sheets
          ?.map((s) => s.properties?.title?.toLowerCase().trim())
          .toList() ?? [];

      bool hasStaff = existingSheetNames.contains(GoogleSheetsConfig.staffSheetName.toLowerCase());
      bool hasService = existingSheetNames.contains(GoogleSheetsConfig.serviceSheetName.toLowerCase());
      bool hasCustomer = existingSheetNames.contains(GoogleSheetsConfig.customerSheetName.toLowerCase());
      bool hasExpense = existingSheetNames.contains(GoogleSheetsConfig.expenseSheetName.toLowerCase());

      List<sheets.Request> requests = [];

      if (!hasStaff) {
        requests.add(sheets.Request(addSheet: sheets.AddSheetRequest(properties: sheets.SheetProperties(title: GoogleSheetsConfig.staffSheetName))));
      }
      if (!hasService) {
        requests.add(sheets.Request(addSheet: sheets.AddSheetRequest(properties: sheets.SheetProperties(title: GoogleSheetsConfig.serviceSheetName))));
      }
      if (!hasCustomer) {
        requests.add(sheets.Request(addSheet: sheets.AddSheetRequest(properties: sheets.SheetProperties(title: GoogleSheetsConfig.customerSheetName))));
      }
      if (!hasExpense) {
        requests.add(sheets.Request(addSheet: sheets.AddSheetRequest(properties: sheets.SheetProperties(title: GoogleSheetsConfig.expenseSheetName))));
      }

      if (requests.isNotEmpty) {
        final batchRequest = sheets.BatchUpdateSpreadsheetRequest(requests: requests);
        await sheetsApi.spreadsheets.batchUpdate(batchRequest, spreadsheetId);
        print('Added missing worksheets to spreadsheet: $spreadsheetId');
        
        // Write headers for any newly added sheet
        if (!hasStaff) await _writeStaffHeaders(spreadsheetId);
        if (!hasService) await _writeServiceHeaders(spreadsheetId);
        if (!hasCustomer) await _writeCustomerHeaders(spreadsheetId);
        if (!hasExpense) await _writeExpenseHeaders(spreadsheetId);
      }

      return spreadsheetId;
    } catch (e) {
      print('Error validating spreadsheet $spreadsheetId, creating a new one: $e');
      return await createNewSpreadsheet();
    }
  }

  /// Creates a brand new Spreadsheet with correct worksheets and headers.
  Future<String> createNewSpreadsheet() async {
    try {
      final newSpreadsheet = sheets.Spreadsheet(
        properties: sheets.SpreadsheetProperties(title: 'Smart Akshaya Database'),
        sheets: [
          sheets.Sheet(properties: sheets.SheetProperties(title: GoogleSheetsConfig.staffSheetName)),
          sheets.Sheet(properties: sheets.SheetProperties(title: GoogleSheetsConfig.serviceSheetName)),
          sheets.Sheet(properties: sheets.SheetProperties(title: GoogleSheetsConfig.customerSheetName)),
          sheets.Sheet(properties: sheets.SheetProperties(title: GoogleSheetsConfig.expenseSheetName)),
        ],
      );

      final created = await sheetsApi.spreadsheets.create(newSpreadsheet);
      final newId = created.spreadsheetId;
      if (newId == null) throw Exception('Failed to retrieve spreadsheet ID from Google response');

      print('Successfully created new Google Spreadsheet with ID: $newId');
      
      // Write headers to all sheets
      await _writeStaffHeaders(newId);
      await _writeServiceHeaders(newId);
      await _writeCustomerHeaders(newId);
      await _writeExpenseHeaders(newId);

      return newId;
    } catch (e) {
      print('Error creating new Google Spreadsheet: $e');
      rethrow;
    }
  }

  Future<void> _writeStaffHeaders(String spreadsheetId) async {
    final headers = [
      ['ID', 'Name', 'Address', 'Mobile', 'Email', 'User Type', 'Status', 'Password']
    ];
    await _writeRange(spreadsheetId, '${GoogleSheetsConfig.staffSheetName}!A1', headers);
  }

  Future<void> _writeServiceHeaders(String spreadsheetId) async {
    final headers = [
      [
        'Service Name',
        'Website',
        'Department Fee',
        'Service Charge',
        'Commission',
        'Allow Edit',
        'Followup Days',
        'Default Wallet'
      ]
    ];
    await _writeRange(spreadsheetId, '${GoogleSheetsConfig.serviceSheetName}!A1', headers);
  }

  Future<void> _writeCustomerHeaders(String spreadsheetId) async {
    final headers = [['ID', 'Name', 'Mobile', 'Email', 'Address', 'Remarks', 'Total Paid', 'GPay/UPI', 'Cash', 'Balance']];
    await _writeRange(spreadsheetId, '${GoogleSheetsConfig.customerSheetName}!A1', headers);
  }

  Future<void> _writeExpenseHeaders(String spreadsheetId) async {
    final headers = [['ID', 'Date', 'Category', 'Amount', 'Description']];
    await _writeRange(spreadsheetId, '${GoogleSheetsConfig.expenseSheetName}!A1', headers);
  }

  Future<void> _writeRange(String spreadsheetId, String range, List<List<dynamic>> values) async {
    final valueRange = sheets.ValueRange.fromJson({
      'values': values,
    });
    await sheetsApi.spreadsheets.values.update(
      valueRange,
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
    );
  }

  /// Appends a single row to a sheet.
  Future<void> appendRow(String spreadsheetId, String sheetName, List<dynamic> row) async {
    final valueRange = sheets.ValueRange.fromJson({
      'values': [row],
    });
    await sheetsApi.spreadsheets.values.append(
      valueRange,
      spreadsheetId,
      '$sheetName!A1',
      valueInputOption: 'USER_ENTERED',
    );
  }

  /// Reads all rows of a sheet.
  Future<List<List<dynamic>>> getRows(String spreadsheetId, String sheetName) async {
    try {
      final response = await sheetsApi.spreadsheets.values.get(spreadsheetId, '$sheetName!A:Z');
      return response.values ?? [];
    } catch (e) {
      print('Error fetching rows from sheet $sheetName: $e');
      return [];
    }
  }

  /// Updates a specific row in a sheet (using 1-based indexing, e.g., rowIndex = 2 for second row, which is the first data row after headers).
  Future<void> updateRow(String spreadsheetId, String sheetName, int rowIndex, List<dynamic> row) async {
    final range = '$sheetName!A$rowIndex';
    await _writeRange(spreadsheetId, range, [row]);
  }

  /// Updates specific columns of a row by fetching the row first, updating columns, and writing back.
  Future<void> updateRowColumns(String spreadsheetId, String sheetName, int rowIndex, Map<String, dynamic> columnUpdates) async {
    final rows = await getRows(spreadsheetId, sheetName);
    if (rows.isEmpty) throw Exception('Sheet is empty');
    final headers = rows[0].map((e) => e.toString().trim().toLowerCase()).toList();

    final List<dynamic> currentRow = List.from(rows[rowIndex - 1]);
    while (currentRow.length < headers.length) {
      currentRow.add('');
    }

    columnUpdates.forEach((key, val) {
      final idx = headers.indexOf(key.toLowerCase());
      if (idx != -1) {
        while (currentRow.length <= idx) {
          currentRow.add('');
        }
        currentRow[idx] = val;
      }
    });

    await updateRow(spreadsheetId, sheetName, rowIndex, currentRow);
  }

  /// Helper to delete/clear a row or set status. In Google Sheets, deleting rows can be done via batch update.
  /// For simplicity here, we can set Status column to 'Inactive' or overwrite a row.
  Future<void> clearRow(String spreadsheetId, String sheetName, int rowIndex, int numColumns) async {
    final range = '$sheetName!A$rowIndex:${_getColumnLetter(numColumns)}$rowIndex';
    final emptyRow = List.filled(numColumns, '');
    await _writeRange(spreadsheetId, range, [emptyRow]);
  }

  String _getColumnLetter(int colCount) {
    if (colCount <= 0) return 'A';
    String result = '';
    int count = colCount;
    while (count > 0) {
      int modulo = (count - 1) % 26;
      result = String.fromCharCode(65 + modulo) + result;
      count = ((count - modulo) / 26).toInt();
    }
    return result;
  }
}
