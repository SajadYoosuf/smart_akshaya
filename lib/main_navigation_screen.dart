import 'package:flutter/material.dart';
import 'dashboard_screen.dart';
import 'new_entry_screen.dart';
import 'application_forms_screen.dart';
import 'service_reports_screen.dart';
import 'expenses_screen.dart';
import 'settings_screen.dart';
import 'master_services_screen.dart';
import 'staff_management_screen.dart';
import 'login_screen.dart';
import 'photo_resizer_screen.dart';
import 'passport_photo_screen.dart';
import 'services/auth_service.dart';
import 'screens/biodata/biodata_dashboard_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  final String? userRole;
  const MainNavigationScreen({super.key, this.userRole});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  late int _selectedIndex;
  late String _role;
  bool _isServicesExpanded = true;
  bool _isReportsExpanded = true;
  bool _isSettingsExpanded = false;
  bool _isToolsExpanded = true;
  String _userName = 'Admin User';

  @override
  void initState() {
    super.initState();
    _role = widget.userRole ?? 'admin';
    // Default index for staff is 'New Entry' (1)
    _selectedIndex = _role == 'staff' ? 1 : 0;
    _loadSessionDetails();
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
    'Dashboard',
    'New entry',
    'Service reports',
    'Services',
    "Application Forms",
    'Expenses',
    'Settings — password reset',
    'Services — Master',
    'Staff management',
    'Photo Resizer',
    'Passport Size Photos',
    'Biodata Maker',
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
                          const DashboardScreen(),
                          const NewEntryScreen(),
                          const ServiceReportsScreen(),
                          _buildPlaceholderPage('Services'),
                          const ApplicationFormsScreen(),
                          const ExpensesScreen(),
                          const SettingsScreen(),
                          const MasterServicesScreen(),
                          const StaffManagementScreen(),
                          const PhotoResizerScreen(),
                          const PassportPhotoScreen(),
                          const BiodataDashboardScreen(),
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
      color: const Color(0xFF0F172A),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Smart Akshaya',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  'Kerala IT Mission',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Scrollable Navigation Area
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_role == 'admin') ...[
                    _buildSidebarSectionTitle('MAIN'),
                    _buildNavItem('Dashboard', Icons.dashboard_rounded, 0),
                  ],
                  if (_role == 'admin' || _role == 'staff') ...[
                    if (_role == 'staff') _buildSidebarSectionTitle('SERVICES'),
                    _buildExpandableNavItem(
                      title: 'Services',
                      icon: Icons.grid_view_rounded,
                      isExpanded: _isServicesExpanded,
                      onExpandToggle: () => setState(
                        () => _isServicesExpanded = !_isServicesExpanded,
                      ),
                      children: [_buildSubNavItem('New entry', 1)],
                    ),
                    _buildSidebarSectionTitle('TOOLS'),
                    _buildExpandableNavItem(
                      title: 'Tools',
                      icon: Icons.build_outlined,
                      isExpanded: _isToolsExpanded,
                      onExpandToggle: () =>
                          setState(() => _isToolsExpanded = !_isToolsExpanded),
                      children: [
                        _buildSubNavItem('Application forms', 4),
                        _buildSubNavItem('Photo resizer', 9),
                        _buildSubNavItem('Passport size photos', 10),
                        _buildSubNavItem('Biodata maker', 11),
                      ],
                    ),
                  ],

                  _buildSidebarSectionTitle('FINANCE'),
                  _buildExpandableNavItem(
                    title: 'Reports',
                    icon: Icons.bar_chart_rounded,
                    isExpanded: _isReportsExpanded,
                    onExpandToggle: () => setState(
                      () => _isReportsExpanded = !_isReportsExpanded,
                    ),
                    children: [_buildSubNavItem('Service reports', 2)],
                  ),
                  _buildNavItem('Expenses', Icons.payments_outlined, 5),

                  if (_role == 'admin') ...[
                    _buildSidebarSectionTitle('SYSTEM'),
                    _buildExpandableNavItem(
                      title: 'Settings',
                      icon: Icons.settings_rounded,
                      isExpanded: _isSettingsExpanded,
                      onExpandToggle: () => setState(
                        () => _isSettingsExpanded = !_isSettingsExpanded,
                      ),
                      children: [
                        _buildSubNavItem('Password reset', 6),
                        _buildSubNavItem('Services', 7),
                        _buildSubNavItem('Staff management', 8),
                      ],
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: () => setState(() => _selectedIndex = index),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
    if (title == 'Settings' &&
        (_selectedIndex == 6 || _selectedIndex == 7 || _selectedIndex == 8))
      isAnyChildActive = true;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: InkWell(
            onTap: onExpandToggle,
            borderRadius: BorderRadius.circular(8),
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
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
      ),
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
