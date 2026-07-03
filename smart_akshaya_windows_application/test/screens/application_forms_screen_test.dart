import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_akshaya/application_forms_screen.dart';
import '../test_helpers/test_helpers.dart';

void main() {
  testWidgets('ApplicationFormsScreen loads forms from injected asset bundle', (WidgetTester tester) async {
    final assetBundle = TestAssetBundle({
      'assets/forms_data.json':
          '[{"title":"Form A","subtitle":"Subtitle A","path":"/a"},{"title":"Form B","subtitle":"Subtitle B","path":"/b"}]',
    });

    tester.binding.window.devicePixelRatioTestValue = 1.0;
    tester.binding.window.physicalSizeTestValue = const Size(1200, 1200);
    addTearDown(() {
      tester.binding.window.clearPhysicalSizeTestValue();
      tester.binding.window.clearDevicePixelRatioTestValue();
    });

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: ApplicationFormsScreen(assetBundle: assetBundle)),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Application Forms'), findsOneWidget);
    expect(find.text('Form A'), findsOneWidget);
    expect(find.text('Form B'), findsOneWidget);
  });
}
