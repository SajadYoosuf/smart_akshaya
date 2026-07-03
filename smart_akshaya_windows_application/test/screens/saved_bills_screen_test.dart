import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smart_akshaya/saved_bills_screen.dart';
import 'package:smart_akshaya/providers/saved_bills_provider.dart';
import '../test_helpers/test_helpers.dart';
import 'package:smart_akshaya/models/saved_bill.dart';
import 'package:smart_akshaya/models/entry_status.dart';

void main() {
  testWidgets('SavedBillsScreen displays summary cards and saved bills', (WidgetTester tester) async {
    final provider = FakeSavedBillsProvider([
      SavedBill(
        date: '2024-01-01',
        time: '10:00',
        staffName: 'Staff A',
        mobile: '9999999999',
        customerName: 'Customer A',
        services: 'Service A',
        quantity: 1,
        totalAmount: 120.0,
        gpayUpi: 50.0,
        cash: 70.0,
        balance: 0.0,
        status: EntryStatus.saved,
      ),
    ]);

    tester.binding.window.devicePixelRatioTestValue = 1.0;
    tester.binding.window.physicalSizeTestValue = const Size(1200, 1200);
    addTearDown(() {
      tester.binding.window.clearPhysicalSizeTestValue();
      tester.binding.window.clearDevicePixelRatioTestValue();
    });

    await tester.pumpWidget(
      ChangeNotifierProvider<SavedBillsProvider>.value(
        value: provider,
        child: const MaterialApp(home: Scaffold(body: SizedBox(width: 1200, child: SavedBillsScreen()))),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Saved Bills'), findsOneWidget);
    expect(find.text('CUSTOMERS'), findsOneWidget);
    expect(find.text('1'), findsWidgets);
  });
}
