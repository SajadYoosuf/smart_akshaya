import 'package:flutter/material.dart';
import 'dashboard_screen.dart';
import 'new_entry_screen.dart';
import 'application_forms_screen.dart';
import 'service_reports_screen.dart';
import 'expenses_screen.dart';
import 'master_services_screen.dart';
import 'staff_management_screen.dart';
import 'login_screen.dart';
// New screens added in redesign
import 'saved_bills_screen.dart';
import 'services/auth_service.dart';
import 'package:provider/provider.dart';
import 'providers/staff_provider.dart';
import 'providers/services_provider.dart';
import 'providers/expenses_provider.dart';
import 'providers/service_reports_provider.dart';
import 'providers/saved_bills_provider.dart';
// New screens added in redesign
import 'wallet_screen.dart';
import 'calculator_screen.dart';
import 'sslc_calculator_screen.dart';
import 'customer_details_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  final String? userRole;
  final int? initialIndex;
  const MainNavigationScreen({super.key, this.userRole, this.initialIndex});

  @override
  State<MainNavigationScreen> createState() => MainNavigationScreenState();
}

class MainNavigationScreenState extends State<MainNavigationScreen> {
  late int _selectedIndex;
  late String _role;

  void setSelectedIndex(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  String _userName = 'Admin User';

  @override
  void initState() {
    super.initState();
    _role = widget.userRole ?? 'admin';
    _loadSessionDetails();
    if (widget.initialIndex != null) {
      _selectedIndex = widget.initialIndex!;
    } else {
      _selectedIndex = _role == 'staff' ? 1 : 0;
    }
  }

  void _loadSessionDetails() async {
    final session = await AuthService().getSessionDetails();
    if (session['name']!.isNotEmpty) {
      setState(() {
        _userName = session['name']!;
      });
    }
  }

  final List<String> _pageTitles = [
    'Dashboard', // 0
    'Service Entry', // 1
    'Service Reports', // 2
    'Services', // 3
    'Application Forms', // 4
    'Expenses', // 5
    'Service Management', // 6
    'Staff Management', // 7
    'Saved Bills', // 8
    'Wallets Balance', // 9
    'Calculator', // 10
    'Customer Details', // 11
    'SSLC Calculator', // 12
  ];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final bool isDesktop = constraints.maxWidth >= 800;

        return Scaffold(
          backgroundColor: const Color(0xFFF1F5F9),
          drawer: isDesktop ? null : Drawer(child: _buildSidebar()),
          body: Row(
            children: [
              // Sidebar
              if (isDesktop) _buildSidebar(),

              // Main Content Shell
              Expanded(
                child: Column(
                  children: [
                    if (_selectedIndex != 4) _buildTopBar(isDesktop: isDesktop),
                    Expanded(
                      child: IndexedStack(
                        index: _selectedIndex,
                        children: [
                          const DashboardScreen(), // 0
                          const NewEntryScreen(), // 1
                          const ServiceReportsScreen(), // 2
                          _buildPlaceholderPage('Services'), // 3
                          const ApplicationFormsScreen(), // 4
                          const ExpensesScreen(), // 5
                          const MasterServicesScreen(), // 6
                          const StaffManagementScreen(), // 7
                          const SavedBillsScreen(), // 8
                          const WalletScreen(), // 9
                          const CalculatorScreen(), // 10
                          const CustomerDetailsScreen(), // 11
                          const SslcCalculatorScreen(), // 12
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSidebar() {
    return Container(
      width: 260,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withOpacity(0.2), width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/images/akshaya_logo.png',
                      width: 44,
                      height: 44,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Smart Akshaya',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Text(
                        'Akashaya Pookiparamb',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.6),
                          fontSize: 11,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Scrollable Navigation Area
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSidebarSectionTitle('MAIN'),
                  if (_role == 'admin')
                    _buildNavItem('Dashboard', Icons.dashboard_rounded, 0),
                  _buildNavItem(
                    'Application Forms',
                    Icons.folder_open_rounded,
                    4,
                  ),

                  if (_role == 'admin' || _role == 'staff') ...[
                    _buildSidebarSectionTitle('SERVICES'),
                    _buildNavItem(
                      'Service Entry',
                      Icons.grid_view_rounded,
                      1,
                    ),
                    _buildNavItem('Saved Bills', Icons.bookmark_rounded, 8),
                    if (_role == 'admin')
                      _buildNavItem(
                        'Service Management',
                        Icons.settings_applications_rounded,
                        6,
                      ),

                    // ── WALLETS Section ──
                    _buildSidebarSectionTitle('WALLETS'),
                    _buildNavItem(
                      'Wallets Balance',
                      Icons.account_balance_wallet_rounded,
                      9,
                    ),
                  ],

                  _buildSidebarSectionTitle('FINANCE'),
                  _buildNavItem(
                    'Service Reports',
                    Icons.bar_chart_rounded,
                    2,
                  ),
                  _buildNavItem('Expenses', Icons.payments_outlined, 5),

                  if (_role == 'admin') ...[
                    _buildSidebarSectionTitle('SYSTEM'),
                    _buildNavItem(
                      'Staff Management',
                      Icons.people_rounded,
                      7,
                    ),
                    _buildNavItem(
                      'Customer Details',
                      Icons.person_search_rounded,
                      11,
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Apply for Service Button
          _buildUserProfile(),
        ],
      ),
    );
  }

  Widget _buildSidebarSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
      child: Text(
        title,
        style: TextStyle(
          color: Colors.white.withOpacity(0.3),
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildNavItem(String title, IconData icon, int index) {
    bool isActive = _selectedIndex == index;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      child: InkWell(
        onTap: () => setState(() => _selectedIndex = index),
        borderRadius: BorderRadius.circular(8),
        mouseCursor: SystemMouseCursors.click,
        hoverColor: Colors.white.withOpacity(0.07),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFF10B981) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                color: isActive ? Colors.white : Colors.white.withOpacity(0.6),
                size: 20,
              ),
              const SizedBox(width: 16),
              Text(
                title,
                style: TextStyle(
                  color: isActive
                      ? Colors.white
                      : Colors.white.withOpacity(0.6),
                  fontSize: 14,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExpandableNavItem({
    required String title,
    required IconData icon,
    required bool isExpanded,
    required VoidCallback onExpandToggle,
    required List<Widget> children,
  }) {
    // Check if any child is active
    bool isAnyChildActive = false;
    if (title == 'Services' && _selectedIndex == 1) isAnyChildActive = true;
    if (title == 'Reports' && _selectedIndex == 2) isAnyChildActive = true;
    if (title == 'Settings' && (_selectedIndex == 6 || _selectedIndex == 7))
      isAnyChildActive = true;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: InkWell(
            onTap: onExpandToggle,
            borderRadius: BorderRadius.circular(8),
            mouseCursor: SystemMouseCursors.click,
            hoverColor: Colors.white.withOpacity(0.07),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isAnyChildActive && !isExpanded
                    ? const Color(0xFF10B981)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    icon,
                    color: isAnyChildActive && !isExpanded
                        ? Colors.white
                        : Colors.white.withOpacity(0.6),
                    size: 20,
                  ),
                  const SizedBox(width: 16),
                  Text(
                    title,
                    style: TextStyle(
                      color: isAnyChildActive && !isExpanded
                          ? Colors.white
                          : Colors.white.withOpacity(0.6),
                      fontSize: 14,
                      fontWeight: isAnyChildActive && !isExpanded
                          ? FontWeight.w600
                          : FontWeight.w500,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    isExpanded
                        ? Icons.keyboard_arrow_down_rounded
                        : Icons.keyboard_arrow_right_rounded,
                    color: Colors.white.withOpacity(0.4),
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
        ),
        if (isExpanded) ...children,
      ],
    );
  }

  Widget _buildSubNavItem(String title, int index) {
    bool isActive = _selectedIndex == index;
    return Padding(
      padding: const EdgeInsets.only(left: 48, right: 16, top: 2, bottom: 2),
      child: InkWell(
        onTap: () => setState(() => _selectedIndex = index),
        borderRadius: BorderRadius.circular(8),
        mouseCursor: SystemMouseCursors.click,
        hoverColor: Colors.white.withOpacity(0.07),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFF10B981) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Text(
                title,
                style: TextStyle(
                  color: isActive
                      ? Colors.white
                      : Colors.white.withOpacity(0.6),
                  fontSize: 13,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUserProfile() {
    String initials = 'RM';
    if (_userName.isNotEmpty) {
      initials = _userName
          .split(' ')
          .map((e) => e.isNotEmpty ? e[0] : '')
          .take(2)
          .join('')
          .toUpperCase();
      if (initials.isEmpty) initials = 'U';
    }

    return Container(
      padding: const EdgeInsets.all(20),
      color: Colors.black26,
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: Color(0xFF10B981),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _userName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  _role == 'admin' ? 'System Admin' : 'Service Operator',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.4),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () async {
              await AuthService().logout();
              if (mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              }
            },
            icon: const Icon(Icons.logout_rounded, color: Colors.red, size: 20),
            tooltip: 'Log out',
            mouseCursor: SystemMouseCursors.click,
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar({bool isDesktop = true}) {
    return Container(
      height: 70,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Row(
        children: [
          if (!isDesktop) ...[
            Builder(
              builder: (context) => IconButton(
                icon: const Icon(Icons.menu),
                onPressed: () => Scaffold.of(context).openDrawer(),
              ),
            ),
            const SizedBox(width: 16),
          ],
          Text(
            _pageTitles[_selectedIndex],
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E293B),
            ),
          ),
          const Spacer(),
          IconButton(
            onPressed: () async {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Refreshing live data...'),
                  duration: Duration(seconds: 1),
                ),
              );
              try {
                await Future.wait([
                  context.read<StaffProvider>().loadStaff(),
                  context.read<ServicesProvider>().loadServices(),
                  context.read<ExpensesProvider>().fetchExpenses(),
                  context.read<ServiceReportsProvider>().fetchReports(),
                  context.read<SavedBillsProvider>().fetchSavedBills(),
                ]);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Data refreshed successfully!'),
                      backgroundColor: Colors.green,
                      duration: Duration(seconds: 2),
                    ),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error refreshing data: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            icon: const Icon(Icons.sync_rounded, color: Color(0xFF64748B)),
            tooltip: 'Reload live data from server',
            mouseCursor: SystemMouseCursors.click,
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholderPage(String title) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.construction_rounded,
            size: 64,
            color: Colors.grey.shade300,
          ),
          const SizedBox(height: 16),
          Text(
            '$title Page Coming Soon',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade400,
            ),
          ),
        ],
      ),
    );
  }
}

class SidebarItem {
  final String title;
  final IconData icon;
  SidebarItem({required this.title, required this.icon});
}
