import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'providers/service_reports_provider.dart';
import 'providers/new_entry_provider.dart';
import 'utils/export_utils.dart';
import 'main_navigation_screen.dart';


class ServiceReportsScreen extends StatefulWidget {
  const ServiceReportsScreen({super.key});

  @override
  State<ServiceReportsScreen> createState() => _ServiceReportsScreenState();
}

class _ServiceReportsScreenState extends State<ServiceReportsScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ServiceReportsProvider>().fetchReports();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isFromDate) async {
    final provider = context.read<ServiceReportsProvider>();
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isFromDate ? (provider.fromDate ?? DateTime.now()) : (provider.toDate ?? DateTime.now()),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      if (isFromDate) {
        provider.setDateRange(picked, provider.toDate);
      } else {
        provider.setDateRange(provider.fromDate, picked);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ServiceReportsProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Filter Section Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: MouseRegion(
                    cursor: SystemMouseCursors.click,
                    child: GestureDetector(
                      onTap: () => _selectDate(context, true),
                      child: _buildFilterField(
                        'FROM DATE', 
                        provider.fromDate != null ? DateFormat('dd/MM/yyyy').format(provider.fromDate!) : 'Select Date', 
                        Icons.calendar_month_rounded,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: MouseRegion(
                    cursor: SystemMouseCursors.click,
                    child: GestureDetector(
                      onTap: () => _selectDate(context, false),
                      child: _buildFilterField(
                        'TO DATE', 
                        provider.toDate != null ? DateFormat('dd/MM/yyyy').format(provider.toDate!) : 'Select Date', 
                        Icons.calendar_month_rounded,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(child: _buildFilterDropdown(context, provider)),
                const SizedBox(width: 16),
                _buildSearchButton(provider),
                const SizedBox(width: 12),
                _buildClearButton(provider),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Export & Search Section
          Row(
            children: [
              _buildExportButton('PDF', Icons.picture_as_pdf_outlined, () {
                ExportUtils.generatePdfReport(provider.filteredReports, 'Service Reports');
              }),
              const SizedBox(width: 10),
              _buildExportButton('Excel', Icons.table_chart_outlined, () {
                ExportUtils.generateExcelReport(provider.filteredReports, 'Service Reports');
              }),
              const Spacer(),
              _buildTableSearchField(provider),
            ],
          ),
          const SizedBox(height: 16),

          // Reports Table with Horizontal Scroll
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildTableHeader(),
                      if (provider.isLoading)
                        Container(
                          width: 1252,
                          height: 350,
                          alignment: Alignment.center,
                          child: const CircularProgressIndicator(),
                        )
                      else if (provider.filteredReports.isEmpty)
                        Container(
                          width: 1252,
                          height: 350,
                          alignment: Alignment.center,
                          child: const Text(
                            'No data available for the selected date range',
                            style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontStyle: FontStyle.italic),
                          ),
                        )
                      else
                        Container(
                          width: 1252,
                          constraints: const BoxConstraints(minHeight: 350),
                          child: ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: provider.filteredReports.length,
                            itemBuilder: (context, index) {
                              final report = provider.filteredReports[index];
                              return _buildTableRow(report, index + 1);
                            },
                          ),
                        ),
                      _buildTableFooter(provider),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Pagination Footer
          Row(
            children: [
              Text(
                'Showing 1 to ${provider.filteredReports.length} of ${provider.filteredReports.length} entries',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
              const Spacer(),
              _buildPaginationButton('Previous', isEnabled: false),
              const SizedBox(width: 8),
              _buildPaginationButton('Next', isEnabled: false),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterField(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
        const SizedBox(height: 8),
        Container(
          height: 42,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            color: Colors.transparent,
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  value, 
                  style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B)),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 4),
              Icon(icon, size: 16, color: const Color(0xFF64748B)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterDropdown(BuildContext context, ServiceReportsProvider provider) {
    final List<String> users = ['Display all', ...provider.availableUsers];
    final String currentVal = provider.selectedUser ?? 'Display all';
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('USERS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
        const SizedBox(height: 8),
        Container(
          height: 42,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: currentVal.isEmpty ? 'Display all' : currentVal,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: Color(0xFF64748B)),
              items: users.map((String user) {
                return DropdownMenuItem<String>(
                  value: user,
                  child: Text(user, style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B))),
                );
              }).toList(),
              onChanged: (val) {
                provider.setSelectedUser(val == 'Display all' ? null : val);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSearchButton(ServiceReportsProvider provider) {
    return Container(
      height: 42,
      child: ElevatedButton.icon(
        onPressed: () {
          // Filtering happens reactively but we can trigger a refresh if needed
          provider.fetchReports();
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF065F46),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          elevation: 0,
        ),
        icon: const Icon(Icons.search_rounded, size: 18),
        label: const Text('Search', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildClearButton(ServiceReportsProvider provider) {
    return Container(
      height: 42,
      child: OutlinedButton.icon(
        onPressed: () {
          provider.clearFilters();
          _searchController.clear();
        },
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFF64748B),
          side: const BorderSide(color: Color(0xFFE2E8F0)),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        icon: const Icon(Icons.close_rounded, size: 18),
        label: const Text('Clear', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildExportButton(String label, IconData icon, VoidCallback onPressed) {
    return Container(
      height: 36,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFF64748B),
          side: const BorderSide(color: Color(0xFFE2E8F0)),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        ),
        icon: Icon(icon, size: 16),
        label: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildTableSearchField(ServiceReportsProvider provider) {
    return Row(
      children: [
        const Text('Search:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
        const SizedBox(width: 8),
        Container(
          width: 220,
          height: 36,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: TextField(
            controller: _searchController,
            onChanged: (val) => provider.setSearchQuery(val),
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTableHeader() {
    final List<Map<String, dynamic>> columns = [
      {'title': '#', 'width': 40.0},
      {'title': 'Date', 'width': 100.0},
      {'title': 'Customer', 'width': 150.0},
      {'title': 'Contact', 'width': 120.0},
      {'title': 'Services', 'width': 150.0},
      {'title': 'Wallet charge', 'width': 100.0},
      {'title': 'Charge', 'width': 80.0},
      {'title': 'Total', 'width': 80.0},
      {'title': 'Payment', 'width': 100.0},
      {'title': 'Entry staff', 'width': 120.0},
      {'title': 'Re-print', 'width': 80.0},
      {'title': 'Action', 'width': 100.0},
    ];

    return Container(
      color: const Color(0xFFF8FAFC),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      width: 1252, // sum(col widths) + padding
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: columns.map((col) => Container(
          width: col['width'],
          child: Row(
            children: [
              Expanded(
                child: Text(
                  col['title'],
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const Icon(Icons.unfold_more_rounded, size: 12, color: Color(0xFF94A3B8)),
            ],
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildTableRow(dynamic report, int index) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      width: 1252,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _tableCell(index.toString(), 40.0),
          _tableCell(report.date, 100.0),
          _tableCell(report.customerName, 150.0, isBold: true),
          _tableCell(report.mobile, 120.0),
          _tableCell(report.services, 150.0),
          _tableCell(report.gpayUpi.toStringAsFixed(2), 100.0),
          _tableCell(report.cash.toStringAsFixed(2), 80.0),
          _tableCell(report.totalAmount.toStringAsFixed(2), 80.0, isBold: true, color: const Color(0xFF0F172A)),
          _tableCell('Cash', 100.0, color: const Color(0xFF10B981)), // Static for now
          _tableCell(report.staffName, 120.0),
          Container(
            width: 80.0,
            child: IconButton(
              icon: const Icon(Icons.print_rounded, size: 18, color: Color(0xFF3B82F6)),
              onPressed: () {},
              constraints: const BoxConstraints(),
              padding: EdgeInsets.zero,
            ),
          ),
          Container(
            width: 100.0,
            child: Row(
              children: [
                InkWell(
                  onTap: () {
                    // Load report into NewEntryProvider
                    context.read<NewEntryProvider>().loadFromSavedBill(report);
                    // Navigate to New Entry tab (index 1)
                    context.findAncestorStateOfType<MainNavigationScreenState>()?.setSelectedIndex(1);
                  },
                  child: const Icon(Icons.edit_outlined, size: 18, color: Color(0xFF64748B)),
                ),
                const SizedBox(width: 12),
                InkWell(
                  onTap: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Delete Entry'),
                        content: Text('Are you sure you want to delete the entry for "${report.customerName}"?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            style: TextButton.styleFrom(foregroundColor: Colors.red),
                            child: const Text('Delete'),
                          ),
                        ],
                      ),
                    );

                    if (confirm == true && mounted) {
                      try {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Deleting entry...')),
                        );
                        await context.read<ServiceReportsProvider>().deleteReport(report.rowIndex);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Entry deleted successfully!'),
                              backgroundColor: Colors.green,
                            ),
                          );
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Error deleting entry: $e'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      }
                    }
                  },
                  child: const Icon(Icons.delete_outline, size: 18, color: Color(0xFFEF4444)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _tableCell(String text, double width, {bool isBold = false, Color color = const Color(0xFF475569)}) {
    return Container(
      width: width,
      padding: const EdgeInsets.only(right: 8),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          color: color,
        ),
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Widget _buildTableFooter(ServiceReportsProvider provider) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      width: 1252,
      decoration: const BoxDecoration(
        color: Color(0xFFEFF6FF),
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(width: 40 + 100 + 150 + 120 + 150), // Skip previous columns
          Container(
            width: 100,
            child: Text(
              provider.totalWalletCharge.toStringAsFixed(2),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF1E293B)),
            ),
          ),
          Container(
            width: 80.0,
            child: Text(
              provider.totalServiceCharge.toStringAsFixed(2),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF1E293B)),
            ),
          ),
          Container(
            width: 80.0,
            child: Text(
              provider.totalAmount.toStringAsFixed(2),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF1E293B)),
            ),
          ),
        ],
      ),
    );
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

