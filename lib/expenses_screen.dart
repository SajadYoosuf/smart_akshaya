import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'providers/expenses_provider.dart';
import 'models/expense_item.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  final _dateController = TextEditingController();
  final _categoryController = TextEditingController();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _searchController = TextEditingController();

  bool _isEditing = false;
  int _editingRowIndex = -1;
  String _editingId = '';

  @override
  void initState() {
    super.initState();
    _dateController.text = DateFormat('yyyy-MM-dd').format(DateTime.now());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ExpensesProvider>(context, listen: false).fetchExpenses();
    });
  }

  @override
  void dispose() {
    _dateController.dispose();
    _categoryController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _clearForm() {
    _dateController.text = DateFormat('yyyy-MM-dd').format(DateTime.now());
    _categoryController.clear();
    _amountController.clear();
    _descriptionController.clear();
    setState(() {
      _isEditing = false;
      _editingRowIndex = -1;
      _editingId = '';
    });
  }

  void _editExpense(ExpenseItem expense) {
    setState(() {
      _isEditing = true;
      _editingRowIndex = expense.rowIndex;
      _editingId = expense.id;
      _dateController.text = expense.date;
      _categoryController.text = expense.category;
      _amountController.text = expense.amount;
      _descriptionController.text = expense.description;
    });
  }

  Future<void> _submitForm() async {
    final provider = Provider.of<ExpensesProvider>(context, listen: false);

    final date = _dateController.text.trim();
    final category = _categoryController.text.trim();
    final amount = _amountController.text.trim();
    final description = _descriptionController.text.trim();

    if (date.isEmpty || category.isEmpty || amount.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields.')),
      );
      return;
    }

    final expense = ExpenseItem(
      id: _isEditing ? _editingId : DateTime.now().millisecondsSinceEpoch.toString(),
      date: date,
      category: category,
      amount: amount,
      description: description,
      rowIndex: _editingRowIndex,
    );

    bool success;
    if (_isEditing) {
      success = await provider.updateExpense(expense);
    } else {
      success = await provider.addExpense(expense);
    }

    if (success) {
      _clearForm();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEditing ? 'Expense updated.' : 'Expense added.')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? 'Error saving expense.')),
      );
    }
  }

  Future<void> _deleteExpense(int rowIndex) async {
    final provider = Provider.of<ExpensesProvider>(context, listen: false);
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Expense'),
        content: const Text('Are you sure you want to delete this expense?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm == true) {
      final success = await provider.deleteExpense(rowIndex);
      if (success) {
        if (_isEditing && _editingRowIndex == rowIndex) {
          _clearForm();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Expense deleted.')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.error ?? 'Error deleting expense.')),
        );
      }
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
    );
    if (picked != null) {
      setState(() {
        _dateController.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Side - Add Expense Form
          SizedBox(
            width: 320,
            child: _buildAddExpenseForm(),
          ),
          const SizedBox(width: 24),
          // Right Side - Expense List
          Expanded(
            child: _buildExpenseList(),
          ),
        ],
      ),
    );
  }

  Widget _buildAddExpenseForm() {
    final provider = Provider.of<ExpensesProvider>(context);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      _isEditing ? Icons.edit_rounded : Icons.add_circle_outline_rounded,
                      color: const Color(0xFF10B981),
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _isEditing ? 'Edit Expense' : 'Add Expense',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                  ],
                ),
                if (_isEditing)
                  InkWell(
                    onHover: (value) {},
                    onTap: _clearForm,
                    child: const Text('Cancel', style: TextStyle(color: Colors.red, fontSize: 12)),
                  )
              ],
            ),
          ),
          // Form Fields
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildFormField('Date *', 'Select Date', controller: _dateController, prefixIcon: Icons.calendar_today_rounded, readOnly: true, onTap: () => _selectDate(context)),
                const SizedBox(height: 20),
                _buildFormField('Expense Category *', 'Type category name...', controller: _categoryController),
                const SizedBox(height: 20),
                _buildFormField('Amount *', 'Enter amount', controller: _amountController, prefixIcon: Icons.currency_rupee_rounded, keyboardType: TextInputType.number),
                const SizedBox(height: 20),
                _buildFormField('Description', 'Enter description', controller: _descriptionController),
                const SizedBox(height: 32),
                SizedBox(
                  width: 120,
                  height: 42,
                  child: ElevatedButton.icon(
                    onPressed: provider.isLoading ? null : _submitForm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      elevation: 0,
                    ),
                    icon: provider.isLoading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Icon(_isEditing ? Icons.update_rounded : Icons.save_rounded, size: 16),
                    label: Text(_isEditing ? 'Update' : 'Submit', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormField(String label, String hint, {TextEditingController? controller, IconData? prefixIcon, TextInputType? keyboardType, bool readOnly = false, VoidCallback? onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
        ),
        const SizedBox(height: 8),
        Container(
          height: 42,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              if (prefixIcon != null) ...[
                Icon(prefixIcon, size: 16, color: const Color(0xFF64748B)),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: TextField(
                  controller: controller,
                  keyboardType: keyboardType,
                  readOnly: readOnly,
                  onTap: onTap,
                  decoration: InputDecoration(
                    hintText: hint,
                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.only(bottom: 10),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildExpenseList() {
    return Consumer<ExpensesProvider>(
      builder: (context, provider, _) {
        final query = _searchController.text.toLowerCase();
        final filteredList = provider.expenses.where((e) {
          return e.category.toLowerCase().contains(query) ||
                 e.date.toLowerCase().contains(query) ||
                 e.description.toLowerCase().contains(query);
        }).toList();

        return Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              // Table Controls
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Text('Search:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                    const SizedBox(width: 8),
                    Container(
                      width: 200,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (v) => setState(() {}),
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                        ),
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.refresh),
                      onPressed: provider.isLoading ? null : () => provider.fetchExpenses(),
                    ),
                  ],
                ),
              ),
              // Table Header
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                child: Row(
                  children: [
                    _buildTableHeadCell('DATE', isExpand: true),
                    _buildTableHeadCell('EXPENSE CATEGORY', isExpand: true),
                    _buildTableHeadCell('AMOUNT', isExpand: true),
                    _buildTableHeadCell('DESCRIPTION', isExpand: true),
                    _buildTableHeadCell('ACTION', width: 80),
                  ],
                ),
              ),
              // Table Body
              if (provider.isLoading)
                const SizedBox(
                  height: 300,
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (provider.error != null)
                Container(
                  height: 300,
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 48, color: Color(0xFFEF4444)),
                      const SizedBox(height: 16),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          provider.error!,
                          style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: () => provider.fetchExpenses(),
                        icon: const Icon(Icons.refresh, size: 16),
                        label: const Text('Retry'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                )
              else if (filteredList.isEmpty)
                Container(
                  height: 300,
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.assignment_outlined, size: 48, color: Color(0xFFCBD5E1)),
                      SizedBox(height: 16),
                      Text(
                        'No expenses recorded yet',
                        style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontStyle: FontStyle.italic),
                      ),
                    ],
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filteredList.length,
                  itemBuilder: (context, index) {
                    final item = filteredList[index];
                    return Container(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                      decoration: const BoxDecoration(
                        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
                      ),
                      child: Row(
                        children: [
                          Expanded(child: Text(item.date, style: const TextStyle(fontSize: 13))),
                          Expanded(child: Text(item.category, style: const TextStyle(fontSize: 13))),
                          Expanded(child: Text('₹${item.amount}', style: const TextStyle(fontSize: 13))),
                          Expanded(child: Text(item.description, style: const TextStyle(fontSize: 13))),
                          SizedBox(
                            width: 80,
                            child: Row(
                              children: [
                                InkWell(
                                  onTap: () => _editExpense(item),
                                  child: const Icon(Icons.edit_outlined, size: 18, color: Color(0xFF3B82F6)),
                                ),
                                const SizedBox(width: 12),
                                InkWell(
                                  onTap: () => _deleteExpense(item.rowIndex),
                                  child: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.red),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTableHeadCell(String label, {double? width, bool isExpand = false}) {
    Widget content = Row(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
        ),
      ],
    );

    if (isExpand) return Expanded(child: content);
    return SizedBox(width: width, child: content);
  }
}
