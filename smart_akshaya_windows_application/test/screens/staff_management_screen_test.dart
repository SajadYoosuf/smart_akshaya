import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smart_akshaya/providers/staff_provider.dart';
import 'package:smart_akshaya/staff_management_screen.dart';
import 'package:smart_akshaya/models/staff_member.dart';
import '../test_helpers/test_helpers.dart';

void main() {
  testWidgets('StaffManagementScreen displays add staff form and staff list', (WidgetTester tester) async {
    final fakeRepository = FakeStaffRepository([
      StaffMember(
        rowIndex: 1,
        id: '1',
        name: 'Alice',
        address: '123 Main St',
        mobile: '9999999999',
        email: 'alice@example.com',
        userType: 'staff',
        status: 'Active',
        password: 'password',
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
          ChangeNotifierProvider<StaffProvider>(
            create: (_) => StaffProvider(fakeRepository),
          ),
        ],
        child: const MaterialApp(home: Scaffold(body: StaffManagementScreen())),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Save staff'), findsOneWidget);
    expect(find.text('Alice'), findsOneWidget);
  });
}
