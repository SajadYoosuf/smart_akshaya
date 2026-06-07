import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:excel/excel.dart';
import '../config/google_sheets_config.dart';

// Top-level function to run Excel decode in a background isolate
List<List<String>> _isolateGetRows(Map<String, dynamic> args) {
  try {
    final bytes = args['bytes'] as List<int>;
    final sheetName = args['sheetName'] as String;
    
    final excel = Excel.decodeBytes(bytes);
    final sheet = excel[sheetName];
    if (sheet == null) return [];
    
    List<List<String>> result = [];
    for (var row in sheet.rows) {
      List<String> rowCells = [];
      for (var cell in row) {
        rowCells.add(cell?.value?.toString() ?? '');
      }
      if (rowCells.any((c) => c.isNotEmpty)) {
        result.add(rowCells);
      }
    }
    return result;
  } catch (e, st) {
    print('Isolate Error in _isolateGetRows: $e\n$st');
    return [];
  }
}

// Top-level function to run Excel bulk update in a background isolate
List<int>? _isolateReplaceAllRowsBatch(Map<String, dynamic> args) {
  try {
    final bytes = args['bytes'] as List<int>;
    final sheetName = args['sheetName'] as String;
    final rowsToWrite = args['rowsToWrite'] as List<List<dynamic>>;
    
    final excel = Excel.decodeBytes(bytes);
    final sheet = excel[sheetName];
    if (sheet == null) return null;

    for (int rowIndex = 0; rowIndex < rowsToWrite.length; rowIndex++) {
      final rowValues = rowsToWrite[rowIndex];
      while (sheet.maxRows <= rowIndex) {
        sheet.appendRow([TextCellValue('')]);
      }
      for (int colIndex = 0; colIndex < rowValues.length; colIndex++) {
        final val = rowValues[colIndex];
        CellValue cellValue = TextCellValue(val?.toString() ?? '');
        if (val is bool) {
          cellValue = BoolCellValue(val);
        } else if (val is int) {
          cellValue = IntCellValue(val);
        } else if (val is double) {
          cellValue = DoubleCellValue(val);
        }
        sheet.updateCell(
          CellIndex.indexByColumnRow(columnIndex: colIndex, rowIndex: rowIndex),
          cellValue,
        );
      }
    }

    if (sheet.maxRows > rowsToWrite.length) {
      for (int rowIndex = rowsToWrite.length; rowIndex < sheet.maxRows; rowIndex++) {
        for (int colIndex = 0; colIndex < 20; colIndex++) {
           sheet.updateCell(
             CellIndex.indexByColumnRow(columnIndex: colIndex, rowIndex: rowIndex),
             TextCellValue(''),
           );
        }
      }
    }

    return excel.encode();
  } catch (e, st) {
    print('Isolate Error in _isolateReplaceAllRowsBatch: $e\n$st');
    return null;
  }
}

class LocalExcelService {
  static final LocalExcelService _instance = LocalExcelService._internal();
  factory LocalExcelService() => _instance;
  LocalExcelService._internal();

  static const String _folderName = 'SmartAkshaya';
  static const String _fileName = 'smart_akshaya_db.xlsx';

  bool _initialized = false;
  String _basePath = '.';

  /// Retrieves the local Excel database file path.
  Future<File> getDatabaseFile() async {
    final parentDir = Directory('$_basePath/$_folderName');
    if (!await parentDir.exists()) {
      await parentDir.create(recursive: true);
    }
    return File('${parentDir.path}/$_fileName');
  }

  /// Tests if a directory path is writeable by attempting to create the SmartAkshaya
  /// folder and writing a temporary file. Throws an exception if it fails.
  Future<void> testPathWriteable(String path) async {
    final parentDir = Directory('$path/$_folderName');
    if (!await parentDir.exists()) {
      await parentDir.create(recursive: true);
    }
    final testFile = File('${parentDir.path}/.write_test');
    await testFile.writeAsString('test');
    await testFile.delete();
  }

