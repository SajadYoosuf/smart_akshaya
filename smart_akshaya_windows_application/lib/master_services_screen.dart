import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:html/parser.dart' as html_parser;
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import 'providers/services_provider.dart';
import 'core/data_state.dart';

import 'models/service_item.dart';

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
  int? _editingRowIndex; // spreadsheet cell matching ID

  bool _isLoading = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ServicesProvider>().loadServices();
    });
    _searchController.addListener(() {
      setState(() {});
    });
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
    } finally {}
  }

  Future<void> _deleteService(ServiceItem service) async {
    setState(() => _isLoading = true);
    try {
      await context.read<ServicesProvider>().deleteService(service.rowIndex);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Service deleted!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to delete service: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
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
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Service name is required'),
          backgroundColor: Colors.orangeAccent,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      final provider = context.read<ServicesProvider>();

      final updatedService = ServiceItem(
        rowIndex: _isEditing ? _editingRowIndex! : 0,
        serviceName: name,
        website: _websiteController.text.trim(),
        departmentFee: _deptFeeController.text.trim().isEmpty
            ? '0.00'
            : _deptFeeController.text.trim(),
        serviceCharge: _serviceChargeController.text.trim().isEmpty
            ? '0.00'
            : _serviceChargeController.text.trim(),
        commission: _commissionController.text.trim().isEmpty
            ? '0.00'
            : _commissionController.text.trim(),
        allowEdit: _allowEdit,
        followupDays: _followupDaysController.text.trim().isEmpty
            ? '0'
            : _followupDaysController.text.trim(),
        defaultWallet: _selectedWallet,
      );
      if (_isEditing) {
        await provider.updateService(updatedService);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Service updated successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        await provider.addService(updatedService);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Service added successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
      // ignore: use_build_context_synchronously
      if (mounted && Navigator.canPop(dialogContext)) {
        Navigator.pop(dialogContext);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error saving service: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    } finally {
      setState(() => _isSaving = false);
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
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
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
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E293B),
                            ),
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
                          Expanded(
                            child: _buildTextField(
                              'Enter name',
                              _nameController,
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(
                              Icons.download_rounded,
                              color: Color(0xFF00695C),
                            ),
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
                            items:
                                <String>[
                                  'CASH',
                                  'EDISTRICT',
                                  'GATEWAY',
                                  'SBI',
                                ].map((String val) {
                                  return DropdownMenuItem<String>(
                                    value: val,
                                    child: Text(val),
                                  );
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
                      _buildLabelAndField(
                        'Followup Days',
                        '0',
                        _followupDaysController,
                      ),
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
                          const Text(
                            'Allow Edit',
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF1E293B),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
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
                                onPressed: () =>
                                    _handleSaveOrUpdateService(dialogContext),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF00695C),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: Text(
                                  isEdit ? 'Update service' : 'Save service',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
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
        label: const Text(
          'Add Service',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: Consumer<ServicesProvider>(
        builder: (context, provider, child) {
          final state = provider.state;
          List<ServiceItem> filteredList = [];
          if (state is DataSuccess<List<ServiceItem>>) {
            final query = _searchController.text.toLowerCase().trim();
            filteredList = query.isEmpty
                ? state.data
                : state.data
                      .where(
                        (s) =>
                            s.serviceName.toLowerCase().contains(query) ||
                            s.defaultWallet.toLowerCase().contains(query),
                      )
                      .toList();
          }

          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // Search and Controls
                Row(
                  children: [
                    const Text(
                      'Service Management',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
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
                          hintStyle: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 14,
                          ),
                          prefixIcon: Icon(
                            Icons.search_rounded,
                            color: Color(0xFF94A3B8),
                            size: 20,
                          ),
                          prefixIconConstraints: BoxConstraints(
                            minWidth: 40,
                            minHeight: 40,
                          ),
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
                  child:
                      state is DataLoading || state is DataInitial || _isLoading
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFF00695C),
                          ),
                        )
                      : state is DataError
                      ? Center(
                          child: Text(
                            (state as DataError).message,
                            style: const TextStyle(color: Colors.red),
                          ),
                        )
                      : state is DataEmpty || filteredList.isEmpty
                      ? const Center(
                          child: Text(
                            'No services found.',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 16,
                            ),
                          ),
                        )
                      : GridView.builder(
                          gridDelegate:
                              const SliverGridDelegateWithMaxCrossAxisExtent(
                                maxCrossAxisExtent: 400,
                                mainAxisExtent: 180,
                                crossAxisSpacing: 16,
                                mainAxisSpacing: 16,
                              ),
                          itemCount: filteredList.length,
                          itemBuilder: (context, index) {
                            final service = filteredList[index];
                            return _buildCard(service);
                          },
                        ),
                ),
              ],
            ),
          );
        },
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
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
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
                  style: TextStyle(
                    fontSize: 12,
                    color: service.allowEdit
                        ? const Color(0xFF10B981)
                        : const Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Row(
                  children: [
                    if (service.website.isNotEmpty) ...[
                      _buildActionButton(
                        Icons.language_rounded,
                        const Color(0xFFEFF6FF),
                        const Color(0xFF3B82F6),
                        () async {
                          final url = Uri.parse(service.website);
                          if (await canLaunchUrl(url)) await launchUrl(url);
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
                      () => _deleteService(service),
                    ),
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
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: Color(0xFF94A3B8),
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
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
        style: TextStyle(
          fontSize: 9,
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
        child: Icon(icon, size: 16, color: iconColor),
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          color: Color(0xFF64748B),
          fontWeight: FontWeight.w500,
        ),
      ),
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
}
