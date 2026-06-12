import '../models/expense_item.dart';
import '../services/google_sheets_service.dart';
import '../services/auth_service.dart';
import '../config/google_sheets_config.dart';
import '../core/exceptions.dart';

class ExpensesRepository {
  final GoogleSheetsService _sheetsService;
  final AuthService _authService;

  ExpensesRepository(this._sheetsService, this._authService);

  Future<List<ExpenseItem>> fetchExpenses() async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      if (spreadsheetId.isEmpty) {
        throw AuthException('Spreadsheet ID is not configured.');
      }
      
      await _authService.ensureSheetsServiceInitialized();

      final rows = await _sheetsService.getRows(
        spreadsheetId,
        GoogleSheetsConfig.expenseSheetName,
      );

      if (rows.isEmpty) return [];

      final List<ExpenseItem> parsedList = [];
      for (int i = 1; i < rows.length; i++) {
        final row = rows[i];
        if (row.isEmpty || row.length == 0 || row[0].toString().trim().isEmpty) continue;
        parsedList.add(ExpenseItem.fromRow(row, rowIndex: i + 1));
      }
      return parsedList;
    } catch (e) {
      throw ServerException('Failed to fetch expenses: $e');
    }
  }

  Future<void> addExpense(ExpenseItem expense) async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      if (spreadsheetId.isEmpty) throw AuthException('Spreadsheet ID is not configured.');

      await _authService.ensureSheetsServiceInitialized();

      await _sheetsService.appendRow(
        spreadsheetId,
        GoogleSheetsConfig.expenseSheetName,
        expense.toRow(),
      );
    } catch (e) {
      throw ServerException('Failed to add expense: $e');
    }
  }

  Future<void> updateExpense(ExpenseItem expense) async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      if (spreadsheetId.isEmpty) throw AuthException('Spreadsheet ID is not configured.');

      await _authService.ensureSheetsServiceInitialized();

      await _sheetsService.updateRow(
        spreadsheetId,
        GoogleSheetsConfig.expenseSheetName,
        expense.rowIndex,
        expense.toRow(),
      );
    } catch (e) {
      throw ServerException('Failed to update expense: $e');
    }
  }

  Future<void> deleteExpense(int rowIndex) async {
    try {
      final spreadsheetId = await _authService.getSpreadsheetId();
      if (spreadsheetId.isEmpty) throw AuthException('Spreadsheet ID is not configured.');

      await _authService.ensureSheetsServiceInitialized();

      await _sheetsService.clearRow(
        spreadsheetId,
        GoogleSheetsConfig.expenseSheetName,
        rowIndex,
        5, // ID, Date, Category, Amount, Description
      );
    } catch (e) {
      throw ServerException('Failed to delete expense: $e');
    }
  }
}
