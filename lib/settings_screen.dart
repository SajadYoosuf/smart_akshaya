import 'package:flutter/material.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Password Reset Card
          Center(
            child: Container(
              width: 450,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Card Header
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: const [
                        Icon(Icons.lock_outline_rounded, color: Color(0xFF10B981), size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Password reset',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  // Form Fields
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('Email Address'),
                        const SizedBox(height: 8),
                        _buildReadOnlyField('akksmpm250@gmail.com'),
                        const SizedBox(height: 24),
                        _buildLabel('New password'),
                        const SizedBox(height: 8),
                        _buildPasswordField('Enter new password'),
                        const SizedBox(height: 6),
                        const Text(
                          'Minimum 8 characters',
                          style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                        ),
                        const SizedBox(height: 24),
                        _buildLabel('Confirm password'),
                        const SizedBox(height: 8),
                        _buildPasswordField('Retype new password'),
                        const SizedBox(height: 32),
                        SizedBox(
                          width: double.infinity,
                          height: 44,
                          child: ElevatedButton.icon(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF10B981),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              elevation: 0,
                            ),
                            icon: const Icon(Icons.check_rounded, size: 18),
                            label: const Text('Update password', style: TextStyle(fontWeight: FontWeight.bold)),
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
    );
  }

  Widget _buildLabel(String label) {
    return Text(
      label,
      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
    );
  }

  Widget _buildReadOnlyField(String text) {
    return Container(
      width: double.infinity,
      height: 42,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      alignment: Alignment.centerLeft,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(
        text,
        style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
      ),
    );
  }

  Widget _buildPasswordField(String hint) {
    return Container(
      height: 42,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              obscureText: true,
              keyboardType: TextInputType.visiblePassword,
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.only(bottom: 12),
              ),
            ),
          ),
          const Icon(Icons.visibility_outlined, size: 18, color: Color(0xFF94A3B8)),
        ],
      ),
    );
  }
}
