import 'package:flutter/material.dart';

/// SSLC Percentage Calculator — Native Flutter screen (not a web link)
class SslcCalculatorScreen extends StatefulWidget {
  const SslcCalculatorScreen({super.key});

  @override
  State<SslcCalculatorScreen> createState() => _SslcCalculatorScreenState();
}

class _SslcCalculatorScreenState extends State<SslcCalculatorScreen> {
  // 6 subjects, each has a marks controller
  final List<String> _subjects = [
    'Malayalam',
    'English',
    'Hindi',
    'Mathematics',
    'Science',
    'Social Science',
  ];
  late List<TextEditingController> _controllers;
  double? _percentage;
  String? _grade;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(_subjects.length, (_) => TextEditingController());
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  String _calcGrade(double p) {
    if (p >= 90) return 'A+ (Outstanding)';
    if (p >= 80) return 'A (Excellent)';
    if (p >= 70) return 'B+ (Very Good)';
    if (p >= 60) return 'B (Good)';
    if (p >= 50) return 'C+ (Above Average)';
    if (p >= 40) return 'C (Average)';
    if (p >= 30) return 'D+ (Below Average)';
    return 'D (Fail)';
  }

  Color _gradeColor(double p) {
    if (p >= 70) return const Color(0xFF10B981);
    if (p >= 50) return const Color(0xFFF59E0B);
    return const Color(0xFFEF4444);
  }

  void _calculate() {
    double total = 0;
    int count = 0;
    for (final c in _controllers) {
      final v = double.tryParse(c.text.trim());
      if (v != null) {
        total += v.clamp(0, 100);
        count++;
      }
    }
    if (count == 0) return;
    setState(() {
      _percentage = total / count;
      _grade = _calcGrade(_percentage!);
    });
  }

  void _reset() {
    for (final c in _controllers) {
      c.clear();
    }
    setState(() {
      _percentage = null;
      _grade = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('SSLC Percentage Calculator',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          const SizedBox(height: 4),
          const Text('Calculate SSLC result percentage and grade.',
              style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
          const SizedBox(height: 24),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Subject marks input ──────────────────────────────────
              Container(
                width: 340,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
                ),
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Enter Marks (out of 100)',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF475569))),
                    const SizedBox(height: 16),

                    ...List.generate(_subjects.length, (i) => Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 160,
                                child: Text(_subjects[i],
                                    style: const TextStyle(fontSize: 13, color: Color(0xFF475569))),
                              ),
                              Expanded(
                                child: SizedBox(
                                  height: 42,
                                  child: TextField(
                                    controller: _controllers[i],
                                    keyboardType: TextInputType.number,
                                    decoration: InputDecoration(
                                      hintText: '0–100',
                                      hintStyle: const TextStyle(fontSize: 12, color: Color(0xFFCBD5E1)),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        borderSide: const BorderSide(color: Color(0xFF10B981)),
                                      ),
                                    ),
                                    style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )),

                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _calculate,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF10B981),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('Calculate', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        OutlinedButton(
                          onPressed: _reset,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Reset'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 24),

              // ── Result panel ─────────────────────────────────────────
              if (_percentage != null)
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const SizedBox(height: 20),
                        const Text('Result', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                        const SizedBox(height: 20),
                        Container(
                          width: 140,
                          height: 140,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _gradeColor(_percentage!).withOpacity(0.08),
                            border: Border.all(color: _gradeColor(_percentage!), width: 4),
                          ),
                          alignment: Alignment.center,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '${_percentage!.toStringAsFixed(2)}%',
                                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: _gradeColor(_percentage!)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          decoration: BoxDecoration(
                            color: _gradeColor(_percentage!).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Text(
                            _grade!,
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: _gradeColor(_percentage!)),
                          ),
                        ),
                        const SizedBox(height: 24),
                        _resultRow('Total Marks Obtained',
                            _controllers.map((c) => double.tryParse(c.text) ?? 0).fold(0.0, (a, b) => a + b).toStringAsFixed(0)),
                        _resultRow('Number of Subjects', _controllers.where((c) => c.text.isNotEmpty).length.toString()),
                        _resultRow('Percentage', '${_percentage!.toStringAsFixed(2)}%'),
                        _resultRow('Grade', _grade!),
                      ],
                    ),
                  ),
                )
              else
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    alignment: Alignment.center,
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      children: [
                        Icon(Icons.school_outlined, size: 48, color: Colors.grey.shade300),
                        const SizedBox(height: 12),
                        Text('Enter marks and press Calculate', style: TextStyle(color: Colors.grey.shade400, fontSize: 14)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _resultRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
        ],
      ),
    );
  }
}
