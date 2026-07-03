import 'package:flutter/material.dart';

/// Balance Calculator Popup Dialog.
/// Used to compute change for the customer based on total amount and paid amount.
class BalanceCalculatorDialog extends StatefulWidget {
  final double totalAmount;
  const BalanceCalculatorDialog({super.key, required this.totalAmount});

  @override
  State<BalanceCalculatorDialog> createState() => _BalanceCalculatorDialogState();
}

class _BalanceCalculatorDialogState extends State<BalanceCalculatorDialog> {
  late double _totalCharges;
  double _customerPaid = 0.0;
  double _balanceAmount = 0.0;
  late TextEditingController _paidController;

  @override
  void initState() {
    super.initState();
    _totalCharges = widget.totalAmount;
    _customerPaid = _totalCharges;
    _balanceAmount = 0.0;
    _paidController = TextEditingController(text: _totalCharges.toStringAsFixed(2));
    _paidController.addListener(_calculate);
  }

  @override
  void dispose() {
    _paidController.dispose();
    super.dispose();
  }

  void _calculate() {
    final paid = double.tryParse(_paidController.text.trim()) ?? 0.0;
    setState(() {
      _customerPaid = paid;
      _balanceAmount = _customerPaid - _totalCharges;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 320,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Balance Calculator',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const Divider(height: 20),
            const Text('Total Charges', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                '₹${_totalCharges.toStringAsFixed(2)}',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Customer Paid', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
            const SizedBox(height: 6),
            TextField(
              controller: _paidController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                prefixText: '₹ ',
              ),
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              autofocus: true,
            ),
            const SizedBox(height: 16),
            const Text('Balance Amount', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: _balanceAmount < 0 ? const Color(0xFFFEF2F2) : const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _balanceAmount < 0 ? const Color(0xFFFECACA) : const Color(0xFFA7F3D0)),
              ),
              child: Text(
                '₹${_balanceAmount.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: _balanceAmount < 0 ? const Color(0xFFDC2626) : const Color(0xFF10B981),
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Close', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
