import 'package:flutter/material.dart';
import '../models/service_item.dart';
import '../repositories/services_repository.dart';
import '../core/data_state.dart';
import '../core/exceptions.dart';

class ServicesProvider extends ChangeNotifier {
  final ServicesRepository _repository;

  DataState<List<ServiceItem>> _state = const DataInitial();
  DataState<List<ServiceItem>> get state => _state;

  ServicesProvider(this._repository);

  Future<void> loadServices() async {
    _state = const DataLoading();
    notifyListeners();

    try {
      final services = await _repository.fetchServices();
      if (services.isEmpty) {
        _state = const DataEmpty();
      } else {
        _state = DataSuccess(services);
      }
    } catch (e) {
      _state = DataError(e.toString());
    }
    notifyListeners();
  }

  Future<void> addService(ServiceItem service) async {
    // Keep current state but maybe notify UI about loading state for overlay
    try {
      await _repository.addService(service);
      await loadServices();
    } catch (e) {
      throw CustomException('Failed to add service: $e');
    }
  }

  Future<void> updateService(ServiceItem service) async {
    try {
      await _repository.updateService(service);
      await loadServices();
    } catch (e) {
      throw CustomException('Failed to update service: $e');
    }
  }

  Future<void> deleteService(int rowIndex) async {
    try {
      await _repository.deleteService(rowIndex);
      await loadServices();
    } catch (e) {
      throw CustomException('Failed to delete service: $e');
    }
  }
}
