import 'dart:io';
import 'package:flutter/widgets.dart';
import 'package:smart_akshaya/services/local_excel_service.dart';
import 'package:smart_akshaya/config/google_sheets_config.dart';
import 'package:smart_akshaya/services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    final rows = await LocalExcelService().getRows(GoogleSheetsConfig.serviceSheetName);
    print("Found ${rows.length} rows in ${GoogleSheetsConfig.serviceSheetName}");
    if (rows.isNotEmpty) {
      print("Header: ${rows.first}");
    }
    if (rows.length > 1) {
      print("First row: ${rows[1]}");
    }
  } catch (e) {
    print("Error: $e");
  }
  exit(0);
}
