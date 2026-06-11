import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:crop_image/crop_image.dart';
import 'package:image/image.dart' as img;
import 'package:file_picker/file_picker.dart' as fp;
import 'package:path_provider/path_provider.dart';

class ImageCropDialog extends StatefulWidget {
  final File imageFile;

  const ImageCropDialog({super.key, required this.imageFile});

  @override
  State<ImageCropDialog> createState() => _ImageCropDialogState();
}

class _ImageCropDialogState extends State<ImageCropDialog> {
  late CropController _cropController;
  
  Uint8List? _originalBytes;
  Uint8List? _currentImageBytes;
  
  bool _isProcessing = false;
  bool _isRotating = false;
  
  double _rotationAngle = 0.0;

  final TextEditingController _widthController = TextEditingController(text: '150');
  final TextEditingController _heightController = TextEditingController(text: '200');
  final TextEditingController _minSizeController = TextEditingController(text: '15');
  final TextEditingController _maxSizeController = TextEditingController(text: '30');
  
  String _unit = 'px';

  @override
  void initState() {
    super.initState();
    _cropController = CropController(aspectRatio: 150 / 200);
    _widthController.addListener(_updateAspectRatio);
    _heightController.addListener(_updateAspectRatio);
    _loadOriginalImage();
  }

  void _updateAspectRatio() {
    double? w = double.tryParse(_widthController.text);
    double? h = double.tryParse(_heightController.text);
    if (w != null && h != null && h > 0) {
      _cropController.aspectRatio = w / h;
    }
  }

  Future<void> _loadOriginalImage() async {
    final bytes = await widget.imageFile.readAsBytes();
    if (mounted) {
      setState(() {
        _originalBytes = bytes;
        _currentImageBytes = bytes;
      });
    }
  }

  @override
  void dispose() {
    _cropController.dispose();
    _widthController.dispose();
    _heightController.dispose();
    _minSizeController.dispose();
    _maxSizeController.dispose();
    super.dispose();
  }

  Future<void> _applyRotation(double angle) async {
    if (_originalBytes == null) return;
    setState(() => _isRotating = true);
    
    final rotatedBytes = await compute(_rotateImageIsolate, {
      'bytes': _originalBytes!,
      'angle': angle,
    });
    
    if (mounted) {
      setState(() {
        _currentImageBytes = rotatedBytes;
        _isRotating = false;
        // Optionally reset the crop controller to clear bounds that might be out of range
        // _cropController.crop = const Rect.fromLTRB(0.0, 0.0, 1.0, 1.0);
      });
    }
  }

  Future<void> _processAndSaveImage() async {
    if (_currentImageBytes == null) return;
    setState(() => _isProcessing = true);

    try {
      final config = _CropConfig(
        imageBytes: _currentImageBytes!,
        cropRect: _cropController.crop,
        targetWidthStr: _widthController.text,
        targetHeightStr: _heightController.text,
        minSizeStr: _minSizeController.text,
        maxSizeStr: _maxSizeController.text,
        unit: _unit,
      );
      
      final finalJpeg = await compute(_processImageIsolate, config);
      if (finalJpeg == null) throw Exception("Failed to process image");

      // Save
      final downloadsDir = await getDownloadsDirectory();
      String? outputFile = await fp.FilePicker.saveFile(
        dialogTitle: 'Save Resized Image',
        fileName: 'resized_photo.jpg',
        initialDirectory: downloadsDir?.path,
        allowedExtensions: ['jpg', 'jpeg'],
        type: fp.FileType.custom,
      );

      if (outputFile != null) {
        if (!outputFile.toLowerCase().endsWith('.jpg') && !outputFile.toLowerCase().endsWith('.jpeg')) {
          outputFile += '.jpg';
        }
        final file = File(outputFile);
        await file.writeAsBytes(finalJpeg);
        
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(
             SnackBar(content: Text('Saved to $outputFile (${(finalJpeg.length/1024).toStringAsFixed(1)} KB)'), backgroundColor: Colors.green),
           );
           Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        width: 600,
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.crop, color: Colors.blueAccent),
                  const SizedBox(width: 8),
                  const Text(
                    'Crop Your Image',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  )
                ],
              ),
              const Divider(),
              
