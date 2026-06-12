import 'package:flutter/material.dart';
import 'package:smart_akshaya/providers/service_reports_provider.dart';
import 'login_screen.dart';
import 'services/auth_service.dart';
import 'main_navigation_screen.dart';
import 'providers/new_entry_provider.dart';
import 'providers/staff_provider.dart';
import 'providers/services_provider.dart';
import 'providers/saved_bills_provider.dart';
import 'repositories/staff_repository.dart';
import 'repositories/services_repository.dart';
import 'providers/expenses_provider.dart';
import 'repositories/expenses_repository.dart';

import 'package:window_manager/window_manager.dart';
import 'package:provider/provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await windowManager.ensureInitialized();

  WindowOptions windowOptions = const WindowOptions(
    size: Size(1200, 800),
    minimumSize: Size(1000, 700),
    center: true,
    title: 'Smart Akshaya',
  );

  await windowManager.waitUntilReadyToShow(windowOptions, () async {
    await windowManager.show();
    await windowManager.focus();
  });

  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => NewEntryProvider()),
        ChangeNotifierProvider(
          create: (_) => StaffProvider(
            StaffRepository(AuthService().sheetsService, AuthService()),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => ServicesProvider(
            ServicesRepository(AuthService().sheetsService, AuthService()),
          ),
        ),
        ChangeNotifierProvider(create: (_) => SavedBillsProvider()),
        ChangeNotifierProvider(create: (_) => ServiceReportsProvider()),
        ChangeNotifierProvider(
          create: (_) => ExpensesProvider(
            ExpensesRepository(AuthService().sheetsService, AuthService()),
          ),
        ),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Smart Akshaya Login',
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        ),
        home: const InitialScreen(),
      ),
    );
  }
}

class InitialScreen extends StatefulWidget {
  const InitialScreen({super.key});

  @override
  State<InitialScreen> createState() => _InitialScreenState();
}

class _InitialScreenState extends State<InitialScreen> {
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _checkStatus();
  }

  void _checkStatus() async {
    bool loggedIn = await _authService.isLoggedIn();
    if (!mounted) return;

    if (loggedIn) {
      final dbPath = await _authService.getLocalDatabasePath();
      final session = await _authService.getSessionDetails();
      final role = session['role'] ?? 'staff';

      if (dbPath.isEmpty) {
        // If logged in but database path is empty, they need to see the onboarding.
        // The easiest way is to let the LoginScreen handle it since the logic is there.
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => MainNavigationScreen(userRole: role),
          ),
        );
      }
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1E3A8A)),
        ),
      ),
    );
  }
}
