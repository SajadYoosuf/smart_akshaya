import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class CalculatorDialog extends StatefulWidget {
  const CalculatorDialog({super.key});

  @override
  State<CalculatorDialog> createState() => _CalculatorDialogState();
}

class _CalculatorDialogState extends State<CalculatorDialog> {
  String _display = '0';
  String _operand = '';
  String _operator = '';
  bool _isNewInput = true;

  void _onPress(String text) {
    setState(() {
      if (text == 'C') {
        _display = '0';
        _operand = '';
        _operator = '';
        _isNewInput = true;
      } else if (text == '⌫') {
        if (_display.length > 1) {
          _display = _display.substring(0, _display.length - 1);
        } else {
          _display = '0';
          _isNewInput = true;
        }
      } else if (text == '=') {
        _calculate();
        _operator = '';
        _isNewInput = true;
      } else if (['+', '-', '*', '/'].contains(text)) {
        if (_operator.isNotEmpty && !_isNewInput) {
          _calculate();
        }
        _operand = _display;
        _operator = text;
        _isNewInput = true;
      } else if (text == '.') {
        if (_isNewInput) {
          _display = '0.';
          _isNewInput = false;
        } else if (!_display.contains('.')) {
          _display += '.';
        }
      } else {
        if (_isNewInput) {
          _display = text;
          _isNewInput = false;
        } else {
          _display = _display == '0' ? text : _display + text;
        }
      }
    });
  }

  void _calculate() {
    if (_operator.isEmpty || _operand.isEmpty) return;
    double num1 = double.tryParse(_operand) ?? 0;
    double num2 = double.tryParse(_display) ?? 0;
    double result = 0;
    switch (_operator) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '*':
        result = num1 * num2;
        break;
      case '/':
        result = num2 == 0 ? 0 : num1 / num2;
        break;
    }
    
    // Format result to remove trailing .0
    if (result == result.toInt()) {
      _display = result.toInt().toString();
    } else {
      String strResult = result.toStringAsFixed(4);
      // Remove trailing zeros and decimal point if not needed
      while (strResult.contains('.') && (strResult.endsWith('0') || strResult.endsWith('.'))) {
        if (strResult.endsWith('.')) {
          strResult = strResult.substring(0, strResult.length - 1);
          break;
        }
        strResult = strResult.substring(0, strResult.length - 1);
      }
      _display = strResult;
    }
  }

  Widget _buildBtn(String text, {Color? bgColor, Color? textColor, int flex = 1}) {
    return Expanded(
      flex: flex,
      child: Padding(
        padding: const EdgeInsets.all(4.0),
        child: Material(
          color: bgColor ?? const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            onTap: () => _onPress(text),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: 64,
              alignment: Alignment.center,
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w600,
                  color: textColor ?? Colors.white,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Focus(
      autofocus: true,
      onKeyEvent: (node, event) {
        if (event is KeyDownEvent) {
          if (event.logicalKey == LogicalKeyboardKey.backspace) {
            _onPress('⌫');
            return KeyEventResult.handled;
          } else if (event.logicalKey == LogicalKeyboardKey.delete || event.logicalKey == LogicalKeyboardKey.escape) {
            _onPress('C');
            return KeyEventResult.handled;
          } else if (event.logicalKey == LogicalKeyboardKey.numpadAdd || event.character == '+') {
            _onPress('+');
            return KeyEventResult.handled;
          } else if (event.logicalKey == LogicalKeyboardKey.numpadSubtract || event.character == '-') {
            _onPress('-');
            return KeyEventResult.handled;
          } else if (event.logicalKey == LogicalKeyboardKey.numpadMultiply || event.character == '*') {
            _onPress('*');
            return KeyEventResult.handled;
          } else if (event.logicalKey == LogicalKeyboardKey.numpadDivide || event.character == '/') {
            _onPress('/');
            return KeyEventResult.handled;
          } else if (event.logicalKey == LogicalKeyboardKey.enter || event.logicalKey == LogicalKeyboardKey.numpadEnter || event.character == '=') {
            _onPress('=');
            return KeyEventResult.handled;
          } else if (event.logicalKey == LogicalKeyboardKey.period || event.logicalKey == LogicalKeyboardKey.numpadDecimal || event.character == '.') {
            _onPress('.');
            return KeyEventResult.handled;
          } else if (event.character != null && RegExp(r'^[0-9]$').hasMatch(event.character!)) {
            _onPress(event.character!);
            return KeyEventResult.handled;
          }
        }
        return KeyEventResult.ignored;
      },
      child: Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      elevation: 0,
      backgroundColor: Colors.transparent,
      child: Container(
        width: 340,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.4),
              blurRadius: 30,
              offset: const Offset(0, 15),
            )
          ]
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.calculate_rounded, color: Color(0xFF3B82F6), size: 24),
                    SizedBox(width: 8),
                    Text('Calculator', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close_rounded, color: Colors.white54),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  splashRadius: 24,
                )
              ],
            ),
            const SizedBox(height: 24),
            // Display Area
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _operator.isNotEmpty ? '$_operand $_operator' : '',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.white54,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _display,
                    style: const TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.w300,
                      color: Colors.white,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Keys
            Row(
              children: [
                _buildBtn('C', bgColor: const Color(0xFFEF4444), flex: 2),
                _buildBtn('⌫', bgColor: const Color(0xFF475569)),
                _buildBtn('/', bgColor: const Color(0xFF3B82F6)),
              ],
            ),
            Row(
              children: [
                _buildBtn('7'), _buildBtn('8'), _buildBtn('9'), _buildBtn('*', bgColor: const Color(0xFF3B82F6)),
              ],
            ),
            Row(
              children: [
                _buildBtn('4'), _buildBtn('5'), _buildBtn('6'), _buildBtn('-', bgColor: const Color(0xFF3B82F6)),
              ],
            ),
            Row(
              children: [
                _buildBtn('1'), _buildBtn('2'), _buildBtn('3'), _buildBtn('+', bgColor: const Color(0xFF3B82F6)),
              ],
            ),
            Row(
              children: [
                _buildBtn('0', flex: 2), _buildBtn('.'), _buildBtn('=', bgColor: const Color(0xFF10B981)),
              ],
            ),
          ],
        ),
      ),
    ));
  }
}
