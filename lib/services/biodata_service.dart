import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/biodata_model.dart';
// Note: We would import google_sheets_config or local_excel_service here for full sync.

class BiodataService {
  static const String _storageKey = 'saved_biodatas';

  Future<List<BiodataModel>> getSavedBiodatas() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_storageKey);
    if (jsonStr == null) return [];

    try {
      final List<dynamic> jsonList = jsonDecode(jsonStr);
      return jsonList.map((e) => BiodataModel.fromJson(e)).toList();
    } catch (e) {
      print('Error parsing biodatas: $e');
      return [];
    }
  }

  Future<void> saveBiodata(BiodataModel biodata) async {
    final prefs = await SharedPreferences.getInstance();
    final biodatas = await getSavedBiodatas();

    final index = biodatas.indexWhere((b) => b.id == biodata.id);
    if (index >= 0) {
      biodatas[index] = biodata; // Update existing
    } else {
      biodatas.add(biodata); // Insert new
      // Sync to sheets only on first creation or optionally on every save
      _syncToGoogleSheets(biodata);
    }

    final jsonStr = jsonEncode(biodatas.map((e) => e.toJson()).toList());
    await prefs.setString(_storageKey, jsonStr);
  }

  Future<void> deleteBiodata(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final biodatas = await getSavedBiodatas();
    biodatas.removeWhere((b) => b.id == id);
    final jsonStr = jsonEncode(biodatas.map((e) => e.toJson()).toList());
    await prefs.setString(_storageKey, jsonStr);
  }

  Future<void> _syncToGoogleSheets(BiodataModel biodata) async {
    try {
      print('Syncing Biodata Profile: ${biodata.applicantName} to Google Sheets...');
      // TODO: Call your actual Google Sheets service here.
      // Example:
      // await LocalExcelService().appendRow('Biodata Templates', [
      //   DateTime.now().toIso8601String(),
      //   biodata.id,
      //   biodata.applicantName,
      //   biodata.mobileNumber,
      // ]);
    } catch (e) {
      print('Failed to sync to Google Sheets: $e');
    }
  }
}
