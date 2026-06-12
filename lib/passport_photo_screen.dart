import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart' as fp;
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'package:smart_akshaya/widgets/magic_eraser_dialog.dart';

class PassportPhotoScreen extends StatefulWidget {
  const PassportPhotoScreen({super.key});

  @override
  State<PassportPhotoScreen> createState() => _PassportPhotoScreenState();
}

class _PassportPhotoScreenState extends State<PassportPhotoScreen> {
  Uint8List? _sourceImageBytes;

  String _paperSize = 'A4';
  int _copies = 4;
  int _borderSize = 10;

  Color _backgroundColor = Colors.transparent;

  double _brightness = 0.0;
  double _contrast = 1.0;
  double _saturation = 1.0;
  double _hue = 0.0;

  bool _isProcessing = false;
  bool _showGridPreview = false;

  Future<void> _pickImage() async {
    final result = await fp.FilePicker.pickFiles(
      type: fp.FileType.image,
      allowMultiple: false,
    );

    if (result != null && result.files.single.path != null) {
      final file = File(result.files.single.path!);
      final bytes = await file.readAsBytes();
      setState(() {
        _sourceImageBytes = bytes;
        _showGridPreview = false;
      });
    }
  }

  Future<void> _openMagicEraser() async {
    if (_sourceImageBytes == null) return;

    // We write to a temporary file because MagicEraserDialog expects a File.
    final tempDir = await getTemporaryDirectory();
    final tempFile = File('${tempDir.path}/temp_eraser.png');
    await tempFile.writeAsBytes(_sourceImageBytes!);

    if (mounted) {
      final newBytes = await showDialog<Uint8List?>(
        context: context,
        barrierDismissible: false,
        builder: (context) => MagicEraserDialog(imageFile: tempFile),
      );

      if (newBytes != null) {
        setState(() {
          _sourceImageBytes = newBytes;
        });
      }
    }
  }

