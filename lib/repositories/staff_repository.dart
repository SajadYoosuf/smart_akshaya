import '../models/staff_member.dart';
import '../services/google_sheets_service.dart';
import '../services/auth_service.dart';
import '../config/google_sheets_config.dart';
import '../core/exceptions.dart';

class StaffRepository {
  final GoogleSheetsService _sheetsService;
  final AuthService _authService;

  StaffRepository(this._sheetsService, this._authService);

  Future<List<StaffMember>> fetchStaff() async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      if (spreadsheetId.isEmpty) {
        throw AuthException('Spreadsheet ID is not configured.');
      }
      
      await _authService.ensureSheetsServiceInitialized();

      final rows = await _sheetsService.getRows(
        spreadsheetId,
        GoogleSheetsConfig.staffSheetName,
      );

      if (rows.isEmpty) return [];

      final List<StaffMember> parsedList = [];
      for (int i = 1; i < rows.length; i++) {
        final row = rows[i];
        if (row.isEmpty || row.length == 0 || row[0].toString().trim().isEmpty) continue;
        parsedList.add(StaffMember.fromRow(row, rowIndex: i + 1));
      }
      return parsedList;
    } catch (e) {
      throw ServerException('Failed to fetch staff: $e');
    }
  }

  Future<void> addStaff(StaffMember staff) async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      if (spreadsheetId.isEmpty) throw AuthException('Spreadsheet ID is not configured.');

      await _authService.ensureSheetsServiceInitialized();

      await _sheetsService.appendRow(
        spreadsheetId,
        GoogleSheetsConfig.staffSheetName,
        staff.toRow(true),
      );
    } catch (e) {
      throw ServerException('Failed to add staff: $e');
    }
  }

  Future<void> updateStaff(StaffMember staff) async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      if (spreadsheetId.isEmpty) throw AuthException('Spreadsheet ID is not configured.');

      await _authService.ensureSheetsServiceInitialized();

      await _sheetsService.updateRow(
        spreadsheetId,
        GoogleSheetsConfig.staffSheetName,
        staff.rowIndex,
        staff.toRow(true),
      );
    } catch (e) {
      throw ServerException('Failed to update staff: $e');
    }
  }

  Future<void> deleteStaff(int rowIndex) async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      if (spreadsheetId.isEmpty) throw AuthException('Spreadsheet ID is not configured.');

      await _authService.ensureSheetsServiceInitialized();

      await _sheetsService.clearRow(
        spreadsheetId,
        GoogleSheetsConfig.staffSheetName,
        rowIndex,
        8,
      );
    } catch (e) {
      throw ServerException('Failed to delete staff: $e');
    }
  }
}
