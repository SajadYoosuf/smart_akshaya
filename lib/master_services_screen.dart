import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import 'package:html/parser.dart' as html_parser;
import 'package:url_launcher/url_launcher.dart';
import 'services/auth_service.dart';
import 'services/google_sheets_service.dart';
import 'services/local_excel_service.dart';
import 'config/google_sheets_config.dart';

class ServiceItem {
  final String id;
  final String serviceName;
  final String website;
  final String departmentFee;
  final String serviceCharge;
  final String commission;
  final bool allowEdit;
  final String followupDays;
  final String defaultWallet;

  ServiceItem({
    required this.id,
    required this.serviceName,
    required this.website,
    required this.departmentFee,
    required this.serviceCharge,
    required this.commission,
    required this.allowEdit,
    required this.followupDays,
    required this.defaultWallet,
  });

  factory ServiceItem.fromRow(List<dynamic> row) {
    return ServiceItem(
      id: row.length > 0 ? row[0].toString() : '',
      serviceName: row.length > 1 ? row[1].toString() : '',
      website: row.length > 2 ? row[2].toString() : '',
      departmentFee: row.length > 3 ? row[3].toString() : '0.00',
      serviceCharge: row.length > 4 ? row[4].toString() : '0.00',
      commission: row.length > 5 ? row[5].toString() : '0.00',
      allowEdit: row.length > 6
          ? row[6].toString().toLowerCase() == 'true'
          : false,
      followupDays: row.length > 7 ? row[7].toString() : '0',
      defaultWallet: row.length > 8 ? row[8].toString() : 'CASH',
    );
  }

  List<dynamic> toRow() {
    return [
      id,
      serviceName,
      website,
      departmentFee,
      serviceCharge,
      commission,
      allowEdit.toString(),
      followupDays,
      defaultWallet,
    ];
  }
}

class MasterServicesScreen extends StatefulWidget {
  const MasterServicesScreen({super.key});

  @override
  State<MasterServicesScreen> createState() => _MasterServicesScreenState();
}

class _MasterServicesScreenState extends State<MasterServicesScreen> {
  // Form Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _websiteController = TextEditingController();
  final TextEditingController _deptFeeController = TextEditingController();
  final TextEditingController _serviceChargeController =
      TextEditingController();
  final TextEditingController _commissionController = TextEditingController();
  final TextEditingController _followupDaysController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();

  // Form States
  String _selectedWallet = 'CASH';
  bool _allowEdit = false;

  bool _isEditing = false;
  String? _editingId; // spreadsheet cell matching ID

  bool _isLoading = false;
  bool _isSaving = false;
  List<ServiceItem> _servicesList = [];
  List<ServiceItem> _filteredServicesList = [];
  String _spreadsheetId = '';

  final GoogleSheetsService _sheetsService = GoogleSheetsService();
  final LocalExcelService _localExcelService = LocalExcelService();
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _initAndLoadServices();
    _searchController.addListener(_filterServices);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _websiteController.dispose();
    _deptFeeController.dispose();
    _serviceChargeController.dispose();
    _commissionController.dispose();
    _followupDaysController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _initAndLoadServices() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final directory = await getApplicationDocumentsDirectory();
      await _localExcelService.initDatabase(directory.path);