              // Cropper
              SizedBox(
                height: 350,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: _currentImageBytes == null
                      ? const Center(child: CircularProgressIndicator())
                      : Stack(
                          children: [
                            Positioned.fill(
                              child: CropImage(
                                controller: _cropController,
                                image: Image.memory(_currentImageBytes!),
                                paddingSize: 25.0,
                                alwaysMove: true,
                              ),
                            ),
                            if (_isRotating)
                              Container(
                                color: Colors.white.withOpacity(0.5),
                                child: const Center(child: CircularProgressIndicator()),
                              ),
                          ],
                        ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Rotation controls
              Row(
                children: [
                  const Text('Rotate:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    onPressed: () {
                      double newAngle = _rotationAngle + 90;
                      if (newAngle >= 360) newAngle -= 360;
                      setState(() => _rotationAngle = newAngle);
                      _applyRotation(_rotationAngle);
                    },
                    icon: const Icon(Icons.rotate_right, size: 18),
                    label: const Text('Rotate 90°'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black87,
                      side: const BorderSide(color: Colors.grey),
                    ),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() => _rotationAngle = 0.0);
                      _applyRotation(0.0);
                    },
                    icon: const Icon(Icons.settings_backup_restore, size: 18),
                    label: const Text('Reset Rotation'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black87,
                      side: const BorderSide(color: Colors.grey),
                    ),
                  ),
                ],
              ),
              
              // Fine rotation slider
              Row(
                children: [
                  const Icon(Icons.rotate_left, size: 16, color: Colors.grey),
                  Expanded(
                    child: Slider(
                      value: _rotationAngle,
                      min: -180,
                      max: 180,
                      divisions: 360,
                      label: '${_rotationAngle.round()}°',
                      onChanged: (val) {
                        setState(() => _rotationAngle = val);
                      },
                      onChangeEnd: (val) {
                        _applyRotation(val);
                      },
                    ),
                  ),
                  const Icon(Icons.rotate_right, size: 16, color: Colors.grey),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Form inputs
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: _buildTextField(_widthController, 'Width'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: _buildTextField(_heightController, 'Height'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 1,
                    child: DropdownButtonFormField<String>(
                      value: _unit,
                      decoration: const InputDecoration(
                        labelText: 'Unit',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      items: ['px', 'cm'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                      onChanged: (val) { 
                        if (val != null) setState(() => _unit = val); 
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(_minSizeController, 'Min Size (KB)'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(_maxSizeController, 'Max Size (KB)'),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Save button
              SizedBox(
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _isProcessing || _isRotating ? null : _processAndSaveImage,
                  icon: _isProcessing 
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
                    : const Icon(Icons.check),
                  label: Text(_isProcessing ? 'Processing...' : 'Save Image', style: const TextStyle(fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      keyboardType: TextInputType.number,
    );
  }
}

// --- ISOLATES ---

Future<Uint8List?> _rotateImageIsolate(Map<String, dynamic> params) async {
  final bytes = params['bytes'] as Uint8List;
  final angle = params['angle'] as double;
  
  if (angle == 0.0) return bytes;
  
  final image = img.decodeImage(bytes);
  if (image == null) return null;
  
  final rotated = img.copyRotate(image, angle: angle);
  return Uint8List.fromList(img.encodeJpg(rotated, quality: 90));
}

class _CropConfig {
  final Uint8List imageBytes;
  final Rect cropRect;
  final String targetWidthStr;
  final String targetHeightStr;
  final String minSizeStr;
  final String maxSizeStr;
  final String unit;

  _CropConfig({
    required this.imageBytes,
    required this.cropRect,
    required this.targetWidthStr,
    required this.targetHeightStr,
    required this.minSizeStr,
    required this.maxSizeStr,
    required this.unit,
  });
}

Future<Uint8List?> _processImageIsolate(_CropConfig config) async {
  img.Image? decodedImage = img.decodeImage(config.imageBytes);
  if (decodedImage == null) return null;

  // 1. Crop
  final cropX = (config.cropRect.left * decodedImage.width).toInt();
  final cropY = (config.cropRect.top * decodedImage.height).toInt();
  final cropW = (config.cropRect.width * decodedImage.width).toInt();
  final cropH = (config.cropRect.height * decodedImage.height).toInt();
  
  img.Image croppedImage = img.copyCrop(decodedImage, x: cropX, y: cropY, width: cropW, height: cropH);

  // 2. Resize
  double wVal = double.tryParse(config.targetWidthStr) ?? 150;
  double hVal = double.tryParse(config.targetHeightStr) ?? 200;
  int targetWidth = config.unit == 'cm' ? (wVal * 118.11).round() : wVal.round();
  int targetHeight = config.unit == 'cm' ? (hVal * 118.11).round() : hVal.round();
  
  img.Image resizedImage = img.copyResize(croppedImage, width: targetWidth, height: targetHeight);

  // 3. Compress
  int minKb = int.tryParse(config.minSizeStr) ?? 15;
  int maxKb = int.tryParse(config.maxSizeStr) ?? 30;
  int minBytes = minKb * 1024;
  int maxBytes = maxKb * 1024;

  Uint8List? finalJpeg;
  int quality = 100;
  
  while (quality > 0) {
    finalJpeg = Uint8List.fromList(img.encodeJpg(resizedImage, quality: quality));
    if (finalJpeg.length <= maxBytes) {
       if (finalJpeg.length >= minBytes || quality == 100) {
         break; 
       }
       break; 
    }
    quality -= 5;
  }
  
  return finalJpeg;
}
