import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_akshaya/application_forms_screen.dart';
import '../test_helpers/test_helpers.dart';

void main() {
  testWidgets('ApplicationFormsScreen loads forms from Google Drive folder', (WidgetTester tester) async {
    final fakeSheetsService = FakeGoogleSheetsService();
    final fakeAuthService = FakeAuthService('test-spreadsheet-id');

    tester.binding.window.devicePixelRatioTestValue = 1.0;
    tester.binding.window.physicalSizeTestValue = const Size(1200, 1200);
    addTearDown(() {
      tester.binding.window.clearPhysicalSizeTestValue();
      tester.binding.window.clearDevicePixelRatioTestValue();
    });

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ApplicationFormsScreen(
            sheetsService: fakeSheetsService,
            authService: fakeAuthService,
            folderId: 'test-folder',
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Application Forms'), findsOneWidget);
    expect(find.text('Form_A.pdf'), findsOneWidget);
    expect(find.text('Form_B.pdf'), findsOneWidget);
  });
}
