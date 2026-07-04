import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:smart_akshaya/models/expense_item.dart';
import 'package:smart_akshaya/models/saved_bill.dart';
import 'package:smart_akshaya/models/service_item.dart';
import 'package:smart_akshaya/models/staff_member.dart';
import 'package:smart_akshaya/providers/saved_bills_provider.dart';
import 'package:smart_akshaya/providers/service_reports_provider.dart';
import 'package:smart_akshaya/repositories/expenses_repository.dart';
import 'package:smart_akshaya/repositories/services_repository.dart';
import 'package:smart_akshaya/repositories/staff_repository.dart';
import 'package:smart_akshaya/config/google_sheets_config.dart';
import 'package:smart_akshaya/services/auth_service.dart';
import 'package:smart_akshaya/services/google_sheets_service.dart';

class FakeServicesRepository implements ServicesRepository {
  final List<ServiceItem> _items;

  FakeServicesRepository([List<ServiceItem>? initialItems])
    : _items = List.of(initialItems ?? []);

  @override
  Future<void> addService(ServiceItem service) async {
    final index = _items.isEmpty
        ? 1
        : _items.map((item) => item.rowIndex).reduce((a, b) => a > b ? a : b) +
              1;
    _items.add(
      ServiceItem(
        rowIndex: index,
        serviceName: service.serviceName,
        website: service.website,
        departmentFee: service.departmentFee,
        serviceCharge: service.serviceCharge,
        commission: service.commission,
        allowEdit: service.allowEdit,
        followupDays: service.followupDays,
        defaultWallet: service.defaultWallet,
      ),
    );
  }

  @override
  Future<List<ServiceItem>> fetchServices() async {
    return List.of(_items);
  }

  @override
  Future<void> deleteService(int rowIndex) async {
    _items.removeWhere((element) => element.rowIndex == rowIndex);
  }

  @override
  Future<void> updateService(ServiceItem service) async {
    final index = _items.indexWhere(
      (element) => element.rowIndex == service.rowIndex,
    );
    if (index < 0) {
      throw Exception('Service not found');
    }
    _items[index] = service;
  }
}

class FakeStaffRepository implements StaffRepository {
  final List<StaffMember> _items;

  FakeStaffRepository([List<StaffMember>? initialItems])
    : _items = List.of(initialItems ?? []);

  @override
  Future<void> addStaff(StaffMember staff) async {
    final nextId = _items.isEmpty
        ? 1
        : _items
                  .map((item) => int.tryParse(item.id) ?? 0)
                  .reduce((a, b) => a > b ? a : b) +
              1;
    _items.add(
      StaffMember(
        rowIndex: nextId,
        id: '$nextId',
        name: staff.name,
        address: staff.address,
        mobile: staff.mobile,
        email: staff.email,
        userType: staff.userType,
        status: staff.status,
        password: staff.password,
        synced: staff.synced,
      ),
    );
  }

  @override
  Future<List<StaffMember>> fetchStaff() async {
    return List.of(_items);
  }

  @override
  Future<void> deleteStaff(int rowIndex) async {
    _items.removeWhere((element) => element.rowIndex == rowIndex);
  }

  @override
  Future<void> updateStaff(StaffMember staff) async {
    final index = _items.indexWhere(
      (element) => element.rowIndex == staff.rowIndex,
    );
    if (index < 0) {
      throw Exception('Staff member not found');
    }
    _items[index] = staff;
  }
}

class FakeExpensesRepository implements ExpensesRepository {
  final List<ExpenseItem> _items;

  FakeExpensesRepository([List<ExpenseItem>? initialItems])
    : _items = List.of(initialItems ?? []);

  @override
  Future<void> addExpense(ExpenseItem expense) async {
    _items.add(expense);
  }

  @override
  Future<List<ExpenseItem>> fetchExpenses() async {
    return List.of(_items);
  }

  @override
  Future<void> deleteExpense(int rowIndex) async {
    _items.removeWhere((element) => element.rowIndex == rowIndex);
  }

  @override
  Future<void> updateExpense(ExpenseItem expense) async {
    final index = _items.indexWhere(
      (element) => element.rowIndex == expense.rowIndex,
    );
    if (index < 0) {
      throw Exception('Expense not found');
    }
    _items[index] = expense;
  }
}