  /// Initializes the local database Excel file if it doesn't already exist.
  Future<void> initDatabase([String? basePath]) async {
    if (basePath != null && basePath != _basePath) {
      _basePath = basePath;
      _initialized = false;
    }
    if (_initialized) return;

    try {
      final file = await getDatabaseFile();
      if (!await file.exists()) {
        print('Local Excel database file not found. Initializing new database...');
        final excel = Excel.createExcel();
        
        // Setup staff details sheet
        excel.rename(excel.getDefaultSheet()!, GoogleSheetsConfig.staffSheetName);
        final staffSheet = excel[GoogleSheetsConfig.staffSheetName];
        staffSheet.appendRow([
          TextCellValue('ID'),
          TextCellValue('Name'),
          TextCellValue('Address'),
          TextCellValue('Mobile'),
          TextCellValue('Email'),
          TextCellValue('User Type'),
          TextCellValue('Status'),
          TextCellValue('Password'),
          TextCellValue('Synced')
        ]);

        // Setup service details sheet
        final serviceSheet = excel[GoogleSheetsConfig.serviceSheetName];
        serviceSheet.appendRow([
          TextCellValue('ID'),
          TextCellValue('Name'),
          TextCellValue('Charge 1'),
          TextCellValue('Charge 2'),
          TextCellValue('Charge 3'),
          TextCellValue('Wallet'),
          TextCellValue('Wallet Charge'),
          TextCellValue('Time Min'),
          TextCellValue('Required Documents'),
          TextCellValue('Repeated'),
          TextCellValue('eDistrict'),
          TextCellValue('Gateway'),
          TextCellValue('Print Scan Copy'),
          TextCellValue('Synced')
        ]);

        // Setup customer details sheet
        final customerSheet = excel[GoogleSheetsConfig.customerSheetName];
        customerSheet.appendRow([
          TextCellValue('ID'),
          TextCellValue('Name'),
          TextCellValue('Mobile'),
          TextCellValue('Email'),
          TextCellValue('Address'),
          TextCellValue('Remarks'),
          TextCellValue('Synced')
        ]);

        // Setup expense management sheet
        final expenseSheet = excel[GoogleSheetsConfig.expenseSheetName];
        expenseSheet.appendRow([
          TextCellValue('ID'),
          TextCellValue('Date'),
          TextCellValue('Category'),
          TextCellValue('Amount'),
          TextCellValue('Description'),
          TextCellValue('Synced')
        ]);

        // Write the new Excel file to disk
        final bytes = excel.encode();
        if (bytes != null) {
          await file.writeAsBytes(bytes);
          print('Successfully created local Excel database at: ${file.path}');
        } else {
          throw Exception('Failed encoding new Excel database');
        }
      } else {
        print('Found existing local Excel database at: ${file.path}');
      }
      _initialized = true;
    } catch (e) {
      print('Error initializing local Excel database: $e');
      rethrow;
    }
  }

  /// Reads all rows from a given worksheet.
  Future<List<List<String>>> getRows(String sheetName) async {
    await initDatabase();
    try {
      final file = await getDatabaseFile();
      final bytes = await file.readAsBytes();
      
      return await compute(_isolateGetRows, {
        'bytes': bytes,
        'sheetName': sheetName,
      });
    } catch (e) {
      print('Error reading rows from local Excel sheet $sheetName: $e');
      return [];
    }
  }

  /// Appends a single row to a worksheet.
  Future<void> appendRow(String sheetName, List<dynamic> rowValues) async {
    await initDatabase();
    try {
      final file = await getDatabaseFile();
      final bytes = await file.readAsBytes();
      final excel = Excel.decodeBytes(bytes);
      final sheet = excel[sheetName];

      // Convert values to CellValues
      final List<CellValue> cells = rowValues.map((val) {
        if (val is bool) {
          return BoolCellValue(val);
        } else if (val is int) {
          return IntCellValue(val);
        } else if (val is double) {
          return DoubleCellValue(val);
        }
        return TextCellValue(val.toString());
      }).toList();

      sheet.appendRow(cells);

      final encoded = excel.encode();
      if (encoded != null) {
        await file.writeAsBytes(encoded);
        print('Successfully appended row to local Excel sheet $sheetName');
      }
    } catch (e) {
      print('Error appending row to local Excel sheet: $e');
      rethrow;
    }
  }

