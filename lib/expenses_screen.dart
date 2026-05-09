import 'package:flutter/material.dart';

class ExpensesScreen extends StatelessWidget {
  const ExpensesScreen({super.key});

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
              children: const [
                Icon(Icons.add_circle_outline_rounded, color: Color(0xFF10B981), size: 18),
                SizedBox(width: 8),
                Text(
                  'Add expense',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ],
            ),
          ),
          // Form Fields
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildFormField('Date', '2026-05-09'),
                const SizedBox(height: 20),
                _buildFormField('Expense category', 'Type category name...'),
                const SizedBox(height: 20),
                _buildFormField('Charge', 'Enter amount', prefixIcon: Icons.currency_rupee_rounded, keyboardType: TextInputType.number),
                const SizedBox(height: 32),
                SizedBox(
                  width: 120,
                  height: 42,
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.save_rounded, size: 16),
                    label: const Text('Submit', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormField(String label, String hint, {IconData? prefixIcon, TextInputType? keyboardType}) {
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
                  keyboardType: keyboardType,
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
                const Text('Show', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text('10', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 8),
                const Text('entries', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                const Spacer(),
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
                  child: const TextField(
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                    ),
                  ),
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
                _buildTableHeadCell('#', width: 40),
                _buildTableHeadCell('DATE', isExpand: true),
                _buildTableHeadCell('EXPENSE CATEGORY', isExpand: true),
                _buildTableHeadCell('AMOUNT', isExpand: true),
                _buildTableHeadCell('ACTION', width: 80),
              ],
            ),
          ),
          // Empty State
          Container(
            height: 300,
            alignment: Alignment.center,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.assignment_outlined, size: 48, color: const Color(0xFFCBD5E1)),
                const SizedBox(height: 16),
                const Text(
                  'No expenses recorded yet',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontStyle: FontStyle.italic),
                ),
              ],
            ),
          ),
          // Footer
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
            ),
            child: Row(
              children: [
                const Text(
                  'Showing 0 to 0 of 0 entries',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
                const Spacer(),
                _buildPaginationButton('Previous', isEnabled: false),
                const SizedBox(width: 8),
                _buildPaginationButton('Next', isEnabled: false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTableHeadCell(String label, {double? width, bool isExpand = false}) {
    Widget content = Row(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
        ),
        const SizedBox(width: 4),
        const Icon(Icons.unfold_more_rounded, size: 12, color: Color(0xFF94A3B8)),
      ],
    );

    if (isExpand) return Expanded(child: content);
    return SizedBox(width: width, child: content);
  }

  Widget _buildPaginationButton(String label, {required bool isEnabled}) {
    return Container(
      height: 32,
      child: OutlinedButton(
        onPressed: isEnabled ? () {} : null,
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFF64748B),
          disabledForegroundColor: const Color(0xFFCBD5E1),
          side: BorderSide(color: isEnabled ? const Color(0xFFE2E8F0) : const Color(0xFFF1F5F9)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          padding: const EdgeInsets.symmetric(horizontal: 12),
        ),
        child: Text(label, style: const TextStyle(fontSize: 12)),
      ),
    );
  }
}
