import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'services/auth_service.dart';
import 'services/google_sheets_service.dart';
import 'services/local_excel_service.dart';
import 'config/google_sheets_config.dart';

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
  bool _isLoading = false;
  bool _isSaving = false;
  
  List<StaffMember> _staffList = [];
  List<StaffMember> _filteredStaffList = [];
  String _spreadsheetId = '';

  final GoogleSheetsService _sheetsService = GoogleSheetsService();
  final LocalExcelService _localExcelService = LocalExcelService();
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _initAndLoadStaff();
    _searchController.addListener(_filterStaff);
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

  Future<void> _initAndLoadStaff() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final directory = await getApplicationDocumentsDirectory();
      await _localExcelService.initDatabase(directory.path);
      
      _spreadsheetId = await _authService.getSpreadsheetId();
      
      if (_spreadsheetId.isNotEmpty) {
        // Authenticate service
        final credentialsJson = await DefaultAssetBundle.of(context)
            .loadString('assets/credentials/google_sheets_credentials.json');
        await _sheetsService.init(credentialsJson);

        // Fetch staff
        await _fetchStaffData();
      } else {
        print('No spreadsheet ID configured.');
      }
    } catch (e) {
      print('Error initializing staff list: $e');
      // Load offline cache as fallback
      await _loadFromLocalCache();
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchStaffData() async {
    try {
      final staff = await _authService.refreshStaffCache();
      setState(() {
        _staffList = staff;
        _filteredStaffList = List.from(_staffList);
      });
    } catch (e) {
      print('Failed fetching staff: $e');
      await _loadFromLocalCache();
    }
  }

  Future<void> _loadFromLocalCache() async {
    // Attempt loading from cache via AuthService
    try {
      final staff = await _authService.refreshStaffCache(); // will read from sheets or fallback
      setState(() {
        _staffList = staff;
        _filteredStaffList = List.from(_staffList);
      });
    } catch (e) {
      print('Local cache read failed: $e');
    }
  }

  void _filterStaff() {
    final query = _searchController.text.toLowerCase().trim();
    setState(() {
      if (query.isEmpty) {
        _filteredStaffList = List.from(_staffList);
      } else {
        _filteredStaffList = _staffList.where((staff) {
          return staff.name.toLowerCase().contains(query) ||
              staff.email.toLowerCase().contains(query) ||
              staff.mobile.contains(query) ||
              staff.address.toLowerCase().contains(query) ||
              staff.userType.toLowerCase().contains(query);
        }).toList();
      }
    });
  }

  Future<void> _handleSaveStaff() async {
    if (_spreadsheetId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please configure Spreadsheet ID on the Login screen first.'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    final name = _nameController.text.trim();
    final address = _addressController.text.trim();
    final mobile = _mobileController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final confirm = _confirmController.text.trim();

    if (name.isEmpty || address.isEmpty || mobile.isEmpty || email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All fields are required'), backgroundColor: Colors.orangeAccent),
      );
      return;
    }

    if (password != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match'), backgroundColor: Colors.redAccent),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      // Calculate new numeric ID
      int nextId = 1;
      if (_staffList.isNotEmpty) {
        final ids = _staffList.map((s) => int.tryParse(s.id) ?? 0).toList();
        nextId = ids.reduce((curr, next) => curr > next ? curr : next) + 1;
      }

      final type = _selectedUserType == 'Admin' ? 'admin' : 'staff';
      final status = 'Active';
      final hashedPassword = AuthService.generatePasswordHash(password);

      final newRow = [
        '$nextId',
        name,
        address,
        mobile,
        email,
        type,
        status,
        hashedPassword,
      ];

      // Append row to Google Sheets
      await _sheetsService.appendRow(_spreadsheetId, GoogleSheetsConfig.staffSheetName, newRow);
      
      // Refresh cache
      await _fetchStaffData();

      // Clear Form
      _nameController.clear();
      _addressController.clear();
      _mobileController.clear();
      _emailController.clear();
      _passwordController.clear();
      _confirmController.clear();
      setState(() {
        _selectedUserType = 'Normal User';
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Staff saved successfully to Google Sheets!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving staff: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      setState(() {
        _isSaving = false;
      });
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
                    Expanded(child: _buildPasswordField('Password', _passwordController)),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    SizedBox(
                      width: 320,
                      child: _buildPasswordField('Password confirmation', _confirmController),
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

  Widget _buildStaffListSection() {
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
          _isLoading
              ? const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(
                    child: CircularProgressIndicator(color: Color(0xFF10B981)),
                  ),
                )
              : _buildStaffTable(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  'Showing 1 to ${_filteredStaffList.length} of ${_filteredStaffList.length} entries',
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

  Widget _buildPasswordField(String label, TextEditingController controller) {
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
                  obscureText: true,
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

  Widget _buildStaffTable() {
    if (_filteredStaffList.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        alignment: Alignment.center,
        child: const Text('No staff members found.', style: TextStyle(color: Color(0xFF64748B))),
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
        ..._filteredStaffList.asMap().entries.map((entry) {
          final index = entry.key + 1;
          final staff = entry.value;
          return _buildStaffRow(
            index,
            staff.name,
            staff.address,
            staff.mobile,
            staff.email,
            staff.userType.toUpperCase() == 'ADMIN' ? 'Admin' : 'Normal User',
            staff.status.toUpperCase() == 'ACTIVE',
          );
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
                Expanded(
                  child: Text(
                    name,
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
              address,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Expanded(
            child: Text(
              mobile,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Expanded(
            child: Text(
              email,
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