      _spreadsheetId = await _authService.getSpreadsheetId();
      if (_spreadsheetId.isNotEmpty) {
        // Authenticate service
        final credentialsJson = await DefaultAssetBundle.of(
          context,
        ).loadString('assets/credentials/google_sheets_credentials.json');
        await _sheetsService.init(credentialsJson);

        await _fetchServicesData();
      }
    } catch (e) {
      print('Error initializing services list: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchServicesData() async {
    try {
      final rows = await _sheetsService.getRows(
        _spreadsheetId,
        GoogleSheetsConfig.serviceSheetName,
      );
      if (rows.isNotEmpty) {
        // Skip headers row
        final dataRows = rows.skip(1).toList();
        setState(() {
          _servicesList = dataRows
              .map((row) => ServiceItem.fromRow(row))
              .toList();
          _filteredServicesList = List.from(_servicesList);
        });
      } else {
        setState(() {
          _servicesList = [];
          _filteredServicesList = [];
        });
      }
    } catch (e) {
      print('Error fetching services from Google Sheets: $e');
    }
  }

  Future<void> _fetchNameFromLink() async {
    String url = _websiteController.text.trim();
    if (url.isEmpty) {
      // If link is empty, maybe they pasted the link in the name field (as per issue: "name field with link")
      url = _nameController.text.trim();
      if (url.startsWith('http')) {
        _websiteController.text = url;
      }
    }
    if (url.isEmpty || !url.startsWith('http')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid URL in the Website field'),
          backgroundColor: Colors.orangeAccent,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final uri = Uri.parse(url);
      final response = await http.get(uri).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        var document = html_parser.parse(response.body);
        String title = document.querySelector('title')?.text ?? '';
        if (title.isNotEmpty) {
          setState(() {
            _nameController.text = title.trim();
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Service name fetched from webpage!'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          throw Exception('No title tag found');
        }
      } else {
        throw Exception('Status code ${response.statusCode}');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to fetch name: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _filterServices() {
    final query = _searchController.text.toLowerCase().trim();
    setState(() {
      if (query.isEmpty) {
        _filteredServicesList = List.from(_servicesList);
      } else {
        _filteredServicesList = _servicesList.where((service) {
          return service.serviceName.toLowerCase().contains(query) ||
              service.defaultWallet.toLowerCase().contains(query);
        }).toList();
      }
    });
  }

  void _onEditService(ServiceItem service) {
    setState(() {
      _isEditing = true;
      _editingId = service.id;
      _nameController.text = service.serviceName;
      _websiteController.text = service.website;
      _deptFeeController.text = service.departmentFee;
      _serviceChargeController.text = service.serviceCharge;
      _commissionController.text = service.commission;
      _followupDaysController.text = service.followupDays;
      _selectedWallet = service.defaultWallet;
      _allowEdit = service.allowEdit;
    });
  }

  void _resetForm() {
    setState(() {
      _isEditing = false;
      _editingId = null;
      _nameController.clear();
      _websiteController.clear();
      _deptFeeController.clear();
      _serviceChargeController.clear();
      _commissionController.clear();
      _followupDaysController.clear();
      _selectedWallet = 'CASH';
      _allowEdit = false;
    });
  }

  Future<void> _handleSaveOrUpdateService() async {
    if (_spreadsheetId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please configure Spreadsheet ID on the Login screen first.',
          ),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    final name = _nameController.text.trim();
    final website = _websiteController.text.trim();
    final deptFee = _deptFeeController.text.trim().isEmpty
        ? '0.00'
        : _deptFeeController.text.trim();
    final serviceCharge = _serviceChargeController.text.trim().isEmpty
        ? '0.00'
        : _serviceChargeController.text.trim();
    final commission = _commissionController.text.trim().isEmpty
        ? '0.00'
        : _commissionController.text.trim();
    final followupDays = _followupDaysController.text.trim().isEmpty
        ? '0'
        : _followupDaysController.text.trim();

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Service Name is required'),
          backgroundColor: Colors.orangeAccent,
        ),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      if (_isEditing && _editingId != null) {
        // Find row in spreadsheet. Header is row 1, so row in sheets is sheetsIndex + 2
        final listIndex = _servicesList.indexWhere((s) => s.id == _editingId);
        if (listIndex != -1) {
          final serviceRowIndex =
              listIndex + 2; // +1 for 1-based index, +1 for header offset
          final updatedService = ServiceItem(
            id: _editingId!,
            serviceName: name,
            website: website,
            departmentFee: deptFee,
            serviceCharge: serviceCharge,
            commission: commission,
            allowEdit: _allowEdit,
            followupDays: followupDays,
            defaultWallet: _selectedWallet,
          );

          await _sheetsService.updateRow(
            _spreadsheetId,
            GoogleSheetsConfig.serviceSheetName,
            serviceRowIndex,
            updatedService.toRow(),
          );

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Service updated successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        // Save New Service
        int nextId = 1;
        if (_servicesList.isNotEmpty) {
          final ids = _servicesList
              .map((s) => int.tryParse(s.id) ?? 0)
              .toList();
          nextId = ids.reduce((curr, next) => curr > next ? curr : next) + 1;
        }

        final newService = ServiceItem(
          id: '$nextId',
          serviceName: name,
          website: website,
          departmentFee: deptFee,
          serviceCharge: serviceCharge,
          commission: commission,
          allowEdit: _allowEdit,
          followupDays: followupDays,
          defaultWallet: _selectedWallet,
        );

        await _sheetsService.appendRow(
          _spreadsheetId,
          GoogleSheetsConfig.serviceSheetName,
          newService.toRow(),
        );

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Service added successfully to Google Sheets!'),
            backgroundColor: Colors.green,
          ),
        );
      }

      await _fetchServicesData();
      _resetForm();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Operation failed: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
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
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Side - Add Service Form
          SizedBox(width: 320, child: _buildAddServiceForm()),
          const SizedBox(width: 24),
          // Right Side - Service List Table
          Expanded(child: _buildServiceListSection()),
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
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _isEditing ? 'Edit service' : 'Add service',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                if (_isEditing)
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 18),
                    onPressed: _resetForm,
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('Service name'),
                Row(
                  children: [
                    Expanded(
                      child: _buildTextField('Enter name', _nameController),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(
                        Icons.download_rounded,
                        color: Color(0xFF00695C),
                      ),
                      onPressed: _fetchNameFromLink,
                      tooltip: 'Fetch Name from Webpage Link',
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildLabel('Webpage Link'),
                _buildTextField('https://...', _websiteController),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildMiniField(
                        'DEPT FEE',
                        '0.00',
                        _deptFeeController,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMiniField(
                        'SRV CHARGE',
                        '0.00',
                        _serviceChargeController,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMiniField(
                        'COMMISSION',
                        '0.00',
                        _commissionController,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildLabel('Default Wallet'),
                _buildDropdown(_selectedWallet),
                const SizedBox(height: 16),
                _buildLabelAndField(
                  'Followup Days',
                  '0',
                  _followupDaysController,
                ),
                const SizedBox(height: 20),
                _buildCheckbox(
                  'Allow Edit',
                  _allowEdit,
                  (v) => setState(() => _allowEdit = v!),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: _isSaving
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFF00695C),
                          ),
                        )
                      : ElevatedButton(
                          onPressed: _handleSaveOrUpdateService,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00695C),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            elevation: 0,
                          ),
                          child: Text(
                            _isEditing ? 'Update service' : 'Save service',
                            style: const TextStyle(fontWeight: FontWeight.bold),
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

  Widget _buildServiceListSection() {
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
                _buildSearchField(),
              ],
            ),
          ),
          _isLoading
              ? const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(
                    child: CircularProgressIndicator(color: Color(0xFF00695C)),
                  ),
                )
              : _buildDataTable(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  'Showing 1 to ${_filteredServicesList.length} of ${_filteredServicesList.length} entries',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
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
      child: Text(
        label,
        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
      ),
    );
  }

  Widget _buildTextField(String hint, TextEditingController controller) {
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.only(bottom: 12),
        ),
      ),
    );
  }

  Widget _buildMiniField(
    String label,
    String value,
    TextEditingController controller,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.bold,
            color: Color(0xFF94A3B8),
          ),
        ),
        const SizedBox(height: 4),
        _buildTextField(value, controller),
      ],
    );
  }

  Widget _buildLabelAndField(
    String label,
    String hint,
    TextEditingController controller,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [_buildLabel(label), _buildTextField(hint, controller)],
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
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedWallet,
          icon: const Icon(
            Icons.keyboard_arrow_down_rounded,
            color: Color(0xFF94A3B8),
            size: 18,
          ),
          isExpanded: true,
          style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B)),
          items: <String>['CASH', 'EDISTRICT', 'GATEWAY', 'SBI'].map((
            String val,
          ) {
            return DropdownMenuItem<String>(value: val, child: Text(val));
          }).toList(),
          onChanged: (String? newVal) {
            if (newVal != null) {
              setState(() {
                _selectedWallet = newVal;
              });
            }
          },
        ),
      ),
    );
  }

  Widget _buildTextArea(String hint, TextEditingController controller) {
    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        controller: controller,
        maxLines: 3,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildCheckbox(String label, bool value, Function(bool?) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            height: 24,
            width: 24,
            child: Checkbox(
              value: value,
              onChanged: onChanged,
              activeColor: const Color(0xFF00695C),
              visualDensity: VisualDensity.compact,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B)),
          ),
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
      child: const Text(
        '10',
        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
      ),
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
        children: [
          const SizedBox(width: 10),
          const Icon(Icons.search_rounded, size: 16, color: Color(0xFF94A3B8)),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
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
    if (_filteredServicesList.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        alignment: Alignment.center,
        child: const Text(
          'No services found.',
          style: TextStyle(color: Color(0xFF64748B)),
        ),
      );
    }

    return Column(
      children: [
        Container(
          color: const Color(0xFFF8FAFC),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          child: Row(
            children: [
              _buildHeadCell('#', width: 30),
              _buildHeadCell('NAME', isExpand: true, hasSort: true),
              _buildHeadCell('DEPT. FEE', width: 70),
              _buildHeadCell('SRV. CHARGE', width: 80),
              _buildHeadCell('COMMISSION', width: 80),
              _buildHeadCell('WALLET', width: 70),
              _buildHeadCell('EDITABLE', width: 70),
              _buildHeadCell('DAYS', width: 50),
              _buildHeadCell('ACTION', width: 110),
            ],
          ),
        ),
        const Divider(height: 1),
        ..._filteredServicesList.asMap().entries.map((entry) {
          final index = entry.key + 1;
          final service = entry.value;
          return _buildDataRow(index, service);
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
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Color(0xFF64748B),
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

  Widget _buildDataRow(int index, ServiceItem service) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              '$index',
              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
          ),
          Expanded(
            child: Text(
              service.serviceName,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Color(0xFF1E293B),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(
            width: 70,
            child: Text(
              service.departmentFee,
              style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)),
            ),
          ),
          SizedBox(
            width: 80,
            child: Text(
              service.serviceCharge,
              style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)),
            ),
          ),
          SizedBox(
            width: 80,
            child: Text(
              service.commission,
              style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)),
            ),
          ),
          SizedBox(width: 70, child: _buildBadge(service.defaultWallet)),
          SizedBox(
            width: 70,
            child: Text(
              service.allowEdit ? 'Yes' : 'No',
              style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)),
            ),
          ),
          SizedBox(
            width: 50,
            child: Text(
              service.followupDays,
              style: const TextStyle(fontSize: 12, color: Color(0xFF1E293B)),
            ),
          ),
          SizedBox(
            width: 110,
            child: Row(
              children: [
                if (service.website.isNotEmpty) ...[
                  _buildActionButton(
                    Icons.language_rounded,
                    const Color(0xFFEFF6FF),
                    const Color(0xFF3B82F6),
                    () async {
                      final url = Uri.parse(service.website);
                      if (await canLaunchUrl(url)) {
                        await launchUrl(url);
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Could not launch ${service.website}',
                            ),
                            backgroundColor: Colors.redAccent,
                          ),
                        );
                      }
                    },
                  ),
                  const SizedBox(width: 8),
                ],
                _buildActionButton(
                  Icons.edit_outlined,
                  const Color(0xFFFFF7ED),
                  const Color(0xFFF97316),
                  () => _onEditService(service),
                ),
                const SizedBox(width: 8),
                _buildActionButton(
                  Icons.delete_outline_rounded,
                  const Color(0xFFFEF2F2),
                  const Color(0xFFEF4444),
                  () async {
                    // For safety, warn and clear row (set empty or status, or delete via sheets row delete)
                    // We can clear row values for this index
                    final listIndex = _servicesList.indexOf(service);
                    if (listIndex != -1) {
                      final serviceRowIndex = listIndex + 2;
                      setState(() {
                        _isLoading = true;
                      });
                      try {
                        await _sheetsService.clearRow(
                          _spreadsheetId,
                          GoogleSheetsConfig.serviceSheetName,
                          serviceRowIndex,
                          9,
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Service row cleared successfully'),
                            backgroundColor: Colors.green,
                          ),
                        );
                        await _fetchServicesData();
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Failed clearing row: $e'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      } finally {
                        setState(() {
                          _isLoading = false;
                        });
                      }
                    }
                  },
                ),
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
        style: TextStyle(
          fontSize: 8,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Widget _buildActionButton(
    IconData icon,
    Color bg,
    Color iconColor,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 14, color: iconColor),
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
              ? const Color(0xFF00695C)
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
