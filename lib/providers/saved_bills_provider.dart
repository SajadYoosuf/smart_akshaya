import 'package:flutter/material.dart';
import 'package:smart_akshaya/config/google_sheets_config.dart';
import '../services/google_sheets_service.dart';
import '../services/auth_service.dart';
import '../models/saved_bill.dart';
import '../models/entry_status.dart';

class SavedBillsProvider extends ChangeNotifier {
  List<SavedBill> _bills = [];
  bool _isLoading = false;
  String _searchQuery = '';

  List<SavedBill> get bills => _bills.where((b) {
    if (_searchQuery.isEmpty) return true;
    final query = _searchQuery.toLowerCase();
    return b.customerName.toLowerCase().contains(query) ||
        b.mobile.contains(query);
  }).toList();

  bool get isLoading => _isLoading;
  String get searchQuery => _searchQuery;

  int get totalCustomers => _bills.map((b) => b.mobile).toSet().length;
  int get totalItems => _bills.fold(0, (sum, b) => sum + b.quantity);

  String get oldestSaveText {
    if (_bills.isEmpty) return 'No saves';
    try {
      final now = DateTime.now();
      DateTime oldest = now;
      for (var b in _bills) {
        if (b.date.isEmpty || b.time.isEmpty) continue;
        final parts = b.date.split('-');
        final timeParts = b.time.split(':');
        if (parts.length == 3 && timeParts.length == 2) {
          final dt = DateTime(
            int.parse(parts[0]),
            int.parse(parts[1]),
            int.parse(parts[2]),
            int.parse(timeParts[0]),
            int.parse(timeParts[1]),
          );
          if (dt.isBefore(oldest)) {
            oldest = dt;
          }
        }
      }
      final diff = now.difference(oldest);
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (e) {
      return 'Unknown';
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> fetchSavedBills() async {
    _isLoading = true;
    notifyListeners();

    try {
      final sheetsService = AuthService().sheetsService;
      final spreadsheetId = await AuthService().getSpreadsheetId();
      await AuthService().ensureSheetsServiceInitialized();

      final rows = await sheetsService.getRows(
        spreadsheetId,
        GoogleSheetsConfig.serviceEntrySheetName,
      );

      if (rows.length > 1) {
        _bills = rows
            .skip(1)
            .map((row) => SavedBill.fromRow(row))
            .where((b) => b.status == EntryStatus.saved)
            .toList();
      } else {
        _bills = [];
      }
    } catch (e) {
      debugPrint('Error fetching saved bills: $e');
      _bills = [];
    }

    _isLoading = false;
    notifyListeners();
  }
}
