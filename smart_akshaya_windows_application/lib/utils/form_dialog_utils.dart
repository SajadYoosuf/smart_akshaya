import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:file_picker/file_picker.dart' as fp;
import 'package:flutter/gestures.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

class FormDialogUtils {
  static void showFormDialog(BuildContext context, Map<String, dynamic> form) async {
    final driveLink = form['drive_link'];
    if (driveLink != null && driveLink.toString().isNotEmpty) {
      final uri = Uri.parse(driveLink.toString());
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    }
    
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Form file is not available locally and has no valid Drive Link.')),
      );
    }
  }

  static Future<void> openLocalFile(BuildContext context, String filename) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final byteData = await rootBundle.load('assets/forms/$filename');
      final buffer = byteData.buffer;

      final tempDir = await getTemporaryDirectory();
      final tempFile = File('${tempDir.path}/$filename');

      await tempFile.writeAsBytes(
        buffer.asUint8List(byteData.offsetInBytes, byteData.lengthInBytes),
      );

      if (context.mounted) {
        Navigator.pop(context); // Close loading dialog
      }

      final uri = Uri.file(tempFile.path);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open file viewer')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context); // close loading dialog
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error opening file: $e')));
      }
    }
  }

  static Future<void> downloadLocalFile(BuildContext context, String filename) async {
    try {
      final downloadsDir = await getDownloadsDirectory();
      String? outputFile = await fp.FilePicker.saveFile(
        dialogTitle: 'Save Form As',
        fileName: filename,
        initialDirectory: downloadsDir?.path,
      );

      if (outputFile != null) {
        final byteData = await rootBundle.load('assets/forms/$filename');
        final buffer = byteData.buffer;
        final file = File(outputFile);

        await file.writeAsBytes(
          buffer.asUint8List(byteData.offsetInBytes, byteData.lengthInBytes),
        );

        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Saved to $outputFile'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error saving file: $e')));
      }
    }
  }
}

class _PdfViewerDialogContent extends StatefulWidget {
  final Map<String, dynamic> form;

  const _PdfViewerDialogContent({required this.form});

  @override
  State<_PdfViewerDialogContent> createState() => _PdfViewerDialogContentState();
}

class _PdfViewerDialogContentState extends State<_PdfViewerDialogContent> {
  final PdfViewerController _pdfViewerController = PdfViewerController();
  int _currentPage = 1;
  int _pageCount = 0;

