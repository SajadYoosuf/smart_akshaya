import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/staff_provider.dart';
import 'core/data_state.dart';
import 'models/staff_member.dart';
import 'services/auth_service.dart';

class StaffManagementScreen extends StatefulWidget {
  const StaffManagementScreen({super.key});

  @override
  State<StaffManagementScreen> createState() => _StaffManagementScreenState();
}

class _StaffManagementScreenState extends State<StaffManagementScreen> {
  // Form Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _mobileController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();

  String _selectedUserType = 'Normal User';
  bool _isSaving = false;
  
  bool _isEditing = false;
  int? _editingRowIndex;
  String? _editingStaffId;

  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StaffProvider>().loadStaff();
    });
    _searchController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onEditStaff(StaffMember staff) {
    setState(() {
      _isEditing = true;
      _editingRowIndex = staff.rowIndex;
      _editingStaffId = staff.id;
      _nameController.text = staff.name;
      _addressController.text = staff.address;
      _mobileController.text = staff.mobile;
      _emailController.text = staff.email;
      _selectedUserType = staff.userType.toLowerCase() == 'admin' ? 'Admin' : 'Normal User';
      _passwordController.clear();
      _confirmController.clear();
    });
  }

  void _resetForm() {
    setState(() {
      _isEditing = false;
      _editingRowIndex = null;
      _editingStaffId = null;
      _nameController.clear();
      _addressController.clear();
      _mobileController.clear();
      _emailController.clear();
      _passwordController.clear();
      _confirmController.clear();
      _selectedUserType = 'Normal User';
    });
  }

  Future<void> _deleteStaff(StaffMember staff) async {
    setState(() => _isSaving = true);
    try {
      await context.read<StaffProvider>().deleteStaff(staff.rowIndex);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Staff deleted!'), backgroundColor: Colors.green));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed deleting: $e'), backgroundColor: Colors.redAccent));
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _handleSaveStaff() async {
    final name = _nameController.text.trim();
    final address = _addressController.text.trim();
    final mobile = _mobileController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final confirm = _confirmController.text.trim();

    if (name.isEmpty || address.isEmpty || mobile.isEmpty || email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All fields except password are required'), backgroundColor: Colors.orangeAccent),
      );
      return;
    }

    String computedPassword = password;
    if (!_isEditing && password.isEmpty) {
      final firstName = name.split(' ').first.toLowerCase();
      computedPassword = '${firstName}akshaya';
    } else if (password.isNotEmpty && password != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match'), backgroundColor: Colors.redAccent),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final type = _selectedUserType == 'Admin' ? 'admin' : 'staff';
      String status = 'Active';

      final staffProvider = context.read<StaffProvider>();
      final currentState = staffProvider.state;
      final staffList = currentState is DataSuccess<List<StaffMember>> ? currentState.data : <StaffMember>[];

      if (_isEditing && _editingRowIndex != null) {
        final oldStaff = staffList.firstWhere((s) => s.rowIndex == _editingRowIndex);
        final finalPassword = computedPassword.isEmpty ? oldStaff.password : AuthService.generatePasswordHash(computedPassword);
        status = oldStaff.status;

        final updatedStaff = StaffMember(
          rowIndex: _editingRowIndex!,
          id: _editingStaffId ?? '',
          name: name,
          address: address,
          mobile: mobile,
          email: email,
          userType: type,
          status: status,
          password: finalPassword,
        );

        await staffProvider.updateStaff(updatedStaff);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Staff updated successfully!'), backgroundColor: Colors.green),
          );
        }
      } else {
        int nextId = 1;
        if (staffList.isNotEmpty) {
          final ids = staffList.map((s) => int.tryParse(s.id) ?? 0).toList();
          nextId = ids.reduce((curr, next) => curr > next ? curr : next) + 1;
        }

        final finalPassword = AuthService.generatePasswordHash(computedPassword);

        final newStaff = StaffMember(
          id: '$nextId',
          name: name,
          address: address,
          mobile: mobile,
          email: email,
          userType: type,
          status: status,
          password: finalPassword,
        );

        await staffProvider.addStaff(newStaff);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Staff added successfully!'), backgroundColor: Colors.green),
          );
        }
      }
      
      _resetForm();

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving staff: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildAddStaffForm(),
          const SizedBox(height: 24),
          _buildStaffListSection(),
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
              children: [
                const Icon(
                  Icons.person_add_alt_1_rounded,
                  color: Color(0xFF10B981),
                  size: 20,
                ),
                SizedBox(width: 8),
                  Text(
                    _isEditing ? 'Edit staff' : 'Add staff',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  if (_isEditing) ...[
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF64748B)),
                      onPressed: _resetForm,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
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
                    Expanded(child: _buildFormField('Name', 'Enter full name', controller: _nameController)),
                    const SizedBox(width: 20),
                    Expanded(child: _buildFormField('Address', 'Enter residential address', controller: _addressController)),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildFormField(
                        'Mobile',
                        '+91 00000 00000',
                        keyboardType: TextInputType.phone,
                        controller: _mobileController,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: _buildDropdownField('User type'),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildFormField(
                        'Email',
                        'example@mail.com',
                        keyboardType: TextInputType.emailAddress,
                        controller: _emailController,
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildPasswordField(
                        'Password',
                        _passwordController,
                        _obscurePassword,
                        () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    SizedBox(
                      width: 320,
                      child: _buildPasswordField(
                        'Password confirmation',
                        _confirmController,
                        _obscureConfirm,
                        () => setState(() => _obscureConfirm = !_obscureConfirm),
                      ),
                    ),
                    const Spacer(),
                    _isSaving
                        ? const CircularProgressIndicator(color: Color(0xFF10B981))
                        : ElevatedButton.icon(
                            onPressed: _handleSaveStaff,
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
                            label: Text(
                              _isEditing ? 'Update staff' : 'Save staff',
                              style: const TextStyle(fontWeight: FontWeight.bold),
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

  Widget _buildStaffListSection() {
    return Consumer<StaffProvider>(
      builder: (context, provider, child) {
        final state = provider.state;
        
        List<StaffMember> filteredList = [];
        if (state is DataSuccess<List<StaffMember>>) {
          final query = _searchController.text.toLowerCase().trim();
          filteredList = query.isEmpty 
              ? state.data 
              : state.data.where((staff) {
                  return staff.name.toLowerCase().contains(query) ||
                      staff.email.toLowerCase().contains(query) ||
                      staff.mobile.contains(query) ||
                      staff.address.toLowerCase().contains(query) ||
                      staff.userType.toLowerCase().contains(query);
                }).toList();
        }

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
                    const Text('Show', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                    const SizedBox(width: 8),
                    _buildEntriesDropdown(),
                    const SizedBox(width: 8),
                    const Text('entries', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                    const Spacer(),
                    const Text('Search:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                    const SizedBox(width: 8),
                    _buildSearchBox(),
                  ],
                ),
              ),
              if (state is DataLoading || state is DataInitial)
                const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
                )
              else if (state is DataError)
                Padding(
                  padding: const EdgeInsets.all(40),
                  child: Center(child: Text((state as DataError).message, style: const TextStyle(color: Colors.red))),
                )
              else if (state is DataEmpty)
                const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: Text('No staff members found.', style: TextStyle(color: Color(0xFF64748B)))),
                )
              else
                _buildStaffTable(filteredList),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Text(
                      'Showing 1 to ${filteredList.length} of ${filteredList.length} entries',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                    const Spacer(),
                    _buildPagination(),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFormField(
    String label,
    String hint, {
    TextInputType? keyboardType,
    required TextEditingController controller,
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
            controller: controller,
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

  Widget _buildPasswordField(
    String label,
    TextEditingController controller,
    bool obscureText,
    VoidCallback onToggleVisibility,
  ) {
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
              Expanded(
                child: TextField(
                  controller: controller,
                  obscureText: obscureText,
                  decoration: const InputDecoration(
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
              InkWell(
                onTap: onToggleVisibility,
                borderRadius: BorderRadius.circular(20),
                child: Padding(
                  padding: const EdgeInsets.all(4.0),
                  child: Icon(
                    obscureText ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    size: 18,
                    color: const Color(0xFF94A3B8),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField(String label) {
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
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedUserType,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF94A3B8), size: 18),
              isExpanded: true,
              style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B)),
              items: <String>['Normal User', 'Admin'].map((String value) {
                return DropdownMenuItem<String>(
                  value: value,
                  child: Text(value),
                );
              }).toList(),
              onChanged: (String? newValue) {
                if (newValue != null) {
                  setState(() {
                    _selectedUserType = newValue;
                  });
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStaffTable(List<StaffMember> filteredStaffList) {
    if (filteredStaffList.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        alignment: Alignment.center,
        child: const Text('No staff members found matching your search.', style: TextStyle(color: Color(0xFF64748B))),
      );
    }

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
        ...filteredStaffList.asMap().entries.map((entry) {
          final index = entry.key + 1;
          final staff = entry.value;
          return _buildStaffRow(index, staff);
        }).toList(),
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

  Widget _buildStaffRow(int index, StaffMember staff) {
    final isActive = staff.status.toUpperCase() == 'ACTIVE';
    final type = staff.userType.toUpperCase() == 'ADMIN' ? 'Admin' : 'Normal User';
    
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
              '${staff.id}',
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
          ),
          Expanded(
            child: Row(
              children: [
                _buildAvatar(staff.name),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    staff.name,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1E293B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Text(
              staff.address,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Expanded(
            child: Text(
              staff.mobile,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Expanded(
            child: Text(
              staff.email,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
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
            width: 70,
            child: Row(
              children: [
                InkWell(
                  onTap: () => _onEditStaff(staff),
                  borderRadius: BorderRadius.circular(6),
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
                const SizedBox(width: 4),
                InkWell(
                  onTap: () => _deleteStaff(staff),
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.delete_outline_rounded,
                      size: 14,
                      color: Color(0xFFEF4444),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(String name) {
    String initials = 'RM';
    if (name.isNotEmpty) {
      initials = name
          .split(' ')
          .map((e) => e.isNotEmpty ? e[0] : '')
          .take(2)
          .join('')
          .toUpperCase();
      if (initials.isEmpty) initials = 'U';
    }
    
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
      child: TextField(
        controller: _searchController,
        decoration: const InputDecoration(
          border: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          hintText: 'Search...',
          hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
      ),
    );
  }

  Widget _buildPagination() {
    return Row(
      children: [
        _buildPageBtn('Previous', isEnabled: false),
        _buildPageBtn('1', isActive: true),
        _buildPageBtn('Next', isEnabled: false),
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
