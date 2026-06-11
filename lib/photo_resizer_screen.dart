import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart' as fp;
import 'package:smart_akshaya/widgets/image_crop_dialog.dart';

class PhotoResizerScreen extends StatelessWidget {
  const PhotoResizerScreen({super.key});

  Future<void> _pickImage(BuildContext context) async {
    final result = await fp.FilePicker.pickFiles(
      type: fp.FileType.image,
      allowMultiple: false,
    );

    if (result != null && result.files.single.path != null) {
      final file = File(result.files.single.path!);
      if (context.mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => ImageCropDialog(imageFile: file),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Green Box
            Container(
              constraints: const BoxConstraints(maxWidth: 800),
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFF10B981)),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: const BoxDecoration(
                      color: Color(0xFF10B981),
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(7),
                        topRight: Radius.circular(7),
                      ),
                    ),
                    child: const Text(
                      'Crop and resize Photo',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),

                  // Instructions
                  Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildInstructionItem(
                          'റീസൈസ് ചെയ്യേണ്ട (ഫോട്ടോ/ഒപ്പ്) സെലക്ട് ചെയ്യുക',
                        ),
                        const SizedBox(height: 8),
                        _buildInstructionItem(
                          'ആവശ്യമായ Width & Height സെറ്റ് ചെയ്യുക',
                        ),
                        const SizedBox(height: 8),
                        _buildInstructionItem(
                          'ഫോട്ടോയുടെ മിനിമം & മാക്സിമം സൈസ് സെറ്റ് ചെയ്യുക',
                        ),
                        const SizedBox(height: 8),
                        _buildInstructionItem(
                          'ഫോട്ടോ റൊട്ടേറ്റ് ചെയ്യേണ്ടത് ഉണ്ടെങ്കിൽ റൊട്ടേറ്റ് ബട്ടൺ ഉപയോഗിക്കുക',
                        ),
                        const SizedBox(height: 8),
                        _buildInstructionItem(
                          'സേവ് ബട്ടൺ അമർത്തി ഫോട്ടോ സേവ് ചെയ്യുക',
                        ),

                        const SizedBox(height: 24),

                        ElevatedButton.icon(
                          onPressed: () => _pickImage(context),
                          icon: const Icon(Icons.upload_file, size: 20),
                          label: const Text('Choose Photo'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 14,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(6),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const Divider(height: 1, color: Color(0xFFE5E7EB)),

                  // Signature link (For now just picks photo the same way, but we could set defaults)
                  InkWell(
                    onTap: () => _pickImage(context), // Same flow
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        'Click here to Crop and Resize Signature >>',
                        style: TextStyle(
                          color: Colors.green.shade700,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionItem(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(top: 2.0),
          child: Icon(Icons.check_box, color: Color(0xFF10B981), size: 18),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 14, color: Color(0xFF374151)),
          ),
        ),
      ],
    );
  }
}
