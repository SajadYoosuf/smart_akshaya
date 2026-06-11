import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:file_selector/file_selector.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

import '../../models/biodata_model.dart';
import '../../services/biodata_service.dart';
import '../../services/pdf_overlay_service.dart';
import 'widgets/biodata_form_panel.dart';

class BiodataWorkspaceScreen extends StatefulWidget {
  final BiodataModel biodata;

  const BiodataWorkspaceScreen({super.key, required this.biodata});

  @override
  State<BiodataWorkspaceScreen> createState() => _BiodataWorkspaceScreenState();
}

class _BiodataWorkspaceScreenState extends State<BiodataWorkspaceScreen> {
  late BiodataModel _biodata;
  final BiodataService _service = BiodataService();

  String _selectedTemplatePath =
      'assets/templates/Professional Modern CV Resume.pdf';
  bool _isAssetTemplate = true;
  Uint8List? _pdfBytes;
  bool _isGeneratingPdf = false;

  final Map<String, String> _assetTemplates = {
    'Professional Modern': 'assets/templates/Professional Modern CV Resume.pdf',
    'Black White Minimalist':
        'assets/templates/Black White Minimalist CV Resume.pdf',
    'Blue and Gray':
        'assets/templates/Blue and Gray Simple Professional CV Resume.pdf',
    'IT Manager': 'assets/templates/IT Manager CV Resume.pdf',
  };

  @override
  void initState() {
    super.initState();
    _biodata = BiodataModel.fromJson(widget.biodata.toJson());
    _generatePreview();
  }

  void _onDataChanged() {
    // Generate preview with debounce in a real app,
    // but we can just trigger generation.
    _generatePreview();
  }

  Future<void> _generatePreview() async {
    if (_isGeneratingPdf) return;
    setState(() => _isGeneratingPdf = true);

    try {
      final bytes = await PdfOverlayService.generateOverlayPdf(
        _biodata,
        _selectedTemplatePath,
        isAsset: _isAssetTemplate,
      );
      if (mounted) {
        setState(() {
          _pdfBytes = bytes;
          _isGeneratingPdf = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isGeneratingPdf = false);
      }
      print("Error generating PDF: $e");
    }
  }

  Future<void> _uploadCustomTemplate() async {
    try {
      final XTypeGroup pdfType = XTypeGroup(
        label: 'PDF Files',
        extensions: ['pdf'],
      );

      final XFile? file = await openFile(acceptedTypeGroups: [pdfType]);

      if (file == null) return;

      // Copy to app's local storage
      final appDir = await getApplicationDocumentsDirectory();
      final templateDir = Directory('${appDir.path}/user_templates');
      if (!templateDir.existsSync()) templateDir.createSync(recursive: true);

      const uuid = Uuid();
      final fileName = '${uuid.v4()}_${file.name}';
      final filePath = '${templateDir.path}/$fileName';

      await File(file.path).copy(filePath);

      setState(() {
        _selectedTemplatePath = filePath;
        _isAssetTemplate = false;
      });

      await _generatePreview();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to upload template: $e')),
        );
      }
    }
  }

  Future<void> _save() async {
    await _service.saveBiodata(_biodata);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Biodata saved successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    }
  }

  Future<void> _exportPdf() async {
    if (_pdfBytes == null) return;

    await _service.saveBiodata(_biodata); // Save before export

    try {
      final FileSaveLocation? saveLocation = await getSaveLocation(
        suggestedName:
            '${_biodata.applicantName.replaceAll(' ', '_')}_Resume.pdf',
        acceptedTypeGroups: [
          const XTypeGroup(label: 'PDF Document', extensions: ['pdf']),
        ],
      );

      if (saveLocation == null) {
        // User canceled
        return;
      }
      final String savePath = saveLocation.path;

      await File(savePath).writeAsBytes(_pdfBytes!);

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Save Successful'),
            content: Text('Resume saved to: $savePath'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to export PDF: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        title: InkWell(
          onTap: () => Navigator.pop(context),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.arrow_back, color: Colors.blue),
              SizedBox(width: 8),
              Text(
                'Back | Resume Workspace',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ],
          ),
        ),
        titleSpacing: 16,
        leading: const SizedBox.shrink(),
        leadingWidth: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
            child: DropdownButton<String>(
              value: _isAssetTemplate ? _selectedTemplatePath : null,
              hint: const Text('Custom Template'),
              underline: const SizedBox(),
              items: _assetTemplates.entries
                  .map(
                    (e) => DropdownMenuItem(value: e.value, child: Text(e.key)),
                  )
                  .toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() {
                    _selectedTemplatePath = val;
                    _isAssetTemplate = true;
                  });
                  _generatePreview();
                }
              },
            ),
          ),
          TextButton.icon(
            onPressed: _uploadCustomTemplate,
            icon: const Icon(Icons.upload_file, color: Colors.green),
            label: const Text('Upload Template'),
          ),
          TextButton.icon(
            onPressed: _pdfBytes == null ? null : _exportPdf,
            icon: const Icon(Icons.picture_as_pdf, color: Colors.red),
            label: const Text('Export PDF'),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 16.0,
              vertical: 8.0,
            ),
            child: ElevatedButton(
              onPressed: _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                foregroundColor: Colors.white,
              ),
              child: const Text('Save >'),
            ),
          ),
        ],
      ),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Left Side: Form (60%)
          Expanded(
            flex: 6,
            child: BiodataFormPanel(
              biodata: _biodata,
              onChanged: _onDataChanged,
            ),
          ),

          const VerticalDivider(width: 1, color: Color(0xFFE2E8F0)),

          // Right Side: Live Preview (40%)
          Expanded(
            flex: 4,
            child: Container(
              color: const Color(0xFFE2E8F0),
              padding: const EdgeInsets.all(24),
              child: Center(
                child: AspectRatio(
                  aspectRatio: 1 / 1.414, // A4 ratio
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: _pdfBytes == null
                        ? const Center(child: CircularProgressIndicator())
                        : SfPdfViewer.memory(
                            _pdfBytes!,
                            canShowScrollHead: false,
                            canShowScrollStatus: false,
                          ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
