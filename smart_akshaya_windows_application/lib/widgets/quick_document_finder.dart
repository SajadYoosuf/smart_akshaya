import 'package:flutter/material.dart';
import 'package:smart_akshaya/utils/form_dialog_utils.dart';
import 'package:smart_akshaya/services/auth_service.dart';

class QuickDocumentFinder extends StatefulWidget {
  const QuickDocumentFinder({super.key});

  @override
  State<QuickDocumentFinder> createState() => _QuickDocumentFinderState();
}

class _QuickDocumentFinderState extends State<QuickDocumentFinder> {
  List<Map<String, dynamic>> _forms = [];
  Map<String, dynamic>? _selectedForm;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFormsData();
  }

  Future<void> _loadFormsData() async {
    try {
      final authService = AuthService();
      await authService.ensureSheetsServiceInitialized();
      final folderId = await authService.getDriveFolderId();
      if (folderId.isEmpty) {
        setState(() {
          _isLoading = false;
        });
        return;
      }
      final files = await authService.sheetsService.fetchDriveFiles(folderId);
      setState(() {
        _forms = files;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading forms data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Quick document finder',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Select the required service from the list below to generate and print documents instantly.',
            style: TextStyle(fontSize: 14, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : DropdownButtonFormField<Map<String, dynamic>>(
                        value: _selectedForm,
                        isExpanded: true,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                        hint: const Text('Select a form...'),
                        items: _forms.map((form) {
                          return DropdownMenuItem<Map<String, dynamic>>(
                            value: form,
                            child: Text(
                              form['title'] ?? 'Unknown Form',
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }).toList(),
                        onChanged: (Map<String, dynamic>? newValue) {
                          setState(() {
                            _selectedForm = newValue;
                          });
                        },
                      ),
              ),
              const SizedBox(width: 16),
              ElevatedButton.icon(
                onPressed: _selectedForm == null
                    ? null
                    : () {
                        FormDialogUtils.showFormDialog(context, _selectedForm!);
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  disabledForegroundColor: Colors.grey.shade600,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 18,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  elevation: 0,
                ),
                icon: const Icon(Icons.print_rounded, size: 20),
                label: const Text(
                  'Open / Print',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
