import 'package:flutter/material.dart';

class NewEntryScreen extends StatelessWidget {
  const NewEntryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Custom Page Header (Under Navbar)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'New entry',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF1E293B),
                ),
              ),
              _buildCustomDatePicker(context),
            ],
          ),
          const SizedBox(height: 24),
          _buildSectionCard(
            title: 'CUSTOMER DETAILS',
            icon: Icons.person_outline_rounded,
            actions: [],
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildTextField(
                    label: 'MOBILE',
                    hint: 'Enter mobile number',
                    keyboardType: TextInputType.phone,
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        height: 20,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'NAME',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: Checkbox(
                                    value: false,
                                    onChanged: (v) {},
                                    visualDensity: VisualDensity.compact,
                                    activeColor: const Color(0xFF10B981),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Text(
                                  'Enable name search',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Color(0xFF10B981),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        height: 40,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: const TextField(
                          keyboardType: TextInputType.name,
                          decoration: InputDecoration(
                            hintText: '',
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.only(bottom: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(child: _buildTextField(label: 'ADDRESS', hint: '', keyboardType: TextInputType.streetAddress)),
                const SizedBox(width: 20),
                Expanded(child: _buildTextField(label: 'EMAIL', hint: '', keyboardType: TextInputType.emailAddress)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildSectionCard(
            title: 'SERVICE DETAILS',
            icon: Icons.grid_view_rounded,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildDropdown(
                        label: 'SERVICES',
                        hint: 'Select services...',
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildDropdown(
                        label: 'WALLETS',
                        hint: 'No wallet',
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildTextField(label: 'WALLET CHARGE', hint: '0', keyboardType: TextInputType.number),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildTextField(
                        label: 'SERVICE CHARGE 1',
                        hint: '0',
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: _buildTextField(
                        label: 'SERVICE CHARGE 2',
                        hint: '0',
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildTextField(
                        label: 'SERVICE CHARGE 3',
                        hint: '0',
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildTextField(label: 'TOTAL', hint: '0', keyboardType: TextInputType.number),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildTextField(label: 'E-DISTRICT', hint: ''),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 18,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.add_rounded),
                    label: const Text(
                      'Add service',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildSectionCard(
            title: 'SERVICE LIST',
            icon: Icons.table_chart_outlined,
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _buildTableHeader(),
                Container(
                  height: 100,
                  alignment: Alignment.center,
                  child: const Text(
                    'No services added yet',
                    style: TextStyle(
                      color: Colors.grey,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: _buildSectionCard(
                  title: '',
                  icon: null,
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildDropdown(
                          label: 'PAYMENT MODE',
                          hint: 'By cash',
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildDropdown(
                          label: 'REFERENCE',
                          hint: 'Not BPO',
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          label: 'TOTAL AMOUNT',
                          hint: '0',
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(label: 'ADVANCE', hint: '0', keyboardType: TextInputType.number),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              SizedBox(
                                height: 24,
                                width: 24,
                                child: Checkbox(
                                  value: false,
                                  onChanged: (v) {},
                                  activeColor: const Color(0xFF10B981),
                                  visualDensity: VisualDensity.compact,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Text(
                                'Is repeated',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          _buildCustomDatePicker(context),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 24),
              ElevatedButton.icon(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E293B),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 20,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                icon: const Icon(Icons.save_rounded, size: 18),
                label: const Text(
                  'Save entry',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData? icon,
    required Widget child,
    List<Widget>? actions,
    EdgeInsets? padding,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 15, 20, 15),
              child: Row(
                children: [
                  if (icon != null)
                    Icon(icon, size: 20, color: const Color(0xFF10B981)),
                  const SizedBox(width: 12),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const Spacer(),
                  if (actions != null) ...actions,
                ],
              ),
            ),
          if (title.isNotEmpty)
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
          Padding(padding: padding ?? const EdgeInsets.all(24), child: child),
        ],
      ),
    );
  }

  Widget _buildTextField({required String label, required String hint, TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 20,
          child: Align(
            alignment: Alignment.bottomLeft,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: TextField(
            keyboardType: keyboardType,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: Colors.black26, fontSize: 13),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.only(bottom: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({required String label, required String hint}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 20,
          child: Align(
            alignment: Alignment.bottomLeft,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Text(
                hint,
                style: const TextStyle(color: Colors.black87, fontSize: 13),
              ),
              const Spacer(),
              const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: Colors.black26,
                size: 18,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTableHeader() {
    return Container(
      color: const Color(0xFFEFF6FF),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: Row(
        children: const [
          Expanded(
            child: Text(
              'SERVICE',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'WALLETS',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'WALLET CHARGE',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'GATEWAY CHARGE',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'DOCUMENTS',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'S.CHARGE 1',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'S.CHARGE 2',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'S.CHARGE 3',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'TOTAL',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Text(
            'ACTION',
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Row(
      children: [
        const Text(
          '© 2024 Smart Akshaya - Kerala State IT Mission. All rights reserved.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
        ),
        const Spacer(),
        _footerLink('Privacy Policy'),
        const SizedBox(width: 24),
        _footerLink('Terms of Service'),
        const SizedBox(width: 24),
        _footerLink('Help Desk'),
        const SizedBox(width: 24),
        _footerLink('Contact Us'),
      ],
    );
  }

  Widget _footerLink(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: Color(0xFF1E293B),
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  Widget _buildCustomDatePicker(BuildContext context) {
    return InkWell(
      onTap: () async {
        await showDatePicker(
          context: context,
          initialDate: DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime(2030),
          builder: (context, child) {
            return Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.light(
                  primary: Color(0xFF10B981),
                  onPrimary: Colors.white,
                  onSurface: Color(0xFF1E293B),
                ),
                textButtonTheme: TextButtonThemeData(
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF10B981),
                  ),
                ),
              ),
              child: child!,
            );
          },
        );
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: const [
            Icon(
              Icons.calendar_month_rounded,
              size: 16,
              color: Color(0xFF3B82F6),
            ),
            SizedBox(width: 10),
            Text(
              '2026-05-09',
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF1E293B),
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(width: 8),
            Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 16,
              color: Color(0xFF94A3B8),
            ),
          ],
        ),
      ),
    );
  }
}
