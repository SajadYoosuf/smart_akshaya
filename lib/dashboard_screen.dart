import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:smart_akshaya/providers/service_reports_provider.dart';
import 'package:smart_akshaya/providers/saved_bills_provider.dart';
import 'package:smart_akshaya/widgets/quick_document_finder.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ServiceReportsProvider>().fetchReports();
      context.read<SavedBillsProvider>().fetchSavedBills();
    });
  }

  @override
  Widget build(BuildContext context) {
    final reportsProvider = context.watch<ServiceReportsProvider>();
    final savedBillsProvider = context.watch<SavedBillsProvider>();

    final now = DateTime.now();
    final todayStr = DateFormat('yyyy-MM-dd').format(now);

    final todayReports = reportsProvider.allReports.where((r) => r.date == todayStr).toList();
    final todaySaved = savedBillsProvider.allBills.where((b) => b.date == todayStr).toList();

    final int todayEntriesCount = todayReports.length + todaySaved.length;
    final int todayCompletedCount = todayReports.length;

    final double totalServiceCharge = reportsProvider.allReports.fold(0.0, (sum, r) => sum + r.cash);
    final double totalWalletCharge = reportsProvider.allReports.fold(0.0, (sum, r) => sum + r.gpayUpi);

    final bool isLoading = reportsProvider.isLoading || savedBillsProvider.isLoading;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isLoading && reportsProvider.allReports.isEmpty && savedBillsProvider.allBills.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32.0),
                child: CircularProgressIndicator(),
              ),
            )
          else
            _buildSummaryCards(
              context,
              todayEntriesCount: todayEntriesCount,
              todayCompletedCount: todayCompletedCount,
              totalServiceCharge: totalServiceCharge,
              totalWalletCharge: totalWalletCharge,
            ),
          const SizedBox(height: 24),

          const QuickDocumentFinder(),
          const SizedBox(height: 24),
          _buildHeroSection(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSummaryCards(
    BuildContext context, {
    required int todayEntriesCount,
    required int todayCompletedCount,
    required double totalServiceCharge,
    required double totalWalletCharge,
  }) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final double width = constraints.maxWidth;
        double itemWidth;
        if (width < 600) {
          itemWidth = width;
        } else if (width < 900) {
          itemWidth = (width - 20) / 2;
        } else {
          itemWidth = (width - 60) / 4;
        }

        return Wrap(
          spacing: 20,
          runSpacing: 20,
          children: [
            SizedBox(
              width: itemWidth,
              child: _buildSummaryCard(
                'Today entry',
                todayEntriesCount.toString(),
                Icons.edit_note_rounded,
                const Color(0xFFECFDF5),
                const Color(0xFF10B981),
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: _buildSummaryCard(
                'Today completed',
                todayCompletedCount.toString(),
                Icons.check_circle_outline_rounded,
                const Color(0xFFECFDF5),
                const Color(0xFF10B981),
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: _buildSummaryCard(
                'Total service charge',
                '₹${totalServiceCharge.toStringAsFixed(2)}',
                Icons.payments_outlined,
                const Color(0xFFEFF6FF),
                const Color(0xFF3B82F6),
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: _buildSummaryCard(
                'Total wallet charge',
                '₹${totalWalletCharge.toStringAsFixed(2)}',
                Icons.account_balance_wallet_outlined,
                const Color(0xFFFEF2F2),
                const Color(0xFFEF4444),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSummaryCard(
    String title,
    String value,
    IconData icon,
    Color bgColor,
    Color iconColor,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSection() {
    return Container(
      height: 300,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        image: const DecorationImage(
          image: NetworkImage(
            'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=2000&auto=format&fit=crop',
          ),
          fit: BoxFit.cover,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [
              Colors.black.withOpacity(0.8),
              Colors.black.withOpacity(0.2),
            ],
          ),
        ),
        padding: const EdgeInsets.all(48),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Empowering Every Citizen',
              style: TextStyle(
                color: Colors.white,
                fontSize: 36,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 16),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 500),
              child: Text(
                'Access all e-governance services through Kerala\'s smartest IT initiative. Streamlined, secure, and built for the future.',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 16,
                  height: 1.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Wrap(
      spacing: 24,
      runSpacing: 12,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        const Text(
          '© 2024 Smart Akshaya - Kerala State IT Mission. All rights reserved.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
        ),
        _footerLink('Privacy Policy'),
        _footerLink('Terms of Service'),
        _footerLink('Help Desk'),
        _footerLink('Contact Us'),
      ],
    );
  }

  Widget _footerLink(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: Color(0xFF1E293B),
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}