  // Uses the 'image' package to create the high-res tiled image
  Future<void> _downloadImage() async {
    if (_sourceImageBytes == null) return;

    setState(() => _isProcessing = true);

    try {
      final config = _DownloadConfig(
        sourceBytes: _sourceImageBytes!,
        paperSize: _paperSize,
        copies: _copies,
        borderSize: _borderSize,
        backgroundColor: _backgroundColor,
        brightness: _brightness,
        contrast: _contrast,
        saturation: _saturation,
        hue: _hue,
      );

      final resultBytes = await compute(_generateHighResImage, config);

      if (resultBytes != null) {
        final downloadsDir = await getDownloadsDirectory();
        String? outputFile = await fp.FilePicker.saveFile(
          dialogTitle: 'Save Passport Photos',
          fileName: 'passport_photos.jpg',
          initialDirectory: downloadsDir?.path,
          allowedExtensions: ['jpg', 'jpeg'],
          type: fp.FileType.custom,
        );

        if (outputFile != null) {
          if (!outputFile.toLowerCase().endsWith('.jpg') &&
              !outputFile.toLowerCase().endsWith('.jpeg')) {
            outputFile += '.jpg';
          }
          final file = File(outputFile);
          await file.writeAsBytes(resultBytes);

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Saved to $outputFile'),
                backgroundColor: Colors.green,
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
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
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      width: double.infinity,
                      decoration: const BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: Color(0xFFE5E7EB)),
                        ),
                      ),
                      child: const Text(
                        'Please fill details',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    Expanded(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Left Canvas Preview
                          Expanded(
                            flex: 1,
                            child: Container(
                              padding: const EdgeInsets.all(24),
                              color: const Color(0xFFF8FAFC),
                              child: _buildPreviewCanvas(),
                            ),
                          ),

                          const VerticalDivider(width: 1),

                          // Right Controls
                          Expanded(
                            flex: 1,
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: InkWell(
                                          onTap: _pickImage,
                                          child: Container(
                                            height: 48,
                                            decoration: BoxDecoration(
                                              border: Border.all(
                                                color: Colors.grey.shade300,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                            ),
                                            alignment: Alignment.centerLeft,
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 12,
                                            ),
                                            child: const Text(
                                              'Upload a photo',
                                              style: TextStyle(
                                                color: Colors.grey,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(child: _buildColorPicker()),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: DropdownButtonFormField<String>(
                                          value: _paperSize,
                                          decoration: const InputDecoration(
                                            labelText: 'Choose Paper',
                                            border: OutlineInputBorder(),
                                          ),
                                          items: ['A4', '4x6', '6x4']
                                              .map(
                                                (e) => DropdownMenuItem(
                                                  value: e,
                                                  child: Text(e),
                                                ),
                                              )
                                              .toList(),
                                          onChanged: (val) {
                                            if (val != null)
                                              setState(() => _paperSize = val);
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: TextFormField(
                                          initialValue: _copies.toString(),
                                          decoration: const InputDecoration(
                                            labelText: 'Number of Copies',
                                            border: OutlineInputBorder(),
                                          ),
                                          keyboardType: TextInputType.number,
                                          onChanged: (val) {
                                            setState(
                                              () => _copies =
                                                  int.tryParse(val) ?? 4,
                                            );
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: TextFormField(
                                          initialValue: _borderSize.toString(),
                                          decoration: const InputDecoration(
                                            labelText: 'Border Size',
                                            border: OutlineInputBorder(),
                                          ),
                                          keyboardType: TextInputType.number,
                                          onChanged: (val) {
                                            setState(
                                              () => _borderSize =
                                                  int.tryParse(val) ?? 20,
                                            );
                                          },
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 24),

                                  _buildSlider(
                                    'Brightness',
                                    _brightness,
                                    -1,
                                    1,
                                    (v) => setState(() => _brightness = v),
                                  ),
                                  _buildSlider(
                                    'Contrast',
                                    _contrast,
                                    0,
                                    2,
                                    (v) => setState(() => _contrast = v),
                                  ),
                                  _buildSlider(
                                    'Hue',
                                    _hue,
                                    -180,
                                    180,
                                    (v) => setState(() => _hue = v),
                                  ),
                                  _buildSlider(
                                    'Saturation',
                                    _saturation,
                                    0,
                                    2,
                                    (v) => setState(() => _saturation = v),
                                  ),

                                  const SizedBox(height: 32),

                                  Row(
                                    children: [
                                      ElevatedButton(
                                        onPressed: () {
                                          setState(() => _showGridPreview = true);
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(
                                            0xFF3B82F6,
                                          ),
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 24,
                                            vertical: 16,
                                          ),
                                        ),
                                        child: const Text('Create Photos >'),
                                      ),
                                      const SizedBox(width: 16),
                                      ElevatedButton.icon(
                                        onPressed: _isProcessing
                                            ? null
                                            : _downloadImage,
                                        icon: _isProcessing
                                            ? const SizedBox(
                                                width: 16,
                                                height: 16,
                                                child:
                                                    CircularProgressIndicator(
                                                      color: Colors.white,
                                                      strokeWidth: 2,
                                                    ),
                                              )
                                            : const Icon(Icons.download),
                                        label: Text(
                                          _isProcessing
                                              ? 'Processing...'
                                              : 'Download',
                                        ),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(
                                            0xFF10B981,
                                          ),
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 24,
                                            vertical: 16,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 24),

                                  ElevatedButton(
                                    onPressed: _openMagicEraser,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0D9488),
                                      foregroundColor: Colors.white,
                                    ),
                                    child: const Text(
                                      'Remove Photo Background (Magic Eraser)',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreviewCanvas() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.black, width: 2),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          if (_sourceImageBytes == null) {
            return const Center(
              child: Text('Preview', style: TextStyle(color: Colors.grey)),
            );
          }

          // We use ColorFiltered to simulate the image adjustments on the fly
          Widget imageWidget = Image.memory(
            _sourceImageBytes!,
            fit: BoxFit.cover,
          );

          // Apply background color if not transparent
          if (_backgroundColor != Colors.transparent) {
            imageWidget = Container(
              color: _backgroundColor,
              child: imageWidget,
            );
          }

          // Apply color filters
          imageWidget = ColorFiltered(
            colorFilter: ColorFilter.matrix(
              _getColorMatrix(_brightness, _contrast, _saturation, _hue),
            ),
            child: imageWidget,
          );

          if (!_showGridPreview) {
            return Center(
              child: Container(
                padding: EdgeInsets.all(_borderSize.toDouble()),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300, width: 1),
                ),
                child: AspectRatio(
                  aspectRatio: 35 / 45,
                  child: imageWidget,
                ),
              ),
            );
          }

          int crossAxisCount = 3;
          if (_paperSize == '4x6') crossAxisCount = 2;
          if (_paperSize == '6x4') crossAxisCount = 4;

          return GridView.builder(
            padding: EdgeInsets.all(_borderSize.toDouble()),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: crossAxisCount,
              childAspectRatio: 35 / 45,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: _copies,
            itemBuilder: (context, index) => Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300, width: 1),
              ),
              child: imageWidget,
            ),
          );
        },
      ),
    );
  }

  Future<void> _openColorPicker() async {
    final colors = [
      Colors.transparent,
      Colors.white,
      Colors.black,
      Colors.blue,
      Colors.lightBlue,
      Colors.red,
      Colors.green,
      Colors.yellow,
      Colors.purple,
      Colors.orange,
      Colors.grey,
      Colors.teal,
      Colors.pink,
      Colors.brown,
    ];

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Background Color'),
        content: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: colors.map((c) {
            return InkWell(
              onTap: () {
                setState(() => _backgroundColor = c);
                Navigator.of(context).pop();
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: c == Colors.transparent ? Colors.white : c,
                  border: Border.all(
                    color: _backgroundColor == c ? Colors.black : Colors.grey.shade300,
                    width: _backgroundColor == c ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: c == Colors.transparent
                    ? const Icon(Icons.format_color_reset, size: 20, color: Colors.grey)
                    : null,
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildColorPicker() {
    return InkWell(
      onTap: _openColorPicker,
      child: InputDecorator(
        decoration: const InputDecoration(
          labelText: 'Background Colour',
          border: OutlineInputBorder(),
          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: _backgroundColor == Colors.transparent ? Colors.white : _backgroundColor,
                    border: Border.all(color: Colors.grey),
                  ),
                  child: _backgroundColor == Colors.transparent
                      ? const Icon(Icons.format_color_reset, size: 12)
                      : null,
                ),
                const SizedBox(width: 8),
                Text(
                  _backgroundColor == Colors.transparent
                      ? 'None'
                      : (_backgroundColor == Colors.white
                          ? 'White'
                          : 'Color'),
                ),
              ],
            ),
            const Icon(Icons.arrow_drop_down, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildSlider(
    String label,
    double value,
    double min,
    double max,
    ValueChanged<double> onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        Slider(value: value, min: min, max: max, onChanged: onChanged),
      ],
    );
  }

  List<double> _getColorMatrix(
    double brightness,
    double contrast,
    double saturation,
    double hue,
  ) {
    // A simplified color matrix calculation for Flutter ColorFiltered
    // For a fully accurate version, we'd multiply 4x4 matrices.
    // This is purely for the live preview to give the user a sense of the changes.
    // The actual high-res download uses the `image` package's robust functions.

    final b = brightness * 255;
    final c = contrast;
    final s = saturation;

    // Simplification for preview
    return [
      c * s,
      0,
      0,
      0,
      b,
      0,
      c * s,
      0,
      0,
      b,
      0,
      0,
      c * s,
      0,
      b,
      0,
      0,
      0,
      1,
      0,
    ];
  }
}

class _DownloadConfig {
  final Uint8List sourceBytes;
  final String paperSize;
  final int copies;
  final int borderSize;
  final Color backgroundColor;
  final double brightness;
  final double contrast;
  final double saturation;
  final double hue;

  _DownloadConfig({
    required this.sourceBytes,
    required this.paperSize,
    required this.copies,
    required this.borderSize,
    required this.backgroundColor,
    required this.brightness,
    required this.contrast,
    required this.saturation,
    required this.hue,
  });
}

// Isolate function for high-res rendering
Future<Uint8List?> _generateHighResImage(_DownloadConfig config) async {
  // Decode
  img.Image? source = img.decodeImage(config.sourceBytes);
  if (source == null) return null;

  // Apply background color if not transparent
  if (config.backgroundColor != Colors.transparent) {
    img.Image bgLayer = img.Image(width: source.width, height: source.height);
    img.fill(
      bgLayer,
      color: img.ColorRgba8(
        config.backgroundColor.red,
        config.backgroundColor.green,
        config.backgroundColor.blue,
        255,
      ),
    );
    img.compositeImage(bgLayer, source);
    source = bgLayer;
  }

  // Adjustments
  source = img.adjustColor(
    source,
    brightness: 1.0 + config.brightness,
    contrast: config.contrast,
    saturation: config.saturation,
    hue: config.hue,
  );

  // Resize to passport standard (35x45mm) at 300DPI
  // 35mm = 1.37 inches -> * 300 = 413 pixels
  // 45mm = 1.77 inches -> * 300 = 531 pixels
  source = img.copyResize(source, width: 413, height: 531);

  // Create Canvas
  // A4 at 300 DPI = 2480 x 3508
  // 4x6 at 300 DPI = 1200 x 1800
  int canvasWidth = config.paperSize == 'A4' ? 2480 : (config.paperSize == '6x4' ? 1800 : 1200);
  int canvasHeight = config.paperSize == 'A4' ? 3508 : (config.paperSize == '6x4' ? 1200 : 1800);

  img.Image canvas = img.Image(width: canvasWidth, height: canvasHeight);
  img.fill(canvas, color: img.ColorRgba8(255, 255, 255, 255));

  // Tiling logic
  int startX = config.borderSize * 5; // scaled border
  int startY = config.borderSize * 5;
  int currentX = startX;
  int currentY = startY;

  int spacing = 10; // 10px spacing between photos

  for (int i = 0; i < config.copies; i++) {
    if (currentX + source.width > canvasWidth - startX) {
      currentX = startX;
      currentY += source.height + spacing;
    }

    if (currentY + source.height > canvasHeight - startY) {
      break; // Run out of space on paper
    }

    img.compositeImage(canvas, source, dstX: currentX, dstY: currentY);
    currentX += source.width + spacing;
  }

  return Uint8List.fromList(img.encodeJpg(canvas, quality: 95));
}
