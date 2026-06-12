import 'package:flutter_test/flutter_test.dart';
import 'package:smart_akshaya/models/expense_item.dart';
import 'package:smart_akshaya/providers/expenses_provider.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  group('ExpensesProvider', () {
    late FakeExpensesRepository repository;
    late ExpensesProvider provider;

    setUp(() {
      repository = FakeExpensesRepository([
        ExpenseItem(
          id: '1',
          date: '2024-01-01',
          category: 'Travel',
          amount: '100.00',
          description: 'Taxi',
          rowIndex: 1,
        ),
      ]);
      provider = ExpensesProvider(repository);
    });

    test('fetchExpenses loads expenses', () async {
      await provider.fetchExpenses();
      expect(provider.expenses, hasLength(1));
      expect(provider.expenses.first.category, 'Travel');
      expect(provider.isLoading, isFalse);
    });

    test('addExpense persists a new expense', () async {
      await provider.fetchExpenses();
      final newExpense = ExpenseItem(
        id: '2',
        date: '2024-02-02',
        category: 'Office',
        amount: '200.00',
        description: 'Printer',
        rowIndex: 2,
      );
      final result = await provider.addExpense(newExpense);
      expect(result, isTrue);
      expect(provider.expenses, hasLength(2));
      expect(provider.expenses.any((expense) => expense.category == 'Office'), isTrue);
    });

    test('updateExpense changes an existing record', () async {
      await provider.fetchExpenses();
      final existing = provider.expenses.first;
      final updated = ExpenseItem(
        id: existing.id,
        date: existing.date,
        category: 'Travel Updated',
        amount: existing.amount,
        description: existing.description,
        rowIndex: existing.rowIndex,
      );
      final result = await provider.updateExpense(updated);
      expect(result, isTrue);
      expect(provider.expenses.first.category, 'Travel Updated');
    });

    test('deleteExpense removes record', () async {
      await provider.fetchExpenses();
      final existing = provider.expenses.first;
      final result = await provider.deleteExpense(existing.rowIndex);
      expect(result, isTrue);
      expect(provider.expenses, isEmpty);
    });
  });
}
