import 'package:flutter/material.dart';

class StaffManagementScreen extends StatelessWidget {
  const StaffManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildAddStaffForm(),
          const SizedBox(height: 24),
          _buildStaffList(),
        ],
      ),
    );
  }

  Widget _buildAddStaffForm() {
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
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: const [
                Icon(
                  Icons.person_add_alt_1_rounded,
                  color: Color(0xFF10B981),
                  size: 20,
                ),
                SizedBox(width: 8),
                Text(
                  'Add staff',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _buildFormField('Name', 'Enter full name')),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildFormField(
                        'Address',
                        'Enter residential address',
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildFormField(
                        'Mobile',
                        '+91 00000 00000',
                        keyboardType: TextInputType.phone,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: _buildDropdownField('User type', 'Normal User'),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildFormField(
                        'Email',
                        'example@mail.com',
                        keyboardType: TextInputType.emailAddress,
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(child: _buildPasswordField('Password')),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    SizedBox(
                      width: 320,
                      child: _buildPasswordField('Password confirmation'),
                    ),
                    const Spacer(),
                    ElevatedButton.icon(
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
                      icon: const Icon(Icons.save_rounded, size: 18),
                      label: const Text(
                        'Save staff',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStaffList() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Text(
                  'Show',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                ),
                const SizedBox(width: 8),
                _buildEntriesDropdown(),
                const SizedBox(width: 8),
                const Text(
                  'entries',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                ),
                const Spacer(),
                const Text(
                  'Search:',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                ),
                const SizedBox(width: 8),
                _buildSearchBox(),
              ],
            ),
          ),
          _buildStaffTable(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Text(
                  'Showing 1 to 5 of 6 entries',
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

  Widget _buildFormField(
    String label,
    String hint, {
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 42,
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
              hintStyle: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 13,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.only(bottom: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordField(String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 42,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              const Expanded(
                child: TextField(
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: '••••••••',
                    hintStyle: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 13,
                    ),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.only(bottom: 12),
                  ),
                ),
              ),
              const Icon(
                Icons.visibility_outlined,
                size: 18,
                color: Color(0xFF94A3B8),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 42,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Text(
                value,
                style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B)),
              ),
              const Spacer(),
              const Icon(
                Icons.keyboard_arrow_down_rounded,
                size: 18,
                color: Color(0xFF94A3B8),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStaffTable() {
    return Column(
      children: [
        Container(
          color: const Color(0xFFF8FAFC),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          child: Row(
            children: [
              _buildHeadCell('#', width: 40, hasSort: true),
              _buildHeadCell('Name', isExpand: true, hasSort: true),
              _buildHeadCell('Address', isExpand: true, hasSort: true),
              _buildHeadCell('Mobile', isExpand: true, hasSort: true),
              _buildHeadCell('Email', isExpand: true, hasSort: true),
              _buildHeadCell('User type', width: 100, hasSort: true),
              _buildHeadCell('Status', width: 100, hasSort: true),
              _buildHeadCell('Action', width: 60),
            ],
          ),
        ),
        _buildStaffRow(
          1,
          'Shibli',
          'Calicut, Kerala',
          '+91 9876543210',
          'shibli@mail.com',
          'Normal User',
          false,
        ),
        _buildStaffRow(
          2,
          'Soumya',
          'Kochi, Kerala',
          '+91 9876543211',
          'soumya@mail.com',
          'Normal User',
          true,
        ),
        _buildStaffRow(
          3,
          'Sahla',
          'Malappuram, Kerala',
          '+91 9876543212',
          'sahla@mail.com',
          'Normal User',
          true,
        ),
        _buildStaffRow(
          4,
          'Irfan Sadique',
          'Palakkad, Kerala',
          '+91 9876543213',
          'irfan@mail.com',
          'Normal User',
          true,
        ),
        _buildStaffRow(
          5,
          'Sheeja',
          'Kannur, Kerala',
          '+91 9876543214',
          'sheeja@mail.com',
          'Normal User',
          true,
        ),
      ],
    );
  }

  Widget _buildHeadCell(
    String label, {
    double? width,
    bool isExpand = false,
    bool hasSort = false,
  }) {
    Widget content = Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: Color(0xFF475569),
          ),
        ),
        if (hasSort) ...[
          const SizedBox(width: 4),
          const Icon(
            Icons.unfold_more_rounded,
            size: 12,
            color: Color(0xFF94A3B8),
          ),
        ],
      ],
    );
    if (isExpand) return Expanded(child: content);
    return SizedBox(width: width, child: content);
  }

  Widget _buildStaffRow(
    int id,
    String name,
    String address,
    String mobile,
    String email,
    String type,
    bool isActive,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 40,
            child: Text(
              '$id',
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
          ),
          Expanded(
            child: Row(
              children: [
                _buildAvatar(name),
                const SizedBox(width: 12),
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Text(
              address,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
          ),
          Expanded(
            child: Text(
              mobile,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
          ),
          Expanded(
            child: Text(
              email,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
          ),
          SizedBox(
            width: 100,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    type,
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 100,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isActive
                    ? const Color(0xFFECFDF5)
                    : const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isActive
                      ? const Color(0xFF10B981).withOpacity(0.2)
                      : const Color(0xFFEF4444).withOpacity(0.2),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isActive
                        ? Icons.check_circle_rounded
                        : Icons.cancel_rounded,
                    size: 10,
                    color: isActive
                        ? const Color(0xFF10B981)
                        : const Color(0xFFEF4444),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isActive ? 'Active' : 'Inactive',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isActive
                          ? const Color(0xFF10B981)
                          : const Color(0xFFEF4444),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(
            width: 60,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(
                Icons.edit_outlined,
                size: 14,
                color: Color(0xFFF97316),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(String name) {
    String initials = name
        .split(' ')
        .map((e) => e[0])
        .take(2)
        .join('')
        .toUpperCase();
    return Container(
      width: 28,
      height: 28,
      decoration: const BoxDecoration(
        color: Color(0xFFEFF6FF),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Color(0xFF3B82F6),
          ),
        ),
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
      child: const Text(
        '10',
        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildSearchBox() {
    return Container(
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
    );
  }

  Widget _buildPagination() {
    return Row(
      children: [
        _buildPageBtn('Previous', isEnabled: false),
        _buildPageBtn('1', isActive: true),
        _buildPageBtn('Next'),
      ],
    );
  }

  Widget _buildPageBtn(
    String label, {
    bool isActive = false,
    bool isEnabled = true,
  }) {
    return Container(
      margin: const EdgeInsets.only(left: 4),
      child: TextButton(
        onPressed: isEnabled ? () {} : null,
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          backgroundColor: isActive
              ? const Color(0xFF1E293B)
              : Colors.transparent,
          foregroundColor: isActive
              ? Colors.white
              : (isEnabled ? const Color(0xFF64748B) : const Color(0xFFCBD5E1)),
          minimumSize: const Size(0, 32),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(4),
            side: BorderSide(
              color: isActive ? Colors.transparent : const Color(0xFFE2E8F0),
            ),
          ),
        ),
        child: Text(label, style: const TextStyle(fontSize: 12)),
      ),
    );
  }
}
