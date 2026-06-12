import 'package:excel/excel.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_akshaya/models/entry_status.dart';
import 'package:smart_akshaya/models/expense_item.dart';
import 'package:smart_akshaya/models/saved_bill.dart';
import 'package:smart_akshaya/models/staff_member.dart';
import 'package:smart_akshaya/repositories/expenses_repository.dart';
import 'package:smart_akshaya/repositories/staff_repository.dart';
import 'package:smart_akshaya/services/auth_service.dart';
import 'package:smart_akshaya/utils/export_utils.dart';
import '../test_helpers/test_helpers.dart';

void main() {
  late FakeGoogleSheetsService fakeSheets;
  late FakeAuthService fakeAuth;
  late StaffRepository staffRepository;
  late ExpensesRepository expensesRepository;

  setUp(() async {
    fakeSheets = FakeGoogleSheetsService();
    fakeAuth = FakeAuthService('test-spreadsheet-id');
    await fakeSheets.createNewSpreadsheet();
    staffRepository = StaffRepository(fakeSheets, fakeAuth);
    expensesRepository = ExpensesRepository(fakeSheets, fakeAuth);
  });

  test('StaffRepository should perform add, fetch, update, and delete operations with real row data', () async {
    final staff = StaffMember(
      rowIndex: 0,
      id: '101',
      name: 'Test User',
      address: '123 Test Street',
      mobile: '9876543210',
      email: 'test.user@example.com',
      userType: 'staff',
      status: 'Active',
      password: 'secret',
    );

    await staffRepository.addStaff(staff);

    final rows = await fakeSheets.getRows('test-spreadsheet-id', 'Staff Details');
    expect(rows.length, 2); // header + one data row
    expect(rows[1][0], equals('101'));
    expect(rows[1][1], equals('Test User'));
    expect(rows[1][2], equals('123 Test Street'));

    final fetched = await staffRepository.fetchStaff();
    expect(fetched.length, 1);
    expect(fetched.first.name, 'Test User');
    expect(fetched.first.email, 'test.user@example.com');
    expect(fetched.first.userType, 'staff');

    final updatedStaff = StaffMember(
      rowIndex: 2,
      id: '101',
      name: 'Updated User',
      address: '456 Changed Road',
      mobile: '9876543210',
      email: 'updated@example.com',
      userType: 'admin',
      status: 'Active',
      password: 'newpass',
    );

    await staffRepository.updateStaff(updatedStaff);
    final updatedFetched = await staffRepository.fetchStaff();
    expect(updatedFetched.length, 1);
    expect(updatedFetched.first.name, 'Updated User');
    expect(updatedFetched.first.address, '456 Changed Road');
    expect(updatedFetched.first.userType, 'admin');

    await staffRepository.deleteStaff(2);
    final afterDelete = await staffRepository.fetchStaff();
    expect(afterDelete, isEmpty);
  });

  test('ExpensesRepository should add, fetch, update, and delete rows correctly', () async {
    final expense = ExpenseItem(
      id: 'E-500',
      date: '2025-06-12',
      category: 'Office',
      amount: '1500.00',
      description: 'Stationery purchase',
    );

    await expensesRepository.addExpense(expense);
    final expenseRows = await fakeSheets.getRows('test-spreadsheet-id', 'Expense Management');
    expect(expenseRows.length, 2);
    expect(expenseRows[1][0], 'E-500');
    expect(expenseRows[1][3], '1500.00');

    final fetchedExpenses = await expensesRepository.fetchExpenses();
    expect(fetchedExpenses.length, 1);
    expect(fetchedExpenses.first.category, 'Office');
    expect(fetchedExpenses.first.amount, '1500.00');

    final updatedExpense = ExpenseItem(
      id: 'E-500',
      date: '2025-06-13',
      category: 'Office',
      amount: '1550.00',
      description: 'Stationery plus snacks',
      rowIndex: 2,
    );

    await expensesRepository.updateExpense(updatedExpense);
    final updatedExpenseRows = await fakeSheets.getRows('test-spreadsheet-id', 'Expense Management');
    expect(updatedExpenseRows[1][1], '2025-06-13');
    expect(updatedExpenseRows[1][3], '1550.00');
    expect(updatedExpenseRows[1][4], 'Stationery plus snacks');

    await expensesRepository.deleteExpense(2);
    final afterDeleteExpenses = await expensesRepository.fetchExpenses();
    expect(afterDeleteExpenses, isEmpty);
  });

  test('ExportUtils should generate valid PDF and Excel bytes for saved bills', () async {
    final reports = [
      SavedBill(
        date: '2025-06-12',
        time: '10:00',
        staffName: 'Staff Test',
        mobile: '9999999999',
        customerName: 'Customer One',
        services: 'Service A',
        quantity: 2,
        totalAmount: 250.0,
        gpayUpi: 50.0,
        cash: 200.0,
        balance: 0.0,
        status: EntryStatus.billed,
      ),
      SavedBill(
        date: '2025-06-13',
        time: '14:30',
        staffName: 'Staff Test',
        mobile: '8888888888',
        customerName: 'Customer Two',
        services: 'Service B',
        quantity: 1,
        totalAmount: 120.0,
        gpayUpi: 20.0,
        cash: 100.0,
        balance: 0.0,
        status: EntryStatus.billed,
      ),
    ];

    final pdfBytes = await ExportUtils.createPdfReportBytes(reports, 'Test Report');
    expect(pdfBytes, isNotEmpty);
    expect(String.fromCharCodes(pdfBytes.take(4)), '%PDF');

    final excelBytes = await ExportUtils.createExcelReportBytes(reports, 'Test Report');
    expect(excelBytes, isNotEmpty);

    final excel = Excel.decodeBytes(excelBytes);
    expect(excel.tables.keys, contains('Reports'));
    final sheet = excel.tables['Reports'];
    expect(sheet?.maxRows, greaterThanOrEqualTo(3));
    final row0col0 = sheet?.rows[0][0] as Data;
    final row1col2 = sheet?.rows[1][2] as Data;
    final row2col2 = sheet?.rows[2][2] as Data;
    expect((row0col0.value as TextCellValue).value.toString(), '#');
    expect((row1col2.value as TextCellValue).value.toString(), 'Customer One');
    expect((row2col2.value as TextCellValue).value.toString(), 'Customer Two');
  });
}
