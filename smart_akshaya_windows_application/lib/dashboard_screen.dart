import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:smart_akshaya/providers/service_reports_provider.dart';
import 'package:smart_akshaya/providers/saved_bills_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:window_manager/window_manager.dart';
import 'main_navigation_screen.dart';
import 'services/google_sheets_service.dart';
import 'services/auth_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  double _totalWalletBalance = 0.0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ServiceReportsProvider>().fetchReports();
      context.read<SavedBillsProvider>().fetchSavedBills();
      _fetchWalletBalance();
    });
  }

  Future<void> _fetchWalletBalance() async {
    try {
      final spreadsheetId = await AuthService().getSpreadsheetId();
      final rows = await GoogleSheetsService().getRows(
        spreadsheetId,
        'Wallets',
      );
      if (rows != null && rows.length > 1) {
        final headers = rows[0]
            .map((e) => e.toString().trim().toLowerCase())
            .toList();
        final balIdx = headers.indexOf('current balance');
        if (balIdx != -1) {
          double total = 0.0;
          for (int i = 1; i < rows.length; i++) {
            final r = rows[i];
            if (r.length > balIdx) {
              total += double.tryParse(r[balIdx].toString()) ?? 0.0;
            }
          }
          setState(() {
            _totalWalletBalance = total;
          });
        }
      }
    } catch (e) {
      print('Error loading wallet balance on dashboard: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final reportsProvider = context.watch<ServiceReportsProvider>();
    final savedBillsProvider = context.watch<SavedBillsProvider>();

    final now = DateTime.now();
    final todayStr = DateFormat('yyyy-MM-dd').format(now);

    final todayReports = reportsProvider.allReports
        .where((r) => r.date == todayStr)
        .toList();
    final todaySaved = savedBillsProvider.allBills
        .where((b) => b.date == todayStr)
        .toList();

    final int todayEntriesCount = todayReports.length + todaySaved.length;
    final int todayCompletedCount = todayReports.length;

    final double totalServiceCharge = reportsProvider.allReports.fold(
      0.0,
      (sum, r) => sum + r.cash,
    );
    final double totalWalletCharge = _totalWalletBalance;

    final bool isLoading =
        reportsProvider.isLoading || savedBillsProvider.isLoading;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeroBanner(context),
          const SizedBox(height: 32),

          if (isLoading &&
              reportsProvider.allReports.isEmpty &&
              savedBillsProvider.allBills.isEmpty)
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
          const SizedBox(height: 32),

          _buildQuickLaunchGrid(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildHeroBanner(BuildContext context) {
    final now = DateTime.now();
    final dateStr = DateFormat('EEEE, MMMM d, yyyy').format(now);
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 32),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF3B82F6), Color(0xFF4F46E5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            dateStr,
            style: TextStyle(
              color: Colors.white.withOpacity(0.9),
              fontSize: 16,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Welcome back, User!',
            style: TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
          ),
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
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: iconColor, size: 28),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1E293B),
                    letterSpacing: -0.5,
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

  Future<void> _launchWebTool(String route) async {
    final uri = Uri.parse('http://localhost:5173/$route');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not launch web tool: $uri'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _navigateToTab(int index) {
    context
        .findAncestorStateOfType<MainNavigationScreenState>()
        ?.setSelectedIndex(index);
  }

  Widget _buildQuickLaunchGrid() {
    final List<TileData> tiles = [
      TileData(
        label: 'Crop & Resize',
        sublabel: 'Photo & Sign',
        icon: Icons.crop_rounded,
        bg: const Color(0xFFE91E8C),
        onTap: () => _launchWebTool('resizer'),
      ),
      TileData(
        label: 'Passport Size',
        sublabel: 'Photo Creator',
        icon: Icons.camera_alt_rounded,
        bg: const Color(0xFFF4736B),
        onTap: () => _launchWebTool('passport'),
      ),
      TileData(
        label: 'PSC',
        sublabel: 'Photo Creator',
        icon: Icons.person_rounded,
        bg: const Color(0xFF4DD0C4),
        onTap: () => _launchWebTool('psc-photo'),
      ),
      TileData(
        label: 'SSLC Percentage',
        sublabel: 'Calculation',
        icon: Icons.percent_rounded,
        bg: const Color(0xFFCE93D8),
        onTap: () => _navigateToTab(12),
      ),
      TileData(
        label: 'Calculator',
        sublabel: 'Standard Tool',
        icon: Icons.calculate_rounded,
        bg: const Color(0xFFF59E0B),
        onTap: () => _navigateToTab(10),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Launch Tools',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 24),
        LayoutBuilder(
          builder: (context, constraints) {
            final double width = constraints.maxWidth;
            int crossAxisCount = 4;
            if (width < 600) {
              crossAxisCount = 1;
            } else if (width < 850) {
              crossAxisCount = 2;
            } else if (width < 1100) {
              crossAxisCount = 3;
            }

            final double itemWidth =
                (width - (crossAxisCount - 1) * 16) / crossAxisCount;
            final double childAspectRatio = itemWidth / 110.0;

            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: crossAxisCount,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: childAspectRatio,
              ),
              itemCount: tiles.length,
              itemBuilder: (context, index) {
                final tile = tiles[index];
                return HoverToolCard(tile: tile);
              },
            );
          },
        ),
      ],
    );
  }
}

class TileData {
  final String label;
  final String sublabel;
  final IconData icon;
  final Color bg;
  final VoidCallback onTap;

  TileData({
    required this.label,
    required this.sublabel,
    required this.icon,
    required this.bg,
    required this.onTap,
  });
}

class HoverToolCard extends StatefulWidget {
  final TileData tile;
  const HoverToolCard({super.key, required this.tile});

  @override
  State<HoverToolCard> createState() => _HoverToolCardState();
}

class _HoverToolCardState extends State<HoverToolCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      cursor: SystemMouseCursors.click,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        transform: Matrix4.translationValues(0, _isHovered ? -4 : 0, 0),
        decoration: BoxDecoration(
          color: widget.tile.bg,
          borderRadius: BorderRadius.circular(20),
          boxShadow: _isHovered
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 25,
                    offset: const Offset(0, 10),
                  )
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  )
                ],
        ),
        child: InkWell(
          mouseCursor: SystemMouseCursors.click,
          onTap: widget.tile.onTap,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            color: Colors.transparent,
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(widget.tile.icon, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        widget.tile.label,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          height: 1.2,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.tile.sublabel,
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.85),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
