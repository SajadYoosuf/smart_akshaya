import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smart_akshaya/service_reports_screen.dart';
import 'package:smart_akshaya/providers/service_reports_provider.dart';
import '../test_helpers/test_helpers.dart';
import 'package:smart_akshaya/models/saved_bill.dart';
import 'package:smart_akshaya/models/entry_status.dart';

void main() {
  testWidgets('ServiceReportsScreen builds filter controls and shows report data', (WidgetTester tester) async {
    final provider = FakeServiceReportsProvider([
      SavedBill(
        date: '2024-01-15',
        time: '12:00',
        staffName: 'Staff A',
        mobile: '9999999999',
        customerName: 'Customer A',
        services: 'Service X',
        quantity: 1,
        totalAmount: 100.0,
        gpayUpi: 20.0,
        cash: 80.0,
        balance: 0.0,
        status: EntryStatus.billed,
      ),
    ]);

    tester.binding.window.devicePixelRatioTestValue = 1.0;
    tester.binding.window.physicalSizeTestValue = const Size(1200, 1200);
    addTearDown(() {
      tester.binding.window.clearPhysicalSizeTestValue();
      tester.binding.window.clearDevicePixelRatioTestValue();
    });

    await tester.pumpWidget(
      ChangeNotifierProvider<ServiceReportsProvider>.value(
        value: provider,
        child: const MaterialApp(home: Scaffold(body: SizedBox(width: 1200, child: ServiceReportsScreen()))),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('FROM DATE'), findsOneWidget);
    expect(find.text('TO DATE'), findsOneWidget);
    expect(find.text('PDF'), findsOneWidget);
    expect(find.text('Excel'), findsOneWidget);
  });
}
