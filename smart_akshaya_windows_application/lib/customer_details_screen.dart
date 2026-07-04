import 'package:flutter/material.dart';
import 'services/google_sheets_service.dart';
import 'services/auth_service.dart';
import 'config/google_sheets_config.dart';

class CustomerDetailsScreen extends StatefulWidget {
  const CustomerDetailsScreen({super.key});

  @override
  State<CustomerDetailsScreen> createState() => _CustomerDetailsScreenState();
}

class _CustomerDetailsScreenState extends State<CustomerDetailsScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _customers = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchCustomers();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase().trim();
    if (query.isEmpty) {
      setState(() {
        _filtered = _customers;
      });
    } else {
      setState(() {
        _filtered = _customers.where((c) {
          final name = (c['name'] ?? '').toString().toLowerCase();
          final mobile = (c['mobile'] ?? '').toString().toLowerCase();
          final email = (c['email'] ?? '').toString().toLowerCase();
          final address = (c['address'] ?? '').toString().toLowerCase();
          return name.contains(query) ||
              mobile.contains(query) ||
              email.contains(query) ||
              address.contains(query);
        }).toList();
      });
    }
  }

  Future<void> _fetchCustomers() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final spreadsheetId = await AuthService().getSpreadsheetId();
      await AuthService().ensureSheetsServiceInitialized();

      final rows = await GoogleSheetsService().getRows(
        spreadsheetId,
        GoogleSheetsConfig.customerSheetName,
      );

      final List<Map<String, dynamic>> parsedList = [];
      if (rows.isNotEmpty && rows.length > 1) {
        // Row 0 is headers
        for (int i = 1; i < rows.length; i++) {
          final row = rows[i];
          if (row.isEmpty || row.length <= 1 || row[1].toString().trim().isEmpty) continue;

          parsedList.add({
            'rowIndex': i + 1,
            'id': row[0].toString(),
            'name': row[1].toString(),
            'mobile': row.length > 2 ? row[2].toString() : '',
            'email': row.length > 3 ? row[3].toString() : '',
            'address': row.length > 4 ? row[4].toString() : '',
            'remarks': row.length > 5 ? row[5].toString() : '',
            'totalPaid': row.length > 6 ? (double.tryParse(row[6].toString()) ?? 0.0) : 0.0,
            'gpayUpi': row.length > 7 ? (double.tryParse(row[7].toString()) ?? 0.0) : 0.0,
            'cash': row.length > 8 ? (double.tryParse(row[8].toString()) ?? 0.0) : 0.0,
            'balance': row.length > 9 ? (double.tryParse(row[9].toString()) ?? 0.0) : 0.0,
          });
        }
      }

      setState(() {
        _customers = parsedList;
        _filtered = parsedList;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load customer details: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showCustomerProfileDialog(Map<String, dynamic> c) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        final double balance = c['balance'] ?? 0.0;
        final Color balanceColor = balance < 0 ? const Color(0xFFEF4444) : const Color(0xFF10B981);
        final Color balanceBg = balance < 0 ? const Color(0xFFFEF2F2) : const Color(0xFFECFDF5);

        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Container(
            width: 450,
            padding: const EdgeInsets.all(24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: const BoxDecoration(
                              color: Color(0xFFECFDF5),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.person_outline_rounded, color: Color(0xFF10B981), size: 24),
                          ),
                          const SizedBox(width: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Customer Profile',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Detailed overview and financial summary',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        decoration: const BoxDecoration(
                          color: Color(0xFFF1F5F9),
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B), size: 20),
                          onPressed: () => Navigator.pop(dialogContext),
                          hoverColor: const Color(0xFFE2E8F0),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                  const SizedBox(height: 24),

                  // Profile Details
                  _buildProfileRow(Icons.person_rounded, 'Name', c['name'] ?? ''),
                  _buildProfileRow(Icons.phone_rounded, 'Mobile Number', c['mobile'] ?? 'Not provided'),
                  _buildProfileRow(Icons.mail_rounded, 'Email Address', c['email'] ?? 'Not provided'),
                  _buildProfileRow(Icons.map_rounded, 'Address', c['address'] ?? 'Not provided'),
                  _buildProfileRow(Icons.description_rounded, 'Remarks', c['remarks'] ?? 'No remarks', isItalic: true),

                  const Divider(height: 32),

                  // Financial Summary Section
                  const Text(
                    'FINANCIAL SUMMARY',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF64748B),
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Financial grid
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _buildFinancialCard('Total Paid', c['totalPaid']),
                      _buildFinancialCard('GPay/UPI', c['gpayUpi']),
                      _buildFinancialCard('Cash', c['cash']),
                      _buildFinancialCard(
                        'Balance',
                        c['balance'],
                        customBg: balanceBg,
                        customTextColor: balanceColor,
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(dialogContext),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Close Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value, {bool isItalic = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: const Color(0xFF94A3B8), size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    color: const Color(0xFF1E293B),
                    fontWeight: label == 'Name' ? FontWeight.w600 : FontWeight.normal,
                    fontStyle: isItalic ? FontStyle.italic : FontStyle.normal,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFinancialCard(String label, double amount, {Color? customBg, Color? customTextColor}) {
    return Container(
      width: 180,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: customBg ?? const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: customBg != null ? customTextColor!.withOpacity(0.3) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: customTextColor ?? const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '₹${amount.toStringAsFixed(2)}',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: customTextColor ?? const Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 32),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF10B981), Color(0xFF14B8A6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF10B981).withOpacity(0.3),
                    blurRadius: 25,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Customer Details',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Manage customer profiles and track financial balances',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Container(
                        width: 300,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.95),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: TextField(
                          controller: _searchController,
                          textAlignVertical: TextAlignVertical.center,
                          decoration: const InputDecoration(
                            hintText: 'Search customers...',
                            hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                            prefixIcon: Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 18),
                            prefixIconConstraints: BoxConstraints(minWidth: 40, minHeight: 40),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        height: 44,
                        width: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          border: Border.all(color: Colors.white.withOpacity(0.3)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: IconButton(
                          icon: _isLoading
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.refresh_rounded, color: Colors.white, size: 20),
                          onPressed: _isLoading ? null : _fetchCustomers,
                          tooltip: 'Reload customers',
                          mouseCursor: SystemMouseCursors.click,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),            // Content Table
            Expanded(
              child: _isLoading && _customers.isEmpty
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                  : _error != null
                      ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
                      : _filtered.isEmpty
                          ? const Center(
                              child: Text(
                                'No customers found. Make sure entries are saved!',
                                style: TextStyle(color: Color(0xFF64748B), fontSize: 15),
                              ),
                            )
                          : Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF0F172A).withOpacity(0.03),
                                    blurRadius: 15,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Column(
                                children: [
                                  // Table Header / Actions
                                  Padding(
                                    padding: const EdgeInsets.all(24.0),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text(
                                          'Customer Roster',
                                          style: TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF1E293B),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF1F5F9),
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                          child: Text(
                                            '${_filtered.length} customers',
                                            style: const TextStyle(
                                              color: Color(0xFF64748B),
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                                  // Table Column Headers
                                  Container(
                                    color: const Color(0xFFF8FAFC),
                                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                    child: Row(
                                      children: const [
                                        Expanded(flex: 3, child: Text('CUSTOMER NAME', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5))),
                                        Expanded(flex: 2, child: Text('MOBILE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5))),
                                        Expanded(flex: 2, child: Text('EMAIL', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5))),
                                        Expanded(flex: 2, child: Text('TOTAL PAID', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5))),
                                        Expanded(flex: 2, child: Text('BALANCE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5))),
                                        Expanded(flex: 1, child: Align(alignment: Alignment.centerRight, child: Text('ACTIONS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5)))),
                                      ],
                                    ),
                                  ),
                                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                                  // List
                                  Expanded(
                                    child: ListView.builder(
                                      itemCount: _filtered.length,
                                      itemBuilder: (context, index) {
                                        final c = _filtered[index];
                                        final double balance = c['balance'] ?? 0.0;
                                        final Color balanceColor = balance < 0 ? const Color(0xFFEF4444) : const Color(0xFF10B981);
                                        final Color balanceBg = balance < 0 ? const Color(0xFFFEF2F2) : const Color(0xFFECFDF5);
                                        
                                        return Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                                          decoration: const BoxDecoration(
                                            color: Colors.white,
                                            border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
                                          ),
                                          child: Row(
                                            children: [
                                              Expanded(
                                                flex: 3,
                                                child: Row(
                                                  children: [
                                                    Container(
                                                      width: 36,
                                                      height: 36,
                                                      decoration: BoxDecoration(
                                                        color: const Color(0xFFF0FDF4),
                                                        borderRadius: BorderRadius.circular(10),
                                                      ),
                                                      child: Center(
                                                        child: Text(
                                                          c['name'].toString().trim().isNotEmpty ? c['name'].toString().trim()[0].toUpperCase() : 'C',
                                                          style: const TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.bold),
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 12),
                                                    Expanded(
                                                      child: Text(
                                                        c['name'].toString().isNotEmpty ? c['name'] : 'Unknown Customer',
                                                        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B), fontSize: 14),
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              Expanded(
                                                flex: 2,
                                                child: Text(
                                                  c['mobile'].toString().isNotEmpty ? c['mobile'] : '-',
                                                  style: const TextStyle(color: Color(0xFF475569), fontSize: 14),
                                                ),
                                              ),
                                              Expanded(
                                                flex: 2,
                                                child: Text(
                                                  c['email'].toString().isNotEmpty ? c['email'] : '-',
                                                  style: const TextStyle(color: Color(0xFF475569), fontSize: 14),
                                                ),
                                              ),
                                              Expanded(
                                                flex: 2,
                                                child: Text(
                                                  '₹${(c['totalPaid'] ?? 0.0).toStringAsFixed(2)}',
                                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A), fontSize: 14),
                                                ),
                                              ),
                                              Expanded(
                                                flex: 2,
                                                child: Align(
                                                  alignment: Alignment.centerLeft,
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                    decoration: BoxDecoration(
                                                      color: balanceBg,
                                                      borderRadius: BorderRadius.circular(6),
                                                    ),
                                                    child: Text(
                                                      '₹${balance.toStringAsFixed(2)}',
                                                      style: TextStyle(fontWeight: FontWeight.bold, color: balanceColor, fontSize: 13),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              Expanded(
                                                flex: 1,
                                                child: Align(
                                                  alignment: Alignment.centerRight,
                                                  child: Material(
                                                    color: const Color(0xFFF1F5F9),
                                                    borderRadius: BorderRadius.circular(6),
                                                    child: InkWell(
                                                      onTap: () => _showCustomerProfileDialog(c),
                                                      borderRadius: BorderRadius.circular(6),
                                                      hoverColor: const Color(0xFFE2E8F0),
                                                      child: const Padding(
                                                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                                        child: Text(
                                                          'View Details',
                                                          style: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.bold, fontSize: 12),
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),
            ),
          ],
        ),
      ),
    );
  }
}
