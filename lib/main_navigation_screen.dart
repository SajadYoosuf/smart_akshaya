import 'package:flutter/material.dart';
import 'dashboard_screen.dart';
import 'new_entry_screen.dart';
import 'service_reports_screen.dart';
import 'expenses_screen.dart';
import 'settings_screen.dart';
import 'master_services_screen.dart';
import 'staff_management_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;
  bool _isServicesExpanded = false;
  bool _isReportsExpanded = false;
  bool _isSettingsExpanded = false;

  final List<String> _pageTitles = [
    'Dashboard',
    'New entry',
    'Service reports',
    'Services',
    'Expenses',
    'Settings — password reset',
    'Services — Master',
    'Staff management',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: Row(
        children: [
          // Sidebar
          _buildSidebar(),

          // Main Content Shell
          Expanded(
            child: Column(
              children: [
                _buildTopBar(),
                Expanded(
                  child: IndexedStack(
                    index: _selectedIndex,
                    children: [
                      const DashboardScreen(),
                      const NewEntryScreen(),
                      const ServiceReportsScreen(),
                      _buildPlaceholderPage('Services'),
                      const ExpensesScreen(),
                      const SettingsScreen(),
                      const MasterServicesScreen(),
                      const StaffManagementScreen(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
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
                  _buildSidebarSectionTitle('MAIN'),
                  _buildNavItem('Dashboard', Icons.dashboard_rounded, 0),
                  _buildExpandableNavItem(
                    title: 'Services',
                    icon: Icons.grid_view_rounded,
                    isExpanded: _isServicesExpanded,
                    onExpandToggle: () =>
                        setState(() => _isServicesExpanded = !_isServicesExpanded),
                    children: [_buildSubNavItem('New entry', 1)],
                  ),

                  _buildSidebarSectionTitle('FINANCE'),
                  _buildExpandableNavItem(
                    title: 'Reports',
                    icon: Icons.bar_chart_rounded,
                    isExpanded: _isReportsExpanded,
                    onExpandToggle: () =>
                        setState(() => _isReportsExpanded = !_isReportsExpanded),
                    children: [_buildSubNavItem('Service reports', 2)],
                  ),
                  _buildNavItem('Expenses', Icons.payments_outlined, 4),

                  _buildSidebarSectionTitle('SYSTEM'),
                  _buildExpandableNavItem(
                    title: 'Settings',
                    icon: Icons.settings_rounded,
                    isExpanded: _isSettingsExpanded,
                    onExpandToggle: () =>
                        setState(() => _isSettingsExpanded = !_isSettingsExpanded),
                    children: [
                      _buildSubNavItem('Password reset', 5),
                      _buildSubNavItem('Services', 6),
                      _buildSubNavItem('Staff management', 7),
                    ],
                  ),
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
                  color: isActive ? Colors.white : Colors.white.withOpacity(0.6),
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
    if (title == 'Settings' && (_selectedIndex == 5 || _selectedIndex == 6 || _selectedIndex == 7)) isAnyChildActive = true;

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
                  color: isActive ? Colors.white : Colors.white.withOpacity(0.6),
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
            child: const Center(
              child: Text(
                'RM',
                style: TextStyle(
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
                const Text(
                  'Raseena Mol',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Operator',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.4),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: Icon(Icons.logout_rounded, color: Colors.red, size: 20),
            tooltip: 'Log out',
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      height: 70,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Row(
        children: [
          Text(
            _pageTitles[_selectedIndex],
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E293B),
            ),
          ),
          const Spacer(),
          Stack(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.notifications_none_rounded,
                  color: Color(0xFF64748B),
                  size: 22,
                ),
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
            ],
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
