import 'package:flutter/material.dart';
import '../models/staff_member.dart';
import '../repositories/staff_repository.dart';
import '../core/data_state.dart';
import '../core/exceptions.dart';

class StaffProvider extends ChangeNotifier {
  final StaffRepository _repository;

  DataState<List<StaffMember>> _state = const DataInitial();
  DataState<List<StaffMember>> get state => _state;

  StaffProvider(this._repository);

  Future<void> loadStaff() async {
    _state = const DataLoading();
    notifyListeners();

    try {
      final staffList = await _repository.fetchStaff();
      if (staffList.isEmpty) {
        _state = const DataEmpty();
      } else {
        _state = DataSuccess(staffList);
      }
    } catch (e) {
      _state = DataError(e.toString());
    }
    notifyListeners();
  }

  Future<void> addStaff(StaffMember staff) async {
    try {
      await _repository.addStaff(staff);
      await loadStaff();
    } catch (e) {
      throw CustomException('Failed to add staff: $e');
    }
  }

  Future<void> updateStaff(StaffMember staff) async {
    try {
      await _repository.updateStaff(staff);
      await loadStaff();
    } catch (e) {
      throw CustomException('Failed to update staff: $e');
    }
  }

  Future<void> deleteStaff(int rowIndex) async {
    try {
      await _repository.deleteStaff(rowIndex);
      await loadStaff();
    } catch (e) {
      throw CustomException('Failed to delete staff: $e');
    }
  }
}
