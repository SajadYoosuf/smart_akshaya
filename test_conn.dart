import 'package:googleapis_auth/auth_io.dart';
import 'package:googleapis/sheets/v4.dart' as sheets;
import 'dart:convert';
import 'dart:io';

void main() async {
  try {
    final content = await File('assets/credentials/google_sheets_credentials.json').readAsString();
    final creds = ServiceAccountCredentials.fromJson(json.decode(content));
    final client = await clientViaServiceAccount(creds, ['https://www.googleapis.com/auth/spreadsheets']);
    final api = sheets.SheetsApi(client);
    final res = await api.spreadsheets.values.get('1tWRoBfnDFZqezA_3C5LPOBZfN_E4XaLB4okZ8DrM20U', 'staff details!A:Z');
    print('SUCCESS! Rows found: ${res.values?.length}');
    exit(0);
  } catch (e) {
    print('ERROR: $e');
    exit(1);
  }
}
