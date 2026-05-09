import 'package:flutter/material.dart';

class ServiceReportsScreen extends StatelessWidget {
  const ServiceReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
                Expanded(child: _buildFilterField('FROM DATE', '05/09/2026', Icons.calendar_month_rounded)),
                const SizedBox(width: 16),
                Expanded(child: _buildFilterField('TO DATE', '05/09/2026', Icons.calendar_month_rounded)),
                const SizedBox(width: 16),
                Expanded(child: _buildFilterDropdown('USERS', 'Display all')),
                const SizedBox(width: 16),
                _buildSearchButton(),
                const SizedBox(width: 12),
                _buildClearButton(),
                const Spacer(),
                _buildVerificationReportButton(),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Export & Search Section
          Row(
            children: [
              _buildExportButton('PDF', Icons.picture_as_pdf_outlined),
              const SizedBox(width: 10),
              _buildExportButton('Excel', Icons.table_chart_outlined),
              const Spacer(),
              _buildTableSearchField(),
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
                      Container(
                        width: 1632, // Matches columns sum (1600) + horizontal padding (32)
                        height: 350,
                        alignment: Alignment.center,
                        child: const Text(
                          'No data available for the selected date range',
                          style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontStyle: FontStyle.italic),
                        ),
                      ),
                      _buildTableFooter(),
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
          ),
          child: Row(
            children: [
              Text(value, style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B))),
              const Spacer(),
              Icon(icon, size: 16, color: const Color(0xFF64748B)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterDropdown(String label, String value) {
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
          ),
          child: Row(
            children: [
              Text(value, style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B))),
              const Spacer(),
              const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: Color(0xFF64748B)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSearchButton() {
    return Container(
      height: 42,
      child: ElevatedButton.icon(
        onPressed: () {},
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

  Widget _buildClearButton() {
    return Container(
      height: 42,
      child: OutlinedButton.icon(
        onPressed: () {},
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

  Widget _buildVerificationReportButton() {
    return Container(
      height: 42,
      child: ElevatedButton.icon(
        onPressed: () {},
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFEFF6FF),
          foregroundColor: const Color(0xFF3B82F6),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Color(0xFFDBEAFE)),
          ),
          elevation: 0,
        ),
        icon: const Icon(Icons.verified_user_outlined, size: 18),
        label: const Text('Verification report', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildExportButton(String label, IconData icon) {
    return Container(
      height: 36,
      child: OutlinedButton.icon(
        onPressed: () {},
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

  Widget _buildTableSearchField() {
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
          child: const TextField(
            decoration: InputDecoration(
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
      {'title': 'Charge 1', 'width': 80.0},
      {'title': 'Charge 2', 'width': 80.0},
      {'title': 'Charge 3', 'width': 80.0},
      {'title': 'Gateway charge', 'width': 120.0},
      {'title': 'Total', 'width': 80.0},
      {'title': 'Payment', 'width': 100.0},
      {'title': 'Entry staff', 'width': 120.0},
      {'title': 'Re-print', 'width': 80.0},
      {'title': 'App enquiry', 'width': 100.0},
      {'title': 'Action', 'width': 100.0},
    ];

    return Container(
      color: const Color(0xFFF8FAFC),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      width: 1632, // sum(col widths) + padding
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

  Widget _buildTableFooter() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      width: 1632,
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
            child: const Text(
              'Total:',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF1E293B)),
            ),
          ),
          ...List.generate(5, (index) => Container(
            width: index == 0 ? 80.0 : index == 1 ? 80.0 : index == 2 ? 80.0 : index == 3 ? 120.0 : 80.0,
            child: const Text(
              '0.00',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF1E293B)),
            ),
          )),
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
