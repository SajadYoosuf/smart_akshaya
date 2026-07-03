import 'package:flutter/material.dart';

/// Full-featured calculator screen for the Desktop app.
class CalculatorScreen extends StatefulWidget {
  const CalculatorScreen({super.key});

  @override
  State<CalculatorScreen> createState() => _CalculatorScreenState();
}

class _CalculatorScreenState extends State<CalculatorScreen> {
  String _display = '0';
  String _expression = '';
  double? _prevValue;
  String? _operator;
  bool _waitingForOperand = false;
  final List<String> _history = [];

  // ── Button grid ──────────────────────────────────────────────────────────
  final List<List<String>> _btnRows = const [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '.', '⌫', '='],
  ];

  String _fmt(double n) {
    if (n.isNaN || n.isInfinite) return 'Error';
    if (n == n.truncate()) {
      final int i = n.truncate();
      return i.toString();
    }
    return n.toString();
  }

  void _inputDigit(String d) {
    setState(() {
      if (_waitingForOperand) {
        _display = d;
        _waitingForOperand = false;
      } else {
        _display = _display == '0' ? d : _display + d;
      }
    });
  }

  void _inputDecimal() {
    setState(() {
      if (_waitingForOperand) {
        _display = '0.';
        _waitingForOperand = false;
        return;
      }
      if (!_display.contains('.')) _display += '.';
    });
  }

  void _toggleSign() {
    setState(() {
      final v = double.tryParse(_display) ?? 0;
      _display = _fmt(v * -1);
    });
  }

  void _percent() {
    setState(() {
      final v = double.tryParse(_display) ?? 0;
      _display = _fmt(v / 100);
    });
  }

  void _backspace() {
    setState(() {
      if (_display.length == 1 ||
          (_display.length == 2 && _display.startsWith('-'))) {
        _display = '0';
      } else {
        _display = _display.substring(0, _display.length - 1);
      }
    });
  }

  void _clear() {
    setState(() {
      _display = '0';
      _expression = '';
      _prevValue = null;
      _operator = null;
      _waitingForOperand = false;
    });
  }

  double _calculate(double a, double b, String op) {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b != 0 ? a / b : double.nan;
      default: return b;
    }
  }

  void _handleOperator(String op) {
    setState(() {
      final curr = double.tryParse(_display) ?? 0;
      if (_prevValue != null && _operator != null && !_waitingForOperand) {
        final result = _calculate(_prevValue!, curr, _operator!);
        _display = _fmt(result);
        _prevValue = result;
        _expression = '${_fmt(result)} $op';
      } else {
        _prevValue = curr;
        _expression = '$_display $op';
      }
      _operator = op;
      _waitingForOperand = true;
    });
  }

  void _equals() {
    if (_prevValue == null || _operator == null) return;
    setState(() {
      final curr = double.tryParse(_display) ?? 0;
      final result = _calculate(_prevValue!, curr, _operator!);
      final entry = '$_expression $_display = ${_fmt(result)}';
      _history.insert(0, entry);
      if (_history.length > 20) _history.removeLast();
      _display = _fmt(result);
      _expression = '';
      _prevValue = null;
      _operator = null;
      _waitingForOperand = true;
    });
  }

  void _handleBtn(String btn) {
    if (RegExp(r'[0-9]').hasMatch(btn)) return _inputDigit(btn);
    switch (btn) {
      case '.': _inputDecimal(); break;
      case 'C': _clear(); break;
      case '±': _toggleSign(); break;
      case '%': _percent(); break;
      case '⌫': _backspace(); break;
      case '=': _equals(); break;
      case '+': case '−': case '×': case '÷':
        _handleOperator(btn); break;
    }
  }

  Color _btnColor(String btn) {
    if (btn == '=') return const Color(0xFF10B981);
    if (['+', '−', '×', '÷'].contains(btn)) return const Color(0xFF10B981);
    if (['C', '±', '%'].contains(btn)) return const Color(0xFF3B82F6);
    return const Color(0xFF1E293B);
  }

  Color _btnTextColor(String btn) {
    if (['C', '±', '%', '+', '−', '×', '÷', '=', '⌫'].contains(btn)) return Colors.white;
    return Colors.white;
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Calculator', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          const SizedBox(height: 4),
          const Text('Full-featured calculator with history', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Calculator body ──────────────────────────────────────
              Container(
                width: 320,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 4))],
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Display
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(_expression, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                          const SizedBox(height: 4),
                          Text(
                            _display,
                            style: TextStyle(
                              fontSize: _display.length > 10 ? 22 : 34,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Button grid
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                        mainAxisSpacing: 10,
                        crossAxisSpacing: 10,
                        childAspectRatio: 1.1,
                      ),
                      itemCount: _btnRows.expand((r) => r).length,
                      itemBuilder: (_, idx) {
                        final btn = _btnRows.expand((r) => r).toList()[idx];
                        return InkWell(
                          onTap: () => _handleBtn(btn),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            decoration: BoxDecoration(
                              color: _btnColor(btn),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            alignment: Alignment.center,
                            child: btn == '⌫'
                                ? const Icon(Icons.backspace_outlined, color: Colors.white, size: 18)
                                : Text(btn, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: _btnTextColor(btn))),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 24),

              // ── History panel ────────────────────────────────────────
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('History', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF64748B), letterSpacing: 0.5)),
                          if (_history.isNotEmpty)
                            TextButton(
                              onPressed: () => setState(() => _history.clear()),
                              child: const Text('Clear', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_history.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(20),
                          child: Center(child: Text('No calculations yet.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13))),
                        )
                      else
                        ...(_history.map((h) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Text(h, style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: Color(0xFF475569))),
                        ))),
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
}
