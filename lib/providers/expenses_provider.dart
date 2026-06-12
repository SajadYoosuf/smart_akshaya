import 'package:flutter/material.dart';
import '../models/expense_item.dart';
import '../repositories/expenses_repository.dart';
import '../core/exceptions.dart';

class ExpensesProvider extends ChangeNotifier {
  final ExpensesRepository _repository;

  ExpensesProvider(this._repository);

  List<ExpenseItem> _expenses = [];
  bool _isLoading = false;
  String? _error;

  List<ExpenseItem> get expenses => _expenses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchExpenses() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _expenses = await _repository.fetchExpenses();
    } on ServerException catch (e) {
      _error = e.message;
    } on AuthException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'An unexpected error occurred.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addExpense(ExpenseItem expense) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.addExpense(expense);
      await fetchExpenses(); // Refresh the list
      return true;
    } on ServerException catch (e) {
      _error = e.message;
      return false;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = 'An unexpected error occurred while adding.';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateExpense(ExpenseItem expense) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.updateExpense(expense);
      await fetchExpenses(); // Refresh the list
      return true;
    } on ServerException catch (e) {
      _error = e.message;
      return false;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = 'An unexpected error occurred while updating.';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteExpense(int rowIndex) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.deleteExpense(rowIndex);
      await fetchExpenses(); // Refresh the list
      return true;
    } on ServerException catch (e) {
      _error = e.message;
      return false;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = 'An unexpected error occurred while deleting.';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