  /// Updates an existing row in a worksheet (using 1-based row index).
  Future<void> updateRow(String sheetName, int rowIndex, List<dynamic> rowValues) async {
    await initDatabase();
    try {
      final file = await getDatabaseFile();
      final bytes = await file.readAsBytes();
      final excel = Excel.decodeBytes(bytes);
      final sheet = excel[sheetName];

      // Pad sheet rows if needed
      while (sheet.maxRows <= rowIndex) {
        sheet.appendRow([]);
      }

      // Overwrite cells
      for (int i = 0; i < rowValues.length; i++) {
        final val = rowValues[i];
        CellValue cellValue = TextCellValue(val.toString());
        if (val is bool) {
          cellValue = BoolCellValue(val);
        } else if (val is int) {
          cellValue = IntCellValue(val);
        } else if (val is double) {
          cellValue = DoubleCellValue(val);
        }
        
        sheet.updateCell(
          CellIndex.indexByColumnRow(columnIndex: i, rowIndex: rowIndex),
          cellValue,
        );
      }

      final encoded = excel.encode();
      if (encoded != null) {
        await file.writeAsBytes(encoded);
        print('Successfully updated row $rowIndex in local Excel sheet $sheetName');
      }
    } catch (e) {
      print('Error updating row in local Excel sheet: $e');
      rethrow;
    }
  }

  /// Replaces all rows in a sheet in a single batch operation.
  /// This performs a single read and write to disk, avoiding UI hangs.
  Future<void> replaceAllRowsBatch(String sheetName, List<List<dynamic>> rowsToWrite) async {
    await initDatabase();
    try {
      final file = await getDatabaseFile();
      final bytes = await file.readAsBytes();
      
      final encoded = await compute(_isolateReplaceAllRowsBatch, {
        'bytes': bytes,
        'sheetName': sheetName,
        'rowsToWrite': rowsToWrite,
      });

      if (encoded != null) {
        await file.writeAsBytes(encoded);
        print('Successfully batch updated local Excel sheet $sheetName via background isolate');
      }
    } catch (e) {
      print('Error batch updating local Excel sheet: $e');
      rethrow;
    }
  }

  /// Clears a row (fills it with empty strings) to represent a deletion.
  Future<void> clearRow(String sheetName, int rowIndex, int numColumns) async {
    final emptyRow = List.filled(numColumns, '');
    await updateRow(sheetName, rowIndex, emptyRow);
  }

  /// Gets all rows that have not yet been synchronized with Google Sheets.
  /// Returns a list of maps containing:
  /// - `index`: the 1-based row index in the local Excel worksheet.
  /// - `row`: the row content as List<String>.
  Future<List<Map<String, dynamic>>> getPendingSyncRows(String sheetName) async {
    final allRows = await getRows(sheetName);
    List<Map<String, dynamic>> pending = [];
    
    if (allRows.isEmpty) return [];

    // Skip header row
    for (int i = 1; i < allRows.length; i++) {
      final row = allRows[i];
      // Synced status is in the last column
      final syncedColIndex = row.length - 1;
      final syncedValue = row[syncedColIndex].toString().toLowerCase().trim();
      
      if (syncedValue == 'false') {
        pending.add({
          'index': i, // 0-based index in the returned rows
          'row': row,
        });
      }
    }
    return pending;
  }

  /// Marks a specific row as synced (sets the last column to 'true')
  Future<void> markRowAsSynced(String sheetName, int rowIndex) async {
    await initDatabase();
    try {
      final file = await getDatabaseFile();
      final bytes = await file.readAsBytes();
      final excel = Excel.decodeBytes(bytes);
      final sheet = excel[sheetName];

      // Find the last column index of this row
      final row = sheet.rows[rowIndex];
      final syncedColIndex = row.length - 1;

      sheet.updateCell(
        CellIndex.indexByColumnRow(columnIndex: syncedColIndex, rowIndex: rowIndex),
        BoolCellValue(true),
      );

      final encoded = excel.encode();
      if (encoded != null) {
        await file.writeAsBytes(encoded);
        print('Marked row $rowIndex as Synced = true in local Excel');
      }
    } catch (e) {
      print('Error marking row as synced in local Excel: $e');
    }
  }
}
