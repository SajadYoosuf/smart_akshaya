import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/saved_bills_provider.dart';
import 'models/saved_bill.dart';
import 'package:smart_akshaya/main_navigation_screen.dart';
import 'package:smart_akshaya/providers/new_entry_provider.dart';

class SavedBillsScreen extends StatefulWidget {
  const SavedBillsScreen({super.key});

  @override
  State<SavedBillsScreen> createState() => _SavedBillsScreenState();
}

class _SavedBillsScreenState extends State<SavedBillsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SavedBillsProvider>().fetchSavedBills();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SavedBillsProvider>();

    return Scaffold(
      backgroundColor: Colors.transparent, // Background handled by parent shell
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(
                          Icons.layers_rounded,
                          color: Color(0xFF3B82F6),
                          size: 28,
                        ),
                        SizedBox(width: 12),
                        Text(
                          'Saved Bills',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0EA5E9),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Pending bill drafts saved to database — pick up right where you left off',
                      style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Stats Cards
            Row(
              children: [
                _buildStatCard(
                  'CUSTOMERS',
                  provider.totalCustomers.toString(),
                  Icons.group_rounded,
                  const Color(0xFFE0F2FE),
                  const Color(0xFF0284C7),
                ),
                const SizedBox(width: 24),
                _buildStatCard(
                  'TOTAL ITEMS',
                  provider.totalItems.toString(),
                  Icons.list_alt_rounded,
                  const Color(0xFFE0F2FE),
                  const Color(0xFF0284C7),
                ),
                const SizedBox(width: 24),
                _buildStatCard(
                  'OLDEST SAVE',
                  provider.oldestSaveText,
                  Icons.access_time_filled_rounded,
                  const Color(0xFFFEF3C7),
                  const Color(0xFFD97706),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Search Bar & Filter Info
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: 350,
                  height: 44,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.search_rounded,
                        color: Color(0xFF94A3B8),
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          onChanged: provider.setSearchQuery,
                          decoration: const InputDecoration(
                            hintText: 'Search by name, mobile or ID...',
                            hintStyle: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 14,
                            ),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.only(bottom: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Text(
                    '${provider.bills.length} customer${provider.bills.length == 1 ? '' : 's'}',
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // List
            Expanded(
              child: provider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : provider.bills.isEmpty
                      ? const Center(
                          child: Text('No saved bills found.', style: TextStyle(color: Color(0xFF64748B))))
                      : ListView.builder(
                          itemCount: provider.bills.length,
                          itemBuilder: (context, index) {
                            final bill = provider.bills[index];
                            return _buildBillCard(bill);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color iconBgColor,
    Color iconColor,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconBgColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBillCard(SavedBill bill) {
    // Generate an avatar letter
    String initial = 'U';
    if (bill.customerName.isNotEmpty) {
      initial = bill.customerName[0].toUpperCase();
    } else if (bill.mobile.isNotEmpty) {
      initial = bill.mobile[0];
    }

    // Determine created string
    String createdStr = 'Created ${bill.date}, ${bill.time}';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: Color(0xFF3B82F6),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              initial,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 20),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bill.customerName.isEmpty
                      ? (bill.mobile.isEmpty ? 'Unknown Customer' : bill.mobile)
                      : bill.customerName,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.phone_rounded,
                      size: 14,
                      color: Color(0xFF94A3B8),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      bill.mobile.isEmpty ? '-' : bill.mobile,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 12,
                      ),
                    ),

                    const SizedBox(width: 12),
                    const Icon(
                      Icons.description_rounded,
                      size: 14,
                      color: Color(0xFF94A3B8),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      bill.services.isEmpty ? 'No services' : bill.services,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 12,
                      ),
                    ),

                    const SizedBox(width: 12),
                    const Icon(
                      Icons.calendar_today_rounded,
                      size: 14,
                      color: Color(0xFF94A3B8),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      createdStr,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Right Pills
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFE0F2FE),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.list_rounded,
                  size: 14,
                  color: Color(0xFF0284C7),
                ),
                const SizedBox(width: 4),
                Text(
                  '${bill.quantity} item${bill.quantity == 1 ? '' : 's'}',
                  style: const TextStyle(
                    color: Color(0xFF0284C7),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFF3E8FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '₹${bill.totalAmount.toStringAsFixed(2)}',
              style: const TextStyle(
                color: Color(0xFF9333EA),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 16),
          PopupMenuButton<String>(
            icon: const Icon(
              Icons.keyboard_arrow_down_rounded,
              color: Color(0xFF94A3B8),
            ),
            onSelected: (String result) {
              if (result == 'reprint') {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Reprinting PDF bill... (Implementation coming soon)')),
                );
              } else if (result == 'bill') {
                context.read<NewEntryProvider>().loadFromSavedBill(bill);
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const MainNavigationScreen(initialIndex: 1)),
                );
              }
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                value: 'reprint',
                child: Row(
                  children: [
                    Icon(Icons.print_rounded, size: 18, color: Color(0xFF64748B)),
                    SizedBox(width: 8),
                    Text('Reprint'),
                  ],
                ),
              ),
              const PopupMenuItem<String>(
                value: 'bill',
                child: Row(
                  children: [
                    Icon(Icons.receipt_long_rounded, size: 18, color: Color(0xFF64748B)),
                    SizedBox(width: 8),
                    Text('Bill'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