  @override
  void dispose() {
    _pdfViewerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final String filename = widget.form['filename'] ?? '';
    final String extension = filename.split('.').last.toLowerCase();
    final bool isPdf = extension == 'pdf';
    final String title = (widget.form['title'] ?? 'Unknown Form').toUpperCase();
    final String subtitle = widget.form['subtitle'] ?? '';

    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      clipBehavior: Clip.antiAlias,
      child: SizedBox(
        width: 800,
        height: 600,
        child: Column(
          children: [
            // Custom Header
            Container(
              height: 50,
              decoration: const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: Color(0xFFE5E7EB)),
                ),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  // Open externally button (grey)
                  Material(
                    color: const Color(0xFF4B5563), // Dark grey
                    child: InkWell(
                      onTap: () {
                        Navigator.pop(context);
                        if (widget.form['drive_link'] != null &&
                            widget.form['drive_link'].toString().isNotEmpty) {
                          launchUrl(
                            Uri.parse(widget.form['drive_link']),
                            mode: LaunchMode.externalApplication,
                          );
                        } else {
                          FormDialogUtils.openLocalFile(context, filename);
                        }
                      },
                      child: const SizedBox(
                        width: 50,
                        height: 50,
                        child: Center(
                          child: Icon(
                            Icons.open_in_new,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Close button (red)
                  Material(
                    color: const Color(0xFFFF0000), // Red
                    child: InkWell(
                      onTap: () => Navigator.pop(context),
                      child: const SizedBox(
                        width: 50,
                        height: 50,
                        child: Center(
                          child: Icon(
                            Icons.close,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // PDF Viewer / Content Area
            Expanded(
              child: isPdf
                  ? Stack(
                      children: [
                        Listener(
                          onPointerSignal: (PointerSignalEvent event) {
                            if (event is PointerScrollEvent) {
                              if (HardwareKeyboard.instance.isControlPressed) {
                                setState(() {
                                  if (event.scrollDelta.dy > 0) {
                                    // Zoom out
                                    _pdfViewerController.zoomLevel =
                                        (_pdfViewerController.zoomLevel - 0.25).clamp(1.0, 5.0);
                                  } else if (event.scrollDelta.dy < 0) {
                                    // Zoom in
                                    _pdfViewerController.zoomLevel =
                                        (_pdfViewerController.zoomLevel + 0.25).clamp(1.0, 5.0);
                                  }
                                });
                              }
                            }
                          },
                          child: SfPdfViewer.asset(
                            'assets/forms/$filename',
                            controller: _pdfViewerController,
                            canShowScrollHead: false,
                            canShowScrollStatus: false,
                            onDocumentLoaded: (PdfDocumentLoadedDetails details) {
                              setState(() {
                                _pageCount = details.document.pages.count;
                              });
                            },
                            onPageChanged: (PdfPageChangedDetails details) {
                              setState(() {
                                _currentPage = details.newPageNumber;
                              });
                            },
                          ),
                        ),
                        // Overlay controls matching the screenshot
                        Positioned(
                          bottom: 16,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: Container(
                              height: 44,
                              decoration: BoxDecoration(
                                color: const Color(0xFF3B3B3B), // Dark background for the pill
                                borderRadius: BorderRadius.circular(22),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.2),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const SizedBox(width: 16),
                                  const Text(
                                    'Page',
                                    style: TextStyle(color: Colors.white, fontSize: 14),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF1F1F1F),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      '$_currentPage',
                                      style: const TextStyle(color: Colors.white, fontSize: 14),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '/   $_pageCount',
                                    style: const TextStyle(color: Colors.white, fontSize: 14),
                                  ),
                                  const SizedBox(width: 16),
                                  Container(
                                    width: 1,
                                    height: 24,
                                    color: Colors.grey.shade600,
                                  ),
                                  const SizedBox(width: 4),
                                  IconButton(
                                    icon: const Icon(Icons.remove, color: Colors.white, size: 20),
                                    splashRadius: 20,
                                    onPressed: () {
                                      _pdfViewerController.zoomLevel =
                                          (_pdfViewerController.zoomLevel - 0.25).clamp(1.0, 5.0);
                                    },
                                  ),
                                  const Icon(Icons.zoom_in, color: Colors.white, size: 20),
                                  IconButton(
                                    icon: const Icon(Icons.add, color: Colors.white, size: 20),
                                    splashRadius: 20,
                                    onPressed: () {
                                      _pdfViewerController.zoomLevel =
                                          (_pdfViewerController.zoomLevel + 0.25).clamp(1.0, 5.0);
                                    },
                                  ),
                                  const SizedBox(width: 4),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.description_outlined,
                            size: 80,
                            color: Color(0xFF1D4ED8),
                          ),
                          const SizedBox(height: 16),
                          Text('Cannot preview .$extension files inline.'),
                        ],
                      ),
                    ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.symmetric(
                vertical: 16,
                horizontal: 24,
              ),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
              ),
              child: Column(
                children: [
                  ElevatedButton.icon(
                    onPressed: () {
                      FormDialogUtils.downloadLocalFile(context, filename);
                    },
                    icon: const Icon(Icons.download_rounded, size: 18),
                    label: const Text('Download Form'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669), // Green
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  ),
                  if (subtitle.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      subtitle,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF0369A1), // Blue-ish subtitle color
                        height: 1.4,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
