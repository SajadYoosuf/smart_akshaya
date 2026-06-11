import 'dart:io';
import 'dart:typed_data';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;

class MagicEraserConfig {
  final Uint8List imageBytes;
  final int targetR;
  final int targetG;
  final int targetB;
  final double tolerance;

  MagicEraserConfig(
    this.imageBytes,
    this.targetR,
    this.targetG,
    this.targetB,
    this.tolerance,
  );
}

// Top-level function for the Isolate
Future<Uint8List?> _processMagicEraser(MagicEraserConfig config) async {
  final image = img.decodeImage(config.imageBytes);
  if (image == null) return null;

  final double tolSquared = config.tolerance * config.tolerance * 3 * 255 * 255;

  for (var p in image) {
    num rDiff = p.r - config.targetR;
    num gDiff = p.g - config.targetG;
    num bDiff = p.b - config.targetB;

    num distSquared = (rDiff * rDiff) + (gDiff * gDiff) + (bDiff * bDiff);

    if (distSquared <= tolSquared) {
      p.a = 0; // Make transparent
    }
  }

  return Uint8List.fromList(img.encodePng(image));
}

class MagicEraserDialog extends StatefulWidget {
  final File imageFile;

  const MagicEraserDialog({super.key, required this.imageFile});

  @override
  State<MagicEraserDialog> createState() => _MagicEraserDialogState();
}

class _MagicEraserDialogState extends State<MagicEraserDialog> {
  late Uint8List _originalBytes;
  Uint8List? _processedBytes;
  bool _isLoading = true;
  bool _isProcessing = false;

  Color? _selectedColor;
  double _tolerance = 0.15; // 15% tolerance

  @override
  void initState() {
    super.initState();
    _loadInitialImage();
  }

  Future<void> _loadInitialImage() async {
    _originalBytes = await widget.imageFile.readAsBytes();
    setState(() {
      _processedBytes = _originalBytes;
      _isLoading = false;
    });
  }

  Future<void> _applyEraser() async {
    if (_selectedColor == null) return;

    setState(() => _isProcessing = true);

    final config = MagicEraserConfig(
      _originalBytes,
      (_selectedColor!.r * 255.0).round(),
      (_selectedColor!.g * 255.0).round(),
      (_selectedColor!.b * 255.0).round(),
      _tolerance,
    );

    final resultBytes = await compute(_processMagicEraser, config);

    if (mounted) {
      setState(() {
        if (resultBytes != null) _processedBytes = resultBytes;
        _isProcessing = false;
      });
    }
  }

  void _onImageTapped(
    TapDownDetails details,
    BoxConstraints constraints,
  ) async {
    // To accurately get the color, we decode the original image.
    // This is lightweight enough for a single pixel tap.
    final image = img.decodeImage(_originalBytes);
    if (image == null) return;

    // Calculate relative position
    double dx = details.localPosition.dx;
    double dy = details.localPosition.dy;

    // Calculate scaling to map tap to image coordinates
    // We assume the image is centered and contained (BoxFit.contain)
    double widgetWidth = constraints.maxWidth;
    double widgetHeight = constraints.maxHeight;
    double imageAspectRatio = image.width / image.height;
    double widgetAspectRatio = widgetWidth / widgetHeight;

    double renderedWidth;
    double renderedHeight;
    double offsetX = 0;
    double offsetY = 0;

    if (widgetAspectRatio > imageAspectRatio) {
      renderedHeight = widgetHeight;
      renderedWidth = widgetHeight * imageAspectRatio;
      offsetX = (widgetWidth - renderedWidth) / 2;
    } else {
      renderedWidth = widgetWidth;
      renderedHeight = widgetWidth / imageAspectRatio;
      offsetY = (widgetHeight - renderedHeight) / 2;
    }

    if (dx < offsetX ||
        dx > offsetX + renderedWidth ||
        dy < offsetY ||
        dy > offsetY + renderedHeight) {
      return; // Tapped outside the image
    }

    int pixelX = ((dx - offsetX) / renderedWidth * image.width).toInt();
    int pixelY = ((dy - offsetY) / renderedHeight * image.height).toInt();

    pixelX = pixelX.clamp(0, image.width - 1);
    pixelY = pixelY.clamp(0, image.height - 1);

    final pixel = image.getPixel(pixelX, pixelY);

    setState(() {
      _selectedColor = Color.fromARGB(
        255,
        pixel.r.toInt(),
        pixel.g.toInt(),
        pixel.b.toInt(),
      );
    });

    _applyEraser();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        width: 800,
        height: 600,
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.auto_fix_high, color: Colors.purple),
                const SizedBox(width: 8),
                const Text(
                  'Magic Background Eraser',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(),

            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Image Area
                  Expanded(
                    flex: 2,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: _isLoading
                          ? const Center(child: CircularProgressIndicator())
                          : LayoutBuilder(
                              builder: (context, constraints) {
                                return GestureDetector(
                                  onTapDown: (details) =>
                                      _onImageTapped(details, constraints),
                                  child: Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      // Transparent grid background
                                      Positioned.fill(
                                        child: CustomPaint(
                                          painter: TransparencyGridPainter(),
                                        ),
                                      ),
                                      if (_processedBytes != null)
                                        Image.memory(
                                          _processedBytes!,
                                          fit: BoxFit.contain,
                                        ),
                                      if (_isProcessing)
                                        Container(
                                          color: Colors.black26,
                                          child: const Center(
                                            child: CircularProgressIndicator(
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                );
                              },
                            ),
                    ),
                  ),

                  const SizedBox(width: 24),

                  // Controls Area
                  Expanded(
                    flex: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Instructions',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          '1. Tap anywhere on the image background to pick the color to remove.',
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          '2. Adjust the tolerance slider below until the background is fully erased.',
                        ),
                        const SizedBox(height: 24),

                        const Text(
                          'Selected Color:',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          height: 40,
                          decoration: BoxDecoration(
                            color: _selectedColor ?? Colors.grey.shade300,
                            border: Border.all(color: Colors.grey.shade400),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: _selectedColor == null
                              ? const Center(child: Text('No color picked'))
                              : null,
                        ),

                        const SizedBox(height: 24),

                        Text(
                          'Tolerance: ${(_tolerance * 100).toInt()}%',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Slider(
                          value: _tolerance,
                          min: 0.01,
                          max: 0.8,
                          divisions: 79,
                          onChanged: (val) {
                            setState(() => _tolerance = val);
                          },
                          onChangeEnd: (val) {
                            _applyEraser();
                          },
                        ),

                        const Spacer(),

                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              // Revert
                              setState(() {
                                _processedBytes = _originalBytes;
                                _selectedColor = null;
                              });
                            },
                            icon: const Icon(Icons.restore),
                            label: const Text('Reset'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.black87,
                              side: const BorderSide(color: Colors.grey),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton.icon(
                            onPressed: _isProcessing || _processedBytes == null
                                ? null
                                : () => Navigator.pop(context, _processedBytes),
                            icon: const Icon(Icons.check),
                            label: const Text('Apply Changes'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
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
}

class TransparencyGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint1 = Paint()..color = const Color(0xFFE0E0E0);
    final paint2 = Paint()..color = const Color(0xFFFFFFFF);
    const double squareSize = 20.0;

    for (double x = 0; x < size.width; x += squareSize) {
      for (double y = 0; y < size.height; y += squareSize) {
        bool isEven =
            ((x / squareSize).floor() + (y / squareSize).floor()) % 2 == 0;
        canvas.drawRect(
          Rect.fromLTWH(x, y, squareSize, squareSize),
          isEven ? paint1 : paint2,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
