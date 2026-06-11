import 'package:flutter/material.dart';
import '../../models/biodata_model.dart';
import '../../services/biodata_service.dart';
import 'widgets/biodata_form_panel.dart';
import 'widgets/biodata_preview_panel.dart';
import 'pdf_generator.dart';

class BiodataWorkspaceScreen extends StatefulWidget {
  final BiodataModel biodata;

  const BiodataWorkspaceScreen({super.key, required this.biodata});

  @override
  State<BiodataWorkspaceScreen> createState() => _BiodataWorkspaceScreenState();
}

class _BiodataWorkspaceScreenState extends State<BiodataWorkspaceScreen> {
  late BiodataModel _biodata;
  final BiodataService _service = BiodataService();

  @override
  void initState() {
    super.initState();
    // Clone the model so edits don't immediately affect original until saved
    _biodata = BiodataModel.fromJson(widget.biodata.toJson());
  }

  void _onDataChanged() {
    setState(() {}); // Re-render preview
  }

  Future<void> _save() async {
    await _service.saveBiodata(_biodata);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Biodata saved successfully!'), backgroundColor: Colors.green),
      );
      Navigator.pop(context);
    }
  }

  Future<void> _exportPdf() async {
    await _service.saveBiodata(_biodata); // Save before export
    if (mounted) {
      await PdfGenerator.generateAndSavePdf(_biodata, context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDesktop = MediaQuery.of(context).size.width >= 800;

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
              Text('Back | Design New Biodata', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
        ),
        titleSpacing: 16,
        leading: const SizedBox.shrink(),
        leadingWidth: 0,
        actions: [
          TextButton.icon(
            onPressed: _exportPdf,
            icon: const Icon(Icons.picture_as_pdf, color: Colors.red),
            label: const Text('Export PDF'),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
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
          // Left Side: Form
          Expanded(
            flex: 1,
            child: BiodataFormPanel(
              biodata: _biodata,
              onChanged: _onDataChanged,
            ),
          ),
          
          if (isDesktop) const VerticalDivider(width: 1, color: Color(0xFFE2E8F0)),

          // Right Side: Live Preview (Only visible on desktop)
          if (isDesktop)
            Expanded(
              flex: 1,
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
                          )
                        ]
                      ),
                      child: BiodataPreviewPanel(biodata: _biodata),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      // On mobile, could add a floating action button to preview
      floatingActionButton: !isDesktop ? FloatingActionButton.extended(
        onPressed: () {
          showModalBottomSheet(
            context: context, 
            isScrollControlled: true,
            builder: (context) => Container(
              height: MediaQuery.of(context).size.height * 0.9,
              color: const Color(0xFFE2E8F0),
              padding: const EdgeInsets.all(16),
              child: SingleChildScrollView(
                child: AspectRatio(
                  aspectRatio: 1 / 1.414,
                  child: Container(
                    color: Colors.white,
                    child: BiodataPreviewPanel(biodata: _biodata),
                  ),
                ),
              ),
            )
          );
        },
        icon: const Icon(Icons.preview),
        label: const Text('Preview'),
      ) : null,
    );
  }
}
