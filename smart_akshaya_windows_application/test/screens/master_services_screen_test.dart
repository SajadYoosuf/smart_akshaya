import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smart_akshaya/master_services_screen.dart';
import 'package:smart_akshaya/providers/services_provider.dart';
import 'package:smart_akshaya/models/service_item.dart';
import '../test_helpers/test_helpers.dart';

void main() {
  testWidgets('MasterServicesScreen shows add service and can open dialog', (WidgetTester tester) async {
    final fakeRepository = FakeServicesRepository([
      ServiceItem(
        rowIndex: 1,
        serviceName: 'Existing Service',
        website: 'https://example.com',
        departmentFee: '10.00',
        serviceCharge: '100.00',
        commission: '5.00',
        allowEdit: true,
        followupDays: '7',
        defaultWallet: 'CASH',
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
          ChangeNotifierProvider<ServicesProvider>(
            create: (_) => ServicesProvider(fakeRepository),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: MasterServicesScreen())),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Add Service'), findsOneWidget);
    expect(find.text('Existing Service'), findsOneWidget);

    await tester.tap(find.text('Add Service'));
    await tester.pumpAndSettle();

    expect(find.text('Service name'), findsOneWidget);
    expect(find.text('Save service'), findsOneWidget);
  });
}