class FakeSavedBillsProvider extends ChangeNotifier
    implements SavedBillsProvider {
  bool _isLoading = false;
  String _searchQuery = '';

  final List<SavedBill> _internalBills;

  FakeSavedBillsProvider([List<SavedBill>? items])
    : _internalBills = List.of(items ?? []);

  @override
  List<SavedBill> get bills => _internalBills.where((b) {
    if (_searchQuery.isEmpty) return true;
    final query = _searchQuery.toLowerCase();
    return b.customerName.toLowerCase().contains(query) ||
        b.mobile.contains(query);
  }).toList();

  @override
  bool get isLoading => _isLoading;

  @override
  String get searchQuery => _searchQuery;

  @override
  List<SavedBill> get allBills => _internalBills;

  @override
  int get totalCustomers => _internalBills.map((b) => b.mobile).toSet().length;

  @override
  int get totalItems => _internalBills.fold(0, (sum, b) => sum + b.quantity);

  @override
  String get oldestSaveText {
    if (_internalBills.isEmpty) return 'No saves';
    final now = DateTime.now();
    final oldest = _internalBills
        .where((b) => b.date.isNotEmpty && b.time.isNotEmpty)
        .map((b) {
          final parts = b.date.split('-');
          final timeParts = b.time.split(':');
          return DateTime(
            int.parse(parts[0]),
            int.parse(parts[1]),
            int.parse(parts[2]),
            int.parse(timeParts[0]),
            int.parse(timeParts[1]),
          );
        })
        .fold<DateTime?>(
          null,
          (prev, element) =>
              prev == null || element.isBefore(prev) ? element : prev,
        );
    if (oldest == null) return 'No saves';
    final diff = now.difference(oldest);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  @override
  Future<void> fetchSavedBills() async {
    _isLoading = true;
    notifyListeners();
    await Future<void>.delayed(Duration.zero);
    _isLoading = false;
    notifyListeners();
  }
}

class FakeServiceReportsProvider extends ChangeNotifier
    implements ServiceReportsProvider {
  final List<SavedBill> _reports;
  bool _isLoading = false;
  String _searchQuery = '';
  DateTime? _fromDate;
  DateTime? _toDate;
  String? _selectedUser;

  FakeServiceReportsProvider([List<SavedBill>? reports])
    : _reports = List.of(reports ?? []);

  @override
  bool get isLoading => _isLoading;

  @override
  String get searchQuery => _searchQuery;

  @override
  List<SavedBill> get allReports => _reports;

  @override
  DateTime? get fromDate => _fromDate;

  @override
  DateTime? get toDate => _toDate;

  @override
  String? get selectedUser => _selectedUser;

  @override
  List<String> get availableUsers {
    final users = _reports
        .map((r) => r.staffName)
        .where((name) => name.isNotEmpty)
        .toSet()
        .toList();
    users.sort();
    return users;
  }

  @override
  List<SavedBill> get filteredReports {
    return _reports.where((report) {
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        if (!report.customerName.toLowerCase().contains(query) &&
            !report.mobile.contains(query) &&
            !report.services.toLowerCase().contains(query)) {
          return false;
        }
      }
      if (_selectedUser != null && _selectedUser != 'Display all') {
        if (report.staffName != _selectedUser) return false;
      }
      if (_fromDate != null || _toDate != null) {
        try {
          final reportDate = DateTime.parse(report.date);
          if (_fromDate != null) {
            final fromDateOnly = DateTime(
              _fromDate!.year,
              _fromDate!.month,
              _fromDate!.day,
            );
            if (reportDate.isBefore(fromDateOnly)) return false;
          }
          if (_toDate != null) {
            final toDateOnly = DateTime(
              _toDate!.year,
              _toDate!.month,
              _toDate!.day,
            );
            if (reportDate.isAfter(toDateOnly)) return false;
          }
        } catch (_) {
          return true;
        }
      }
      return true;
    }).toList();
  }

  @override
  double get totalWalletCharge =>
      filteredReports.fold(0.0, (sum, item) => sum + item.gpayUpi);

  @override
  double get totalServiceCharge =>
      filteredReports.fold(0.0, (sum, item) => sum + item.cash);

  @override
  double get totalAmount =>
      filteredReports.fold(0.0, (sum, item) => sum + item.totalAmount);

  @override
  void clearFilters() {
    _fromDate = null;
    _toDate = null;
    _selectedUser = null;
    _searchQuery = '';
    notifyListeners();
  }

  @override
  void setDateRange(DateTime? from, DateTime? to) {
    _fromDate = from;
    _toDate = to;
    notifyListeners();
  }

  @override
  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  @override
  void setSelectedUser(String? user) {
    _selectedUser = user;
    notifyListeners();
  }

  @override
  Future<void> fetchReports() async {
    _isLoading = true;
    notifyListeners();
    await Future<void>.delayed(Duration.zero);
    _isLoading = false;
    notifyListeners();
  }

  @override
  Future<void> deleteReport(int rowIndex) async {
    _isLoading = true;
    notifyListeners();
    _reports.removeWhere((r) => r.rowIndex == rowIndex);
    _isLoading = false;
    notifyListeners();
  }
}

class FakeGoogleSheetsService implements GoogleSheetsServiceBase {
  final Map<String, List<List<dynamic>>> _sheets = {};
  bool _initialized = true;

  @override
  bool get isInitialized => _initialized;

