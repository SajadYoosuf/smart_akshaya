import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:file_picker/file_picker.dart' as fp;
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:smart_akshaya/utils/form_dialog_utils.dart';

class ApplicationFormsScreen extends StatefulWidget {
  final AssetBundle? assetBundle;
  const ApplicationFormsScreen({super.key, this.assetBundle});

  @override
  State<ApplicationFormsScreen> createState() => _ApplicationFormsScreenState();
}

class _ApplicationFormsScreenState extends State<ApplicationFormsScreen> {
  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _forms = [];
  List<Map<String, dynamic>> _filteredForms = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFormsData();
    _searchController.addListener(_filterForms);
  }

  Future<void> _loadFormsData() async {
    try {
      final bundle = widget.assetBundle ?? rootBundle;
      final jsonString = await bundle.loadString('assets/forms_data.json');
      final List<dynamic> jsonData = json.decode(jsonString);

      setState(() {
        _forms = jsonData.map((e) => Map<String, dynamic>.from(e)).toList();
        _filteredForms = List.from(_forms);
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading forms data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _filterForms() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredForms = _forms.where((form) {
        final title = (form['title'] ?? '').toLowerCase();
        final subtitle = (form['subtitle'] ?? '').toLowerCase();
        return title.contains(query) || subtitle.contains(query);
      }).toList();
    });
  }

  // The _showFormDialog, _openLocalFile, and _downloadLocalFile methods have been extracted.

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Top Bar
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isDesktop = MediaQuery.of(context).size.width >= 800;
              final isSmall = constraints.maxWidth < 500;
              
              final searchBar = Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(4),
                          bottomLeft: Radius.circular(4),
                        ),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: TextField(
                        controller: _searchController,
                        decoration: const InputDecoration(
                          hintText: 'Search forms',
                          hintStyle: TextStyle(color: Colors.grey, fontSize: 13),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.only(bottom: 12),
                        ),
                      ),
                    ),
                  ),
                  Container(
                    height: 40,
                    decoration: const BoxDecoration(
                      color: Color(0xFF3B82F6), // Blue Search Button
                      borderRadius: BorderRadius.only(
                        topRight: Radius.circular(4),
                        bottomRight: Radius.circular(4),
                      ),
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () {
                          _filterForms();
                        },
                        borderRadius: const BorderRadius.only(
                          topRight: Radius.circular(4),
                          bottomRight: Radius.circular(4),
                        ),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 20),
                          child: Center(
                            child: Text(
                              'Search',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              );

              final headerContent = Row(
                children: [
                  if (!isDesktop) ...[
                    Builder(
                      builder: (context) => IconButton(
                        icon: const Icon(Icons.menu),
                        onPressed: () => Scaffold.of(context).openDrawer(),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  const Text(
                    'Application Forms',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ],
              );

              if (isSmall) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    headerContent,
                    const SizedBox(height: 16),
                    SizedBox(width: double.infinity, child: searchBar),
                  ],
                );
              }

              return Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  headerContent,
                  SizedBox(width: 380, child: searchBar),
                ],
              );
            },
          ),
        ),

        // Grid Content
        Expanded(
          child: Container(
            color: const Color(0xFFE5E7EB),
            padding: const EdgeInsets.all(24),
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredForms.isEmpty
                ? const Center(child: Text('No forms found.'))
                : GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithMaxCrossAxisExtent(
                          maxCrossAxisExtent: 220,
                          childAspectRatio: 0.75, // Taller than wide
                          crossAxisSpacing: 20,
                          mainAxisSpacing: 20,
                        ),
                    itemCount: _filteredForms.length,
                    itemBuilder: (context, index) {
                      return _buildFormCard(_filteredForms[index]);
                    },
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildFormCard(Map<String, dynamic> form) {
    final String filename = form['filename'] ?? '';
    final String extension = filename.split('.').last.toLowerCase();
    final bool isPdf = extension == 'pdf';
    final Color iconColor = isPdf
        ? const Color(0xFFFF0000)
        : const Color(0xFF1D4ED8); // Blue for Word

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            FormDialogUtils.showFormDialog(context, form);
          },
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Custom Icon Graphic based on file type
                Expanded(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Document Outline
                      Icon(
                        Icons.description_outlined,
                        size: 100,
                        color: iconColor,
                      ),
                      // Extension Text
                      Positioned(
                        bottom: 15,
                        child: Text(
                          extension.toUpperCase(),
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Colors.grey.shade800,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                      // Logo curve loop (only for PDF, just simple icon for docs)
                      if (isPdf)
                        Positioned(
                          top: 25,
                          child: CustomPaint(
                            size: const Size(40, 40),
                            painter: _PdfLogoPainter(),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Title
                Text(
                  form['title'] ?? 'Unknown',
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 8),
                // Subtitle
                Text(
                  form['subtitle'] ?? '',
                  textAlign: TextAlign.center,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey.shade800,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Custom Painter for the red curvy part of the PDF logo inside the document outline
class _PdfLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFFF0000)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round;

    final path = Path();
    // A simplified loop resembling the Adobe PDF ribbon logo
    path.moveTo(size.width * 0.2, size.height * 0.8);
    path.quadraticBezierTo(
      size.width * 0.1,
      size.height * 0.2,
      size.width * 0.5,
      size.height * 0.1,
    );
    path.quadraticBezierTo(
      size.width * 0.9,
      size.height * 0.1,
      size.width * 0.8,
      size.height * 0.5,
    );
    path.quadraticBezierTo(
      size.width * 0.5,
      size.height * 0.9,
      size.width * 0.2,
      size.height * 0.8,
    );

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
