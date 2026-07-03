import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smart_akshaya/expenses_screen.dart';
import 'package:smart_akshaya/providers/expenses_provider.dart';
import 'package:smart_akshaya/models/expense_item.dart';
import '../test_helpers/test_helpers.dart';

void main() {
  testWidgets('ExpensesScreen shows form and existing expense list', (WidgetTester tester) async {
    final fakeRepository = FakeExpensesRepository([
      ExpenseItem(
        id: '1',
        date: '2024-01-01',
        category: 'Travel',
        amount: '150',
        description: 'Taxi fare',
        rowIndex: 1,
      ),
    ]);

    tester.binding.window.devicePixelRatioTestValue = 1.0;
    tester.binding.window.physicalSizeTestValue = const Size(1200, 1200);
    addTearDown(() {
      tester.binding.window.clearPhysicalSizeTestValue();
      tester.binding.window.clearDevicePixelRatioTestValue();
    });

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<ExpensesProvider>(
            create: (_) => ExpensesProvider(fakeRepository),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: SizedBox(width: 1200, child: ExpensesScreen()))),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Add Expense'), findsOneWidget);
    expect(find.text('Travel'), findsOneWidget);
    expect(find.text('Taxi fare'), findsOneWidget);
  });
}
