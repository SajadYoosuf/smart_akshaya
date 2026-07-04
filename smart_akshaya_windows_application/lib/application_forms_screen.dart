import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:file_picker/file_picker.dart' as fp;
import 'package:smart_akshaya/utils/form_dialog_utils.dart';
import 'package:smart_akshaya/services/auth_service.dart';
import 'package:smart_akshaya/services/google_sheets_service.dart';

class ApplicationFormsScreen extends StatefulWidget {
  final AssetBundle? assetBundle;
  final GoogleSheetsServiceBase? sheetsService;
  final AuthServiceBase? authService;
  final String? folderId;
  const ApplicationFormsScreen({
    super.key,
    this.assetBundle,
    this.sheetsService,
    this.authService,
    this.folderId,
  });

  @override
  State<ApplicationFormsScreen> createState() => _ApplicationFormsScreenState();
}

class _ApplicationFormsScreenState extends State<ApplicationFormsScreen> {
  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _forms = [];
  List<Map<String, dynamic>> _filteredForms = [];
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadFormsData();
    _searchController.addListener(_filterForms);
  }

  Future<void> _loadFormsData() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      final authService = widget.authService ?? AuthService();
      final service = widget.sheetsService ??
          (authService is AuthService ? authService.sheetsService : GoogleSheetsService());
      await authService.ensureSheetsServiceInitialized();
      final folderId = widget.folderId ?? await authService.getDriveFolderId();

      if (folderId.isEmpty) {
        setState(() {
          _error = 'Google Drive Folder ID not configured.\nPlease go to Settings in the Login screen to set it up.';
          _isLoading = false;
        });
        return;
      }

      final files = await service.fetchDriveFiles(folderId);

      setState(() {
        _forms = files;
        _filteredForms = List.from(_forms);
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading forms data: $e');
      setState(() {
        _error = 'Failed to load forms from Google Drive: $e';
        _isLoading = false;
      });
    }
  }

  void _filterForms() {
    final query = _searchController.text.toLowerCase().trim();
    setState(() {
      if (query.isEmpty) {
        _filteredForms = List.from(_forms);
      } else {
        _filteredForms = _forms.where((form) {
          final title = (form['title'] ?? '').toLowerCase();
          return title.contains(query);
        }).toList();
      }
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
        // Hero Banner
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 32),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2563EB).withOpacity(0.3),
                blurRadius: 25,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          margin: const EdgeInsets.all(24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Application Forms',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Quickly search and download essential documents',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Search Bar
                  Container(
                    width: 400,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            decoration: const InputDecoration(
                              hintText: 'Search forms by name...',
                              hintStyle: TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 14,
                              ),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                        if (_searchController.text.isNotEmpty)
                          InkWell(
                            onTap: () => _searchController.clear(),
                            child: const Icon(Icons.close_rounded, color: Color(0xFF94A3B8), size: 18),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.folder_open_rounded,
                      color: Colors.white,
                      size: 40,
                    ),
                  ),
                  const SizedBox(height: 16),
                  InkWell(
                    onTap: _loadFormsData,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.refresh_rounded, color: Colors.white, size: 16),
                          SizedBox(width: 6),
                          Text('Refresh', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Grid Content
        Expanded(
          child: Container(
            color: Colors.transparent,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error.isNotEmpty
                    ? Center(
                        child: Text(
                          _error,
                          style: const TextStyle(color: Colors.red, fontSize: 14),
                          textAlign: TextAlign.center,
                        ),
                      )
                    : _filteredForms.isEmpty
                        ? const Center(child: Text('No forms found.'))
                        : GridView.builder(
                            gridDelegate:
                                const SliverGridDelegateWithMaxCrossAxisExtent(
                                  maxCrossAxisExtent: 220,
                                  childAspectRatio: 0.85, // Adjusted for removed subtitle
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
    final String filename = form['filename'] ?? form['title'] ?? '';
    final String extension = filename.split('.').last.toLowerCase();
    final bool isPdf = extension == 'pdf';
    final Color iconColor = isPdf
        ? const Color(0xFFFF0000)
        : const Color(0xFF1D4ED8); // Blue for Word

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            FormDialogUtils.showFormDialog(context, form);
          },
          mouseCursor: SystemMouseCursors.click,
          borderRadius: BorderRadius.circular(16),
          hoverColor: const Color(0xFFF8FAFC),
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Custom Icon Graphic based on file type
                Expanded(
                  child: Center(
                    child: CustomPaint(
                      size: const Size(80, 96),
                      painter: _AdobePdfIconPainter(
                        isPdf: isPdf,
                        label: extension.toUpperCase(),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Title
                Text(
                  form['title'] ?? 'Unknown',
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: Color(0xFF1E293B),
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

// Custom Painter for the high-fidelity Adobe PDF / Word document icon
class _AdobePdfIconPainter extends CustomPainter {
  final bool isPdf;
  final String label;

  _AdobePdfIconPainter({required this.isPdf, required this.label});

  @override
  void paint(Canvas canvas, Size size) {
    final double width = size.width;
    final double height = size.height;
    final double radius = 10.0;
    final double foldSize = 22.0;

    // 1. Draw Shadow
    final shadowPaint = Paint()
      ..color = Colors.black.withOpacity(0.12)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
    
    final Path shadowPath = Path();
    shadowPath.moveTo(radius, 2);
    shadowPath.lineTo(width - foldSize, 2);
    shadowPath.lineTo(width, foldSize + 2);
    shadowPath.lineTo(width, height - radius + 2);
    shadowPath.quadraticBezierTo(width, height + 2, width - radius, height + 2);
    shadowPath.lineTo(radius, height + 2);
    shadowPath.quadraticBezierTo(0, height + 2, 0, height - radius + 2);
    shadowPath.lineTo(0, radius + 2);
    shadowPath.quadraticBezierTo(0, 2, radius, 2);
    shadowPath.close();
    canvas.drawPath(shadowPath, shadowPaint);

    // 2. Draw Body
    final Color mainColor = isPdf ? const Color(0xFFE52521) : const Color(0xFF1D4ED8);
    final Color darkColor = isPdf ? const Color(0xFFB71C1C) : const Color(0xFF172554);

    final bodyPaint = Paint()
      ..color = mainColor
      ..style = PaintingStyle.fill;

    final Path mainBodyPath = Path()
      ..moveTo(radius, 0)
      ..lineTo(width - foldSize, 0)
      ..lineTo(width, foldSize)
      ..lineTo(width, height - radius)
      ..quadraticBezierTo(width, height, width - radius, height)
      ..lineTo(radius, height)
      ..quadraticBezierTo(0, height, 0, height - radius)
      ..lineTo(0, radius)
      ..quadraticBezierTo(0, 0, radius, 0)
      ..close();
    canvas.drawPath(mainBodyPath, bodyPaint);

    // 3. Draw the Folded Corner
    final foldPaint = Paint()
      ..color = darkColor
      ..style = PaintingStyle.fill;
    final Path foldPath = Path()
      ..moveTo(width - foldSize, 0)
      ..lineTo(width, foldSize)
      ..lineTo(width - foldSize, foldSize)
      ..close();
    canvas.drawPath(foldPath, foldPaint);

    // Draw fold reflection line
    final foldHighlightPaint = Paint()
      ..color = Colors.white.withOpacity(0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    canvas.drawLine(
      Offset(width - foldSize, 0),
      Offset(width, foldSize),
      foldHighlightPaint,
    );

    // 4. Draw Fold Shadow underneath
    final foldUnderShadowPaint = Paint()
      ..color = Colors.black.withOpacity(0.15)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2);
    final Path foldUnderShadowPath = Path()
      ..moveTo(width - foldSize, foldSize)
      ..lineTo(width, foldSize)
      ..lineTo(width - foldSize - 3, foldSize + 3)
      ..close();
    canvas.drawPath(foldUnderShadowPath, foldUnderShadowPaint);

    // 5. Draw White Document Frame in center
    final double frameWidth = width * 0.44;
    final double frameHeight = height * 0.42;
    final double frameLeft = (width - frameWidth) / 2;
    final double frameTop = height * 0.20;

    final framePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    final RRect frameRRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(frameLeft, frameTop, frameWidth, frameHeight),
      const Radius.circular(3),
    );
    canvas.drawRRect(frameRRect, framePaint);

    // 6. Draw Content inside White Frame
    final contentPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final double innerLeft = frameLeft + 5;
    final double innerTop = frameTop + 5;
    final double innerRight = frameLeft + frameWidth - 5;
    
    final double imgWidth = frameWidth * 0.35;
    final double imgHeight = frameHeight * 0.28;
    canvas.drawRect(
      Rect.fromLTWH(innerRight - imgWidth, innerTop, imgWidth, imgHeight),
      contentPaint,
    );

    final double lineThickness = 2.5;
    final double leftLinesWidth = frameWidth * 0.35;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(innerLeft, innerTop, leftLinesWidth, lineThickness),
        const Radius.circular(0.5),
      ),
      contentPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(innerLeft, innerTop + 5, leftLinesWidth, lineThickness),
        const Radius.circular(0.5),
      ),
      contentPaint,
    );

    final double longLineWidth = frameWidth - 10;
    final double startY = innerTop + imgHeight + 5;
    for (int i = 0; i < 3; i++) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(innerLeft, startY + (i * 6), longLineWidth, lineThickness),
          const Radius.circular(0.5),
        ),
        contentPaint,
      );
    }

    // 7. Draw Label Text at the bottom
    final textPainter = TextPainter(
      text: TextSpan(
        text: label.isEmpty ? 'PDF' : label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w900,
          fontFamily: 'Roboto',
          letterSpacing: 0.5,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout(minWidth: 0, maxWidth: width);
    textPainter.paint(
      canvas,
      Offset(
        (width - textPainter.width) / 2,
        height * 0.70,
      ),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
