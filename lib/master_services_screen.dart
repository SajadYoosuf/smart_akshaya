import 'package:flutter/material.dart';

class MasterServicesScreen extends StatelessWidget {
  const MasterServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Side - Add Service Form
          SizedBox(
            width: 320,
            child: _buildAddServiceForm(),
          ),
          const SizedBox(width: 24),
          // Right Side - Service List Table
          Expanded(
            child: _buildServiceList(),
          ),
        ],
      ),
    );
  }

  Widget _buildAddServiceForm() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: const Text(
              'Add service',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('Service name'),
                _buildTextField('Enter name'),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildMiniField('CH. 1', '0.00')),
                    const SizedBox(width: 12),
                    Expanded(child: _buildMiniField('CH. 2', '0.00')),
                    const SizedBox(width: 12),
                    Expanded(child: _buildMiniField('CH. 3', '0.00')),
                  ],
                ),
                const SizedBox(height: 16),
                _buildLabel('Wallet'),
                _buildDropdown('CASH'),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildLabelAndField('Wallet charge', '0')),
                    const SizedBox(width: 12),
                    Expanded(child: _buildLabelAndField('Time (Min)', '15')),
                  ],
                ),
                const SizedBox(height: 16),
                _buildLabel('Required documents'),
                _buildTextArea('List documents...'),
                const SizedBox(height: 20),
                _buildCheckbox('Repeated', false),
                _buildCheckbox('eDistrict', true),
                _buildCheckbox('Gateway', false),
                _buildCheckbox('Print/Scan/Copy', true),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00695C),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      elevation: 0,
                    ),
                    child: const Text('Save service', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceList() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          // Table Header Controls
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Text('Show', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                const SizedBox(width: 8),
                _buildEntriesDropdown(),
                const SizedBox(width: 8),
                const Text('entries', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                const Spacer(),
                _buildSearchField(),
              ],
            ),
          ),
          // Table
          _buildDataTable(),
          // Table Footer
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Text(
                  'Showing 1 to 10 of 42 entries',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const Spacer(),
                _buildPagination(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
    );
  }

  Widget _buildTextField(String hint) {
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.only(bottom: 12),
        ),
      ),
    );
  }

  Widget _buildMiniField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
        const SizedBox(height: 4),
        _buildTextField(value),
      ],
    );
  }

  Widget _buildLabelAndField(String label, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(label),
        _buildTextField(hint),
      ],
    );
  }

  Widget _buildDropdown(String value) {
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Text(value, style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B))),
          const Spacer(),
          const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: Color(0xFF94A3B8)),
        ],
      ),
    );
  }

  Widget _buildTextArea(String hint) {
    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        maxLines: 3,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildCheckbox(String label, bool value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            height: 24,
            width: 24,
            child: Checkbox(
              value: value,
              onChanged: (v) {},
              activeColor: const Color(0xFF00695C),
              visualDensity: VisualDensity.compact,
            ),
          ),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B))),
        ],
      ),
    );
  }

  Widget _buildEntriesDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: const Text('10', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildSearchField() {
    return Container(
      width: 220,
      height: 36,
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: const [
          SizedBox(width: 10),
          Icon(Icons.search_rounded, size: 16, color: Color(0xFF94A3B8)),
          SizedBox(width: 8),
          Expanded(
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search services...',
                hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                border: InputBorder.none,
                contentPadding: EdgeInsets.only(bottom: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDataTable() {
    return Column(
      children: [
        // Header
        Container(
          color: const Color(0xFFF8FAFC),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          child: Row(
            children: [
              _buildHeadCell('#', width: 30),
              _buildHeadCell('NAME', isExpand: true, hasSort: true),
              _buildHeadCell('CHARGE 1', width: 70),
              _buildHeadCell('CHARGE 2', width: 70),
              _buildHeadCell('CHARGE 3', width: 70),
              _buildHeadCell('WALLET', width: 80),
              _buildHeadCell('W. CHARGE', width: 70),
              _buildHeadCell('ACTION', width: 80),
            ],
          ),
        ),
        const Divider(height: 1),
        // Rows
        _buildDataRow(1, 'Income Certificate', '20.00', '30.00', '40.00', 'EDISTRICT', '7.00'),
        _buildDataRow(2, 'Caste Certificate', '20.00', '30.00', '40.00', 'EDISTRICT', '7.00'),
        _buildDataRow(3, 'Passport Application', '150.00', '200.00', '250.00', 'GATEWAY', '1500.00'),
        _buildDataRow(4, 'Electricity Bill Pay', '15.00', '20.00', '25.00', 'CASH', '0.00'),
        _buildDataRow(5, 'Ration Card Entry', '30.00', '50.00', '70.00', 'EDISTRICT', '15.00'),
        _buildDataRow(6, 'Election ID Renewal', '25.00', '35.00', '45.00', 'SBI', '2.50'),
      ],
    );
  }

  Widget _buildHeadCell(String label, {double? width, bool isExpand = false, bool hasSort = false}) {
    Widget content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
        ),
        if (hasSort) ...[
          const SizedBox(width: 4),
          const Icon(Icons.unfold_more_rounded, size: 12, color: Color(0xFF94A3B8)),
        ],
      ],
    );
    if (isExpand) return Expanded(child: content);
    return SizedBox(width: width, child: content);
  }

  Widget _buildDataRow(int id, String name, String c1, String c2, String c3, String wallet, String wc) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          SizedBox(width: 30, child: Text('$id', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)))),
          Expanded(child: Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF1E293B)))),
          SizedBox(width: 70, child: Text(c1, style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)))),
          SizedBox(width: 70, child: Text(c2, style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)))),
          SizedBox(width: 70, child: Text(c3, style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)))),
          SizedBox(
            width: 80,
            child: _buildBadge(wallet),
          ),
          SizedBox(width: 70, child: Text(wc, style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)))),
          SizedBox(
            width: 80,
            child: Row(
              children: [
                _buildActionButton(Icons.edit_outlined, const Color(0xFFFFF7ED), const Color(0xFFF97316)),
                const SizedBox(width: 8),
                _buildActionButton(Icons.delete_outline_rounded, const Color(0xFFFEF2F2), const Color(0xFFEF4444)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String label) {
    Color color = const Color(0xFF3B82F6);
    if (label == 'EDISTRICT') color = const Color(0xFF10B981);
    if (label == 'GATEWAY') color = const Color(0xFF6366F1);
    if (label == 'CASH') color = const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  Widget _buildActionButton(IconData icon, Color bg, Color iconColor) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Icon(icon, size: 14, color: iconColor),
    );
  }

  Widget _buildPagination() {
    return Row(
      children: [
        _buildPageBtn('Previous', isEnabled: false),
        _buildPageBtn('1', isActive: true),
        _buildPageBtn('2'),
        _buildPageBtn('3'),
        _buildPageBtn('4'),
        _buildPageBtn('5'),
        _buildPageBtn('Next'),
      ],
    );
  }

  Widget _buildPageBtn(String label, {bool isActive = false, bool isEnabled = true}) {
    return Container(
      margin: const EdgeInsets.only(left: 4),
      child: TextButton(
        onPressed: isEnabled ? () {} : null,
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          backgroundColor: isActive ? const Color(0xFF00695C) : Colors.transparent,
          foregroundColor: isActive ? Colors.white : (isEnabled ? const Color(0xFF64748B) : const Color(0xFFCBD5E1)),
          minimumSize: const Size(0, 32),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(4),
            side: BorderSide(color: isActive ? Colors.transparent : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Text(label, style: const TextStyle(fontSize: 12)),
      ),
    );
  }
}
