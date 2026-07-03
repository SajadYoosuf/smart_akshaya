import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'services/google_sheets_service.dart';
import 'services/auth_service.dart';

/// Quick Document Finder screen — fetches PDF forms from Google Drive
/// and renders them using the new A4 PDF visual theme.
class QuickDocumentFinderScreen extends StatefulWidget {
  const QuickDocumentFinderScreen({super.key});

  @override
  State<QuickDocumentFinderScreen> createState() => _QuickDocumentFinderScreenState();
}

class _QuickDocumentFinderScreenState extends State<QuickDocumentFinderScreen> {
  List<Map<String, dynamic>> _forms = [];
  List<Map<String, dynamic>> _filtered = [];
  final TextEditingController _search = TextEditingController();
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadForms();
    _search.addListener(_filter);
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _loadForms() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final authService = AuthService();
      await authService.ensureSheetsServiceInitialized();
      final folderId = await authService.getDriveFolderId();
      
      if (folderId.isEmpty) {
        setState(() {
          _error = 'Google Drive Folder ID not configured.\nPlease go to Settings in the Login screen to set it up.';
          _loading = false;
        });
        return;
      }

      final files = await authService.sheetsService.fetchDriveFiles(folderId);
      setState(() {
        _forms = files;
        _filtered = List.from(_forms);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load forms from Google Drive: $e';
        _loading = false;
      });
    }
  }

  void _filter() {
    final q = _search.text.toLowerCase().trim();
    setState(() {
      if (q.isEmpty) {
        _filtered = List.from(_forms);
      } else {
        _filtered = _forms.where((f) {
          return (f['title'] as String? ?? '').toLowerCase().contains(q);
        }).toList();
      }
    });
  }

  Future<void> _openForm(Map<String, dynamic> form) async {
    final link = form['drive_link'] as String?;
    if (link != null && link.isNotEmpty) {
      final uri = Uri.parse(link);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Search bar ───────────────────────────────────────────────
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _search,
                  decoration: InputDecoration(
                    hintText: 'Search by form name…',
                    hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                    prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                    suffixIcon: _search.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close, size: 18),
                            onPressed: () { _search.clear(); _filter(); },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFFF1F5F9),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Text('${_filtered.length} forms', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
            ],
          ),
        ),

        // ── Form list ────────────────────────────────────────────────
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error.isNotEmpty
                  ? Center(
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          border: Border.all(color: const Color(0xFFFECACA)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _error,
                          style: const TextStyle(color: Color(0xFFDC2626), fontSize: 14),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    )
                  : _filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.folder_open_rounded, size: 48, color: Colors.grey.shade300),
                              const SizedBox(height: 12),
                              Text('No forms found', style: TextStyle(color: Colors.grey.shade400)),
                            ],
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.all(20),
                          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 180, // Denser grid like Web
                            crossAxisSpacing: 20,
                            mainAxisSpacing: 20,
                            childAspectRatio: 1 / 1.414, // A4 format
                          ),
                          itemCount: _filtered.length,
                          itemBuilder: (ctx, i) {
                            final form = _filtered[i];
                            return InkWell(
                              onTap: () => _openForm(form),
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: const Border(
                                    top: BorderSide(color: Color(0xFFEF4444), width: 4),
                                    left: BorderSide(color: Color(0xFFE2E8F0)),
                                    right: BorderSide(color: Color(0xFFE2E8F0)),
                                    bottom: BorderSide(color: Color(0xFFE2E8F0)),
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.04),
                                      blurRadius: 8,
                                      offset: const Offset(0, 4),
                                    )
                                  ],
                                ),
                                padding: const EdgeInsets.all(16),
                                child: Stack(
                                  children: [
                                    // PDF Badge
                                    Positioned(
                                      top: 0,
                                      right: 0,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0x1AEF4444),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          'PDF',
                                          style: TextStyle(
                                            color: Color(0xFFEF4444),
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Main Content
                                    Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Container(
                                          width: 56,
                                          height: 56,
                                          decoration: BoxDecoration(
                                            color: const Color(0x1AEF4444), // light red
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: const Icon(
                                            Icons.description_rounded, 
                                            color: Color(0xFFEF4444), 
                                            size: 28,
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        Text(
                                          form['title'] ?? '',
                                          style: const TextStyle(
                                            fontSize: 12.5, 
                                            fontWeight: FontWeight.w700, 
                                            color: Color(0xFF1E293B),
                                            height: 1.4,
                                          ),
                                          maxLines: 3,
                                          textAlign: TextAlign.center,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
        ),
      ],
    );
  }
}