  @override
  Future<void> appendRow(
    String spreadsheetId,
    String sheetName,
    List<dynamic> row,
  ) async {
    final key = '$spreadsheetId::$sheetName';
    final sheet = _sheets.putIfAbsent(key, () => []);
    sheet.add(row);
  }

  @override
  Future<String> createNewSpreadsheet() async {
    const newId = 'test-spreadsheet-id';
    await _writeStaffHeaders(newId);
    await _writeServiceHeaders(newId);
    await _writeCustomerHeaders(newId);
    await _writeExpenseHeaders(newId);
    return newId;
  }

  @override
  Future<List<List<dynamic>>> getRows(
    String spreadsheetId,
    String sheetName,
  ) async {
    final key = '$spreadsheetId::$sheetName';
    return _sheets[key] ?? [];
  }

  @override
  Future<void> init(String credentialsJson) async {
    _initialized = true;
  }

  @override
  Future<String> getOrCreateSpreadsheet(String? spreadsheetId) async {
    if (spreadsheetId == null || spreadsheetId.isEmpty) {
      return createNewSpreadsheet();
    }
    return spreadsheetId;
  }

  @override
  Future<void> updateRow(
    String spreadsheetId,
    String sheetName,
    int rowIndex,
    List<dynamic> row,
  ) async {
    final key = '$spreadsheetId::$sheetName';
    final sheet = _sheets.putIfAbsent(key, () => []);
    final index = rowIndex - 1;
    if (index < 0 || index >= sheet.length) {
      throw Exception('Row index out of range');
    }
    sheet[index] = row;
  }

  @override
  Future<void> updateRowColumns(
    String spreadsheetId,
    String sheetName,
    int rowIndex,
    Map<String, dynamic> columnUpdates,
  ) async {
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

  @override
  Future<void> clearRow(
    String spreadsheetId,
    String sheetName,
    int rowIndex,
    int numColumns,
  ) async {
    final key = '$spreadsheetId::$sheetName';
    final sheet = _sheets.putIfAbsent(key, () => []);
    final index = rowIndex - 1;
    if (index < 0 || index >= sheet.length) {
      throw Exception('Row index out of range');
    }
    sheet[index] = List.filled(numColumns, '');
  }

  Future<void> _writeStaffHeaders(String spreadsheetId) async {
    await appendRow(spreadsheetId, GoogleSheetsConfig.staffSheetName, [
      'ID',
      'Name',
      'Address',
      'Mobile',
      'Email',
      'User Type',
      'Status',
      'Password',
      'Synced',
    ]);
  }

  Future<void> _writeServiceHeaders(String spreadsheetId) async {
    await appendRow(spreadsheetId, GoogleSheetsConfig.serviceSheetName, [
      'Service Name',
      'Website',
      'Department Fee',
      'Service Charge',
      'Commission',
      'Allow Edit',
      'Followup Days',
      'Default Wallet',
    ]);
  }

  Future<void> _writeCustomerHeaders(String spreadsheetId) async {
    await appendRow(spreadsheetId, GoogleSheetsConfig.customerSheetName, [
      'ID',
      'Name',
      'Mobile',
      'Email',
      'Address',
      'Remarks',
      'Total Paid',
      'GPay/UPI',
      'Cash',
      'Balance',
    ]);
  }

  Future<void> _writeExpenseHeaders(String spreadsheetId) async {
    await appendRow(spreadsheetId, GoogleSheetsConfig.expenseSheetName, [
      'ID',
      'Date',
      'Category',
      'Amount',
      'Description',
    ]);
  }

  @override
  Future<List<Map<String, dynamic>>> fetchDriveFiles(String folderId) async {
    return [
      {
        'id': '1',
        'title': 'Form_A.pdf',
        'mime_type': 'application/pdf',
        'drive_link': 'https://drive.google.com/file/d/1/view',
      },
      {
        'id': '2',
        'title': 'Form_B.pdf',
        'mime_type': 'application/pdf',
        'drive_link': 'https://drive.google.com/file/d/2/view',
      },
    ];
  }

  @override
  Future<Uint8List> downloadDriveFile(String fileId) async {
    return Uint8List(0);
  }
}

class FakeAuthService implements AuthServiceBase {
  final String spreadsheetId;

  FakeAuthService(this.spreadsheetId);

  @override
  Future<String> getSpreadsheetId() async => spreadsheetId;

  @override
  Future<void> ensureSheetsServiceInitialized() async {}

  @override
  Future<String> getDriveFolderId() async => 'test-folder-id';
}

class TestAssetBundle extends CachingAssetBundle {
  final Map<String, String> assets;

  TestAssetBundle(this.assets);

  @override
  Future<ByteData> load(String key) {
    final contents = assets[key];
    if (contents == null) {
      throw FlutterError('Missing asset: $key');
    }
    final encoded = utf8.encode(contents);
    return Future.value(ByteData.view(Uint8List.fromList(encoded).buffer));
  }
}
