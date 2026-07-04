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

  void _showFormDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              child: Container(
                width: 480,
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _isEditing ? 'Edit Expense' : 'Add New Expense',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Color(0xFF94A3B8)),
                          onPressed: () {
                            _clearForm();
                            Navigator.pop(context);
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    _buildDialogField('Date *', _dateController, Icons.calendar_today, readOnly: true, onTap: () async {
                      DateTime? picked = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2101),
                      );
                      if (picked != null) {
                        setStateDialog(() {
                          _dateController.text = DateFormat('yyyy-MM-dd').format(picked);
                        });
                      }
                    }),
                    const SizedBox(height: 16),
                    _buildDialogField('Category *', _categoryController, Icons.label_outline, placeholder: 'e.g. Rent, Utilities'),
                    const SizedBox(height: 16),
                    _buildDialogField('Amount (₹) *', _amountController, Icons.attach_money, placeholder: '0.00'),
                    const SizedBox(height: 16),
                    _buildDialogField('Description (Optional)', _descriptionController, Icons.description_outlined, placeholder: 'Add some details...', maxLines: 3),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () {
                              _clearForm();
                              Navigator.pop(context);
                            },
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              backgroundColor: const Color(0xFFF1F5F9),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Cancel', style: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            onPressed: () {
                              _submitForm();
                              Navigator.pop(context);
                            },
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              backgroundColor: const Color(0xFF4F46E5),
                              elevation: 4,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(
                              _isEditing ? 'Save Changes' : 'Add Expense',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildDialogField(String label, TextEditingController controller, IconData icon, {bool readOnly = false, VoidCallback? onTap, String? placeholder, int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          readOnly: readOnly,
          onTap: onTap,
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
            prefixIcon: Icon(icon, color: const Color(0xFF94A3B8), size: 18),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 2),
            ),
          ),
        ),
      ],
    );
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
    _showFormDialog();
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
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await provider.deleteExpense(rowIndex);
      if (success) {
        if (_isEditing && _editingRowIndex == rowIndex) {
          _clearForm();
        }
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Expense deleted.')));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.error ?? 'Error deleting expense.')),
        );
      }
    }
  }

  Color _getCategoryBg(String cat) {
    final c = cat.toLowerCase();
    if (c.contains('rent')) return const Color(0xFFFCE7F3);
    if (c.contains('office')) return const Color(0xFFE0E7FF);
    if (c.contains('salary') || c.contains('wage')) return const Color(0xFFDCFCE7);
    if (c.contains('utility') || c.contains('bill')) return const Color(0xFFFEF3C7);
    return const Color(0xFFF1F5F9);
  }

  Color _getCategoryText(String cat) {
    final c = cat.toLowerCase();
    if (c.contains('rent')) return const Color(0xFFBE185D);
    if (c.contains('office')) return const Color(0xFF4338CA);
    if (c.contains('salary') || c.contains('wage')) return const Color(0xFF15803D);
    if (c.contains('utility') || c.contains('bill')) return const Color(0xFFB45309);
    return const Color(0xFF475569);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        heroTag: 'expenses_fab',
        onPressed: () {
          _clearForm();
          _showFormDialog();
        },
        backgroundColor: const Color(0xFF4F46E5),
        elevation: 6,
        child: const Icon(Icons.add, color: Colors.white, size: 28),
      ),
      body: Consumer<ExpensesProvider>(
        builder: (context, provider, child) {
          // Filter logic
          final query = _searchController.text.toLowerCase();
          final filteredList = provider.expenses.where((e) {
            return e.category.toLowerCase().contains(query) ||
                e.description.toLowerCase().contains(query) ||
                e.date.toLowerCase().contains(query);
          }).toList();
          final sortedList = List<ExpenseItem>.from(filteredList)..sort((a, b) => b.rowIndex.compareTo(a.rowIndex));

          final totalExpenses = sortedList.fold<double>(
            0,
            (sum, item) => sum + (double.tryParse(item.amount) ?? 0),
          );

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 32),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1400),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Hero Banner
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF7C3AED).withOpacity(0.4),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'TOTAL EXPENSES',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white.withOpacity(0.8),
                                  letterSpacing: 1.2,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.baseline,
                                textBaseline: TextBaseline.alphabetic,
                                children: [
                                  Text(
                                    '₹',
                                    style: TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white.withOpacity(0.8),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    NumberFormat('#,##0.00').format(totalExpenses),
                                    style: const TextStyle(
                                      fontSize: 48,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      letterSpacing: -1,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.receipt_long_rounded, color: Colors.white.withOpacity(0.9), size: 32),
                                const SizedBox(width: 16),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${sortedList.length}',
                                      style: const TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    Text(
                                      'RECORDS FOUND',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white.withOpacity(0.8),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Toolbar
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Recent Transactions',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        SizedBox(
                          width: 320,
                          child: TextField(
                            controller: _searchController,
                            onChanged: (v) => setState(() {}),
                            decoration: InputDecoration(
                              hintText: 'Search records...',
                              hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                              prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, color: Color(0xFF94A3B8)),
                                      onPressed: () {
                                        _searchController.clear();
                                        setState(() {});
                                      },
                                    )
                                  : null,
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Data Table
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: provider.isLoading
                          ? const Padding(
                              padding: EdgeInsets.all(60.0),
                              child: Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5))),
                            )
                          : sortedList.isEmpty
                              ? Padding(
                                  padding: const EdgeInsets.all(80.0),
                                  child: Center(
                                    child: Column(
                                      children: [
                                        Icon(Icons.receipt_long_outlined, size: 64, color: const Color(0xFF94A3B8).withOpacity(0.5)),
                                        const SizedBox(height: 16),
                                        const Text(
                                          'No expenses found',
                                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                                        ),
                                        const SizedBox(height: 8),
                                        const Text(
                                          'Click the + button to add a new record.',
                                          style: TextStyle(color: Color(0xFF94A3B8)),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                              : Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    // Table Header
                                    Container(
                                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFF8FAFC),
                                        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                                        border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
                                      ),
                                      child: Row(
                                        children: [
                                          Expanded(child: _buildHeaderCell('DATE')),
                                          Expanded(child: _buildHeaderCell('CATEGORY')),
                                          Expanded(flex: 2, child: _buildHeaderCell('DESCRIPTION')),
                                          Expanded(child: _buildHeaderCell('AMOUNT', alignRight: true)),
                                          const SizedBox(width: 120, child: Text('ACTIONS', textAlign: TextAlign.right, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5))),
                                        ],
                                      ),
                                    ),
                                    // Table Rows
                                    ListView.builder(
                                      shrinkWrap: true,
                                      physics: const NeverScrollableScrollPhysics(),
                                      itemCount: sortedList.length,
                                      itemBuilder: (context, index) {
                                        final item = sortedList[index];
                                        return Container(
                                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                                          decoration: BoxDecoration(
                                            color: index % 2 == 0 ? Colors.white : const Color(0xFFFAFAF9),
                                            border: const Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
                                          ),
                                          child: Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  item.date,
                                                  style: const TextStyle(fontSize: 14, color: Color(0xFF334155), fontWeight: FontWeight.w500),
                                                ),
                                              ),
                                              Expanded(
                                                child: Align(
                                                  alignment: Alignment.centerLeft,
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                    decoration: BoxDecoration(
                                                      color: _getCategoryBg(item.category),
                                                      borderRadius: BorderRadius.circular(20),
                                                    ),
                                                    child: Text(
                                                      item.category,
                                                      style: TextStyle(
                                                        color: _getCategoryText(item.category),
                                                        fontSize: 13,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              Expanded(
                                                flex: 2,
                                                child: Text(
                                                  item.description.isEmpty ? '-' : item.description,
                                                  style: const TextStyle(fontSize: 14, color: Color(0xFF64748B)),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              Expanded(
                                                child: Text(
                                                  '₹${NumberFormat('#,##0.00').format(double.tryParse(item.amount) ?? 0)}',
                                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                                  textAlign: TextAlign.right,
                                                ),
                                              ),
                                              SizedBox(
                                                width: 120,
                                                child: Row(
                                                  mainAxisAlignment: MainAxisAlignment.end,
                                                  children: [
                                                    IconButton(
                                                      icon: const Icon(Icons.edit_outlined, size: 18),
                                                      color: const Color(0xFF3B82F6),
                                                      style: IconButton.styleFrom(backgroundColor: const Color(0xFFEFF6FF), padding: const EdgeInsets.all(8)),
                                                      onPressed: () => _editExpense(item),
                                                      tooltip: 'Edit',
                                                    ),
                                                    const SizedBox(width: 8),
                                                    IconButton(
                                                      icon: const Icon(Icons.delete_outline_rounded, size: 18),
                                                      color: const Color(0xFFEF4444),
                                                      style: IconButton.styleFrom(backgroundColor: const Color(0xFFFEF2F2), padding: const EdgeInsets.all(8)),
                                                      onPressed: () => _deleteExpense(item.rowIndex),
                                                      tooltip: 'Delete',
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
                    ),
                    const SizedBox(height: 60), // Space for FAB
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeaderCell(String label, {bool alignRight = false}) {
    return Text(
      label,
      textAlign: alignRight ? TextAlign.right : TextAlign.left,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: Color(0xFF64748B),
        letterSpacing: 0.5,
      ),
    );
  }
}
