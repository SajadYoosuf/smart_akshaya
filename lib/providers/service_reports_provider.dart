import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/google_sheets_config.dart';
import '../services/auth_service.dart';
import '../models/saved_bill.dart';
import '../models/entry_status.dart';

class ServiceReportsProvider extends ChangeNotifier {
  List<SavedBill> _allReports = [];
  bool _isLoading = false;
  String _searchQuery = '';
  
  // Filters
  DateTime? _fromDate;
  DateTime? _toDate;
  String? _selectedUser;

  bool get isLoading => _isLoading;
  String get searchQuery => _searchQuery;

  // Filter properties
  DateTime? get fromDate => _fromDate;
  DateTime? get toDate => _toDate;
  String? get selectedUser => _selectedUser;

  // Get distinct users for the dropdown
  List<String> get availableUsers {
    final users = _allReports.map((r) => r.staffName).where((name) => name.isNotEmpty).toSet().toList();
    users.sort();
    return users;
  }

  // Filtered reports
  List<SavedBill> get filteredReports {
    return _allReports.where((report) {
      // 1. Search Query
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        if (!report.customerName.toLowerCase().contains(query) &&
            !report.mobile.contains(query) &&
            !report.services.toLowerCase().contains(query)) {
          return false;
        }
      }

      // 2. User Filter
      if (_selectedUser != null && _selectedUser != 'Display all') {
        if (report.staffName != _selectedUser) return false;
      }

      // 3. Date Range Filter
      if (_fromDate != null || _toDate != null) {
        try {
          // Assuming report.date is in format yyyy-MM-dd
          final reportDate = DateFormat('yyyy-MM-dd').parse(report.date);
          
          if (_fromDate != null) {
            final fromDateOnly = DateTime(_fromDate!.year, _fromDate!.month, _fromDate!.day);
            if (reportDate.isBefore(fromDateOnly)) return false;
          }
          if (_toDate != null) {
            final toDateOnly = DateTime(_toDate!.year, _toDate!.month, _toDate!.day);
            if (reportDate.isAfter(toDateOnly)) return false;
          }
        } catch (e) {
          // If date parsing fails, we include it by default or exclude? Let's include to be safe
        }
      }

      return true;
    }).toList();
  }

  double get totalWalletCharge => filteredReports.fold(0.0, (sum, item) => sum + item.gpayUpi);
  double get totalServiceCharge => filteredReports.fold(0.0, (sum, item) => sum + item.cash);
  double get totalAmount => filteredReports.fold(0.0, (sum, item) => sum + item.totalAmount);

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setDateRange(DateTime? from, DateTime? to) {
    _fromDate = from;
    _toDate = to;
    notifyListeners();
  }

  void setSelectedUser(String? user) {
    _selectedUser = user;
    notifyListeners();
  }

  void clearFilters() {
    _fromDate = null;
    _toDate = null;
    _selectedUser = null;
    _searchQuery = '';
    notifyListeners();
  }

  Future<void> fetchReports() async {
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
        _allReports = rows
            .skip(1)
            .map((row) => SavedBill.fromRow(row))
            .where((b) => b.status == EntryStatus.completed || b.status == EntryStatus.billed)
            .toList();
      } else {
        _allReports = [];
      }
    } catch (e) {
      debugPrint('Error fetching service reports: $e');
      _allReports = [];
    }

    _isLoading = false;
    notifyListeners();
  }
}
