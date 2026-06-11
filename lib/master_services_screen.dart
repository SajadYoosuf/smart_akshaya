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
  final int rowIndex;
  final String serviceName;
  final String website;
  final String departmentFee;
  final String serviceCharge;
  final String commission;
  final bool allowEdit;
  final String followupDays;
  final String defaultWallet;

  ServiceItem({
    required this.rowIndex,
    required this.serviceName,
    required this.website,
    required this.departmentFee,
    required this.serviceCharge,
    required this.commission,
    required this.allowEdit,
    required this.followupDays,
    required this.defaultWallet,
  });

  factory ServiceItem.fromRow(List<dynamic> row, int rowIndex) {
    return ServiceItem(
      rowIndex: rowIndex,
      serviceName: row.length > 0 ? row[0].toString() : '',
      website: row.length > 1 ? row[1].toString() : '',
      departmentFee: row.length > 2 ? row[2].toString() : '0.00',
      serviceCharge: row.length > 3 ? row[3].toString() : '0.00',
      commission: row.length > 4 ? row[4].toString() : '0.00',
      allowEdit: row.length > 5
          ? row[5].toString().toLowerCase() == 'true'
          : false,
      followupDays: row.length > 6 ? row[6].toString() : '0',
      defaultWallet: row.length > 7 ? row[7].toString() : 'CASH',
    );
  }

  List<dynamic> toRow() {
    return [
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
  final TextEditingController _serviceChargeController = TextEditingController();
  final TextEditingController _commissionController = TextEditingController();
  final TextEditingController _followupDaysController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();

  // Form States
  String _selectedWallet = 'CASH';
  bool _allowEdit = false;

  bool _isEditing = false;
  int? _editingRowIndex; // spreadsheet cell matching ID

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
        final credentialsJson = await DefaultAssetBundle.of(context).loadString('assets/credentials/google_sheets_credentials.json');
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
        final List<ServiceItem> parsedList = [];
        for (int i = 1; i < rows.length; i++) {
          final row = rows[i];
          if (row.isEmpty || row.length == 0 || row[0].toString().trim().isEmpty) continue; // skip blank/deleted rows
          parsedList.add(ServiceItem.fromRow(row, i + 1)); // 1-based index in Google Sheets
        }
        setState(() {
          _servicesList = parsedList;
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

  // --- NEW DIALOG & CARD LOGIC ---

  void _onEditService(ServiceItem service) {
    setState(() {
      _isEditing = true;
      _editingRowIndex = service.rowIndex;
      _nameController.text = service.serviceName;
      _websiteController.text = service.website;
      _deptFeeController.text = service.departmentFee;
      _serviceChargeController.text = service.serviceCharge;
      _commissionController.text = service.commission;
      _followupDaysController.text = service.followupDays;
      _selectedWallet = service.defaultWallet;
      _allowEdit = service.allowEdit;
    });
    _showServiceFormDialog(isEdit: true);
  }

  void _resetForm() {
    setState(() {
      _isEditing = false;
      _editingRowIndex = null;
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

  Future<void> _handleSaveOrUpdateService(BuildContext dialogContext) async {
    if (_spreadsheetId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please configure Spreadsheet ID on the Login screen first.'), backgroundColor: Colors.redAccent),
      );
      return;
    }

    final name = _nameController.text.trim();
    final website = _websiteController.text.trim();
    final deptFee = _deptFeeController.text.trim().isEmpty ? '0.00' : _deptFeeController.text.trim();
    final serviceCharge = _serviceChargeController.text.trim().isEmpty ? '0.00' : _serviceChargeController.text.trim();
    final commission = _commissionController.text.trim().isEmpty ? '0.00' : _commissionController.text.trim();
    final followupDays = _followupDaysController.text.trim().isEmpty ? '0' : _followupDaysController.text.trim();

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Service Name is required'), backgroundColor: Colors.orangeAccent),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      if (_isEditing && _editingRowIndex != null) {
        final updatedService = ServiceItem(
          rowIndex: _editingRowIndex!,
          serviceName: name,
          website: website,
          departmentFee: deptFee,
          serviceCharge: serviceCharge,
          commission: commission,
          allowEdit: _allowEdit,
          followupDays: followupDays,
          defaultWallet: _selectedWallet,
        );

        await _sheetsService.updateRow(_spreadsheetId, GoogleSheetsConfig.serviceSheetName, _editingRowIndex!, updatedService.toRow());
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Service updated successfully!'), backgroundColor: Colors.green));
      } else {
        final newService = ServiceItem(
          rowIndex: 0,
          serviceName: name,
          website: website,
          departmentFee: deptFee,
          serviceCharge: serviceCharge,
          commission: commission,
          allowEdit: _allowEdit,
          followupDays: followupDays,
          defaultWallet: _selectedWallet,
        );

        await _sheetsService.appendRow(_spreadsheetId, GoogleSheetsConfig.serviceSheetName, newService.toRow());
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Service added successfully!'), backgroundColor: Colors.green));
      }

      await _fetchServicesData();
      _resetForm();
      if (dialogContext.mounted) {
        Navigator.of(dialogContext).pop();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Operation failed: $e'), backgroundColor: Colors.redAccent));
    } finally {
      setState(() {
        _isSaving = false;
      });
    }
  }

  Future<void> _deleteService(ServiceItem service) async {
    setState(() => _isLoading = true);
    try {
      await _sheetsService.clearRow(_spreadsheetId, GoogleSheetsConfig.serviceSheetName, service.rowIndex, 8);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Service deleted!'), backgroundColor: Colors.green));
      await _fetchServicesData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed deleting: $e'), backgroundColor: Colors.redAccent));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showServiceFormDialog({bool isEdit = false}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Container(
                width: 600,
                padding: const EdgeInsets.all(24),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            isEdit ? 'Edit service' : 'Add service',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close_rounded),
                            onPressed: () {
                              _resetForm();
                              Navigator.of(dialogContext).pop();
                            },
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      _buildLabel('Service name'),
                      Row(
                        children: [
                          Expanded(child: _buildTextField('Enter name', _nameController)),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(Icons.download_rounded, color: Color(0xFF00695C)),
                            onPressed: () async {
                               await _fetchNameFromLink();
                            },
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
                          Expanded(child: _buildMiniField('DEPT FEE', '0.00', _deptFeeController)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildMiniField('SRV CHARGE', '0.00', _serviceChargeController)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildMiniField('COMMISSION', '0.00', _commissionController)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildLabel('Default Wallet'),
                      Container(
                        height: 40,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedWallet,
                            isExpanded: true,
                            items: <String>['CASH', 'EDISTRICT', 'GATEWAY', 'SBI'].map((String val) {
                              return DropdownMenuItem<String>(value: val, child: Text(val));
                            }).toList(),
                            onChanged: (String? newVal) {
                              if (newVal != null) {
                                setDialogState(() => _selectedWallet = newVal);
                                setState(() => _selectedWallet = newVal);
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildLabelAndField('Followup Days', '0', _followupDaysController),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          SizedBox(
                            height: 24,
                            width: 24,
                            child: Checkbox(
                              value: _allowEdit,
                              onChanged: (v) {
                                setDialogState(() => _allowEdit = v!);
                                setState(() => _allowEdit = v!);
                              },
                              activeColor: const Color(0xFF00695C),
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text('Allow Edit', style: TextStyle(fontSize: 13, color: Color(0xFF1E293B))),
                        ],
                      ),
                      const SizedBox(height: 32),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: _isSaving
                            ? const Center(child: CircularProgressIndicator(color: Color(0xFF00695C)))
                            : ElevatedButton(
                                onPressed: () => _handleSaveOrUpdateService(dialogContext),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF00695C),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: Text(isEdit ? 'Update service' : 'Save service', style: const TextStyle(fontWeight: FontWeight.bold)),
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          _resetForm();
          _showServiceFormDialog(isEdit: false);
        },
        backgroundColor: const Color(0xFF00695C),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Add Service', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Search and Controls
            Row(
              children: [
                const Text('Service Management', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const Spacer(),
                Container(
                  width: 280,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    controller: _searchController,
                    textAlignVertical: TextAlignVertical.center,
                    decoration: const InputDecoration(
                      hintText: 'Search services...',
                      hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                      prefixIcon: Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                      prefixIconConstraints: BoxConstraints(minWidth: 40, minHeight: 40),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            // Cards Grid
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF00695C)))
                  : _filteredServicesList.isEmpty
                      ? const Center(child: Text('No services found.', style: TextStyle(color: Color(0xFF64748B), fontSize: 16)))
                      : GridView.builder(
                          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 400,
                            mainAxisExtent: 180,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                          ),
                          itemCount: _filteredServicesList.length,
                          itemBuilder: (context, index) {
                            final service = _filteredServicesList[index];
                            return _buildCard(service);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(ServiceItem service) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      color: Colors.white,
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    service.serviceName,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                _buildBadge(service.defaultWallet),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildInfoColumn('Dept. Fee', '₹${service.departmentFee}'),
                _buildInfoColumn('Srv. Charge', '₹${service.serviceCharge}'),
                _buildInfoColumn('Commission', '₹${service.commission}'),
              ],
            ),
            const Spacer(),
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  service.allowEdit ? 'Editable' : 'Non-editable',
                  style: TextStyle(fontSize: 12, color: service.allowEdit ? const Color(0xFF10B981) : const Color(0xFF64748B), fontWeight: FontWeight.w500),
                ),
                Row(
                  children: [
                    if (service.website.isNotEmpty) ...[
                      _buildActionButton(Icons.language_rounded, const Color(0xFFEFF6FF), const Color(0xFF3B82F6), () async {
                        final url = Uri.parse(service.website);
                        if (await canLaunchUrl(url)) await launchUrl(url);
                      }),
                      const SizedBox(width: 8),
                    ],
                    _buildActionButton(Icons.edit_outlined, const Color(0xFFFFF7ED), const Color(0xFFF97316), () => _onEditService(service)),
                    const SizedBox(width: 8),
                    _buildActionButton(Icons.delete_outline_rounded, const Color(0xFFFEF2F2), const Color(0xFFEF4444), () => _deleteService(service)),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoColumn(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
      ],
    );
  }

  Widget _buildBadge(String label) {
    Color color = const Color(0xFF3B82F6);
    if (label == 'EDISTRICT') color = const Color(0xFF10B981);
    if (label == 'GATEWAY') color = const Color(0xFF6366F1);
    if (label == 'CASH') color = const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  Widget _buildActionButton(IconData icon, Color bg, Color iconColor, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
        child: Icon(icon, size: 16, color: iconColor),
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
    );
  }

  Widget _buildTextField(String hint, TextEditingController controller) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        color: const Color(0xFFF8FAFC),
      ),
      child: TextField(
        controller: controller,
        textAlignVertical: TextAlignVertical.center,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          border: InputBorder.none,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  Widget _buildMiniField(String label, String value, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
        const SizedBox(height: 4),
        _buildTextField(value, controller),
      ],
    );
  }

  Widget _buildLabelAndField(String label, String hint, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [_buildLabel(label), _buildTextField(hint, controller)],
    );
  }
}
