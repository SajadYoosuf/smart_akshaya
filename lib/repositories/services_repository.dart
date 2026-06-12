import '../models/service_item.dart';
import '../services/google_sheets_service.dart';
import '../services/auth_service.dart';
import '../config/google_sheets_config.dart';
import '../core/exceptions.dart';

class ServicesRepository {
  final GoogleSheetsService _sheetsService;
  final AuthService _authService;

  ServicesRepository(this._sheetsService, this._authService);

  Future<List<ServiceItem>> fetchServices() async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      if (spreadsheetId.isEmpty) {
        throw AuthException('Spreadsheet ID is not configured.');
      }

      await _authService.ensureSheetsServiceInitialized();

      final rows = await _sheetsService.getRows(
        spreadsheetId,
        GoogleSheetsConfig.serviceSheetName,
      );

      if (rows.isEmpty) return [];

      final List<ServiceItem> parsedList = [];
      for (int i = 1; i < rows.length; i++) {
        final row = rows[i];
        if (row.isEmpty || row.length == 0 || row[0].toString().trim().isEmpty) continue;
        parsedList.add(ServiceItem.fromRow(row, i + 1));
      }
      return parsedList;
    } catch (e) {
      throw ServerException('Failed to fetch services: $e');
    }
  }

  Future<void> addService(ServiceItem service) async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      await _authService.ensureSheetsServiceInitialized();
      await _sheetsService.appendRow(
        spreadsheetId,
        GoogleSheetsConfig.serviceSheetName,
        service.toRow(),
      );
    } catch (e) {
      throw ServerException('Failed to add service: $e');
    }
  }

  Future<void> updateService(ServiceItem service) async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      await _authService.ensureSheetsServiceInitialized();
      await _sheetsService.updateRow(
        spreadsheetId,
        GoogleSheetsConfig.serviceSheetName,
        service.rowIndex,
        service.toRow(),
      );
    } catch (e) {
      throw ServerException('Failed to update service: $e');
    }
  }

  Future<void> deleteService(int rowIndex) async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      await _authService.ensureSheetsServiceInitialized();
      await _sheetsService.clearRow(
        spreadsheetId,
        GoogleSheetsConfig.serviceSheetName,
        rowIndex,
        8,
      );
    } catch (e) {
      throw ServerException('Failed to delete service: $e');
    }
  }
}
