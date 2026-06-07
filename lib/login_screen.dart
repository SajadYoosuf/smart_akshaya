import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:file_picker/file_picker.dart';
import 'main_navigation_screen.dart';
import 'services/auth_service.dart';
import 'services/local_excel_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _checkAutoLogin();
  }

  void _checkAutoLogin() async {
    bool loggedIn = await _authService.isLoggedIn();
    if (loggedIn) {
      final dbPath = await _authService.getLocalDatabasePath();
      final session = await _authService.getSessionDetails();
      final role = session['role'] ?? 'staff';

      if (dbPath.isEmpty) {
        if (mounted) {
          _showOnboardingDialog(role: role);
        }
        return;
      }

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => MainNavigationScreen(userRole: role),
          ),
        );
      }
    }
  }

  void _showOnboardingDialog({String? role}) {
    showDialog(
      context: context,
      barrierDismissible: false, // Force onboarding configuration
      builder: (context) => OnboardingDialog(
        authService: _authService,
        userRole: role ?? 'staff',
        onCompleted: (selectedRole) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => MainNavigationScreen(userRole: selectedRole),
            ),
          );
        },
      ),
    );
  }

  void _handleLogin() async {
    String email = _emailController.text.trim();
    String password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter both email and password'),
          backgroundColor: Colors.orangeAccent,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await _authService.login(email, password);
      setState(() {
        _isLoading = false;
      });

      if (result['success'] == true) {
        final dbPath = await _authService.getLocalDatabasePath();
        if (dbPath.isEmpty) {
          if (mounted) {
            _showOnboardingDialog(role: result['role']);
          }
        } else {
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => MainNavigationScreen(userRole: result['role']),
              ),
            );
          }
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Invalid credentials'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Login error: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  void _showSpreadsheetSettings() async {
    final TextEditingController sheetIdController = TextEditingController();
    sheetIdController.text = await _authService.getSpreadsheetId();

    if (!mounted) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'Google Spreadsheet Settings',
          style: TextStyle(
            color: Color(0xFF1A237E),
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter your Google Spreadsheet ID. Share the sheet with this email as Editor:',
              style: TextStyle(fontSize: 12, color: Colors.black87),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const SelectableText(
                'smart-akshaya@smart-akshaya-498217.iam.gserviceaccount.com',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                  color: Color(0xFF1A237E),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: sheetIdController,
              decoration: const InputDecoration(
                labelText: 'Spreadsheet ID',
                hintText: 'e.g., 1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A237E),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              await _authService.setSpreadsheetId(sheetIdController.text.trim());
              if (mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Spreadsheet ID updated'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Modern Custom Painter Background
          Positioned.fill(child: CustomPaint(painter: BackgroundPainter())),

          // Glassmorphism effect overlay for the whole screen
          Positioned.fill(
            child: Container(color: Colors.black.withOpacity(0.05)),
          ),

          // Spreadsheet ID Configuration Gear
          Positioned(
            top: 16,
            right: 16,
            child: SafeArea(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.settings_rounded, color: Colors.white),
                  tooltip: 'Spreadsheet Configuration',
                  onPressed: _showSpreadsheetSettings,
                ),
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const _BrandLogo(),
                  const SizedBox(height: 24),
                  const Text(
                    'Smart Akshaya',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                      shadows: [
                        Shadow(
                          color: Colors.black26,
                          offset: Offset(0, 4),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                  ),

                  // Login Card
                  Container(
                    constraints: const BoxConstraints(maxWidth: 420),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 40,
                          offset: const Offset(0, 20),
                        ),
                      ],
                      border: Border.all(color: Colors.white.withOpacity(0.2)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Sign In',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF1A237E),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Please enter your credentials to continue',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.black54,
                            ),
                          ),
                          const SizedBox(height: 32),
                          _CustomTextField(
                            label: 'Email',
                            icon: Icons.email_rounded,
                            hintText: 'name@example.com',
                            keyboardType: TextInputType.emailAddress,
                            controller: _emailController,
                          ),
                          const SizedBox(height: 20),
                          _CustomTextField(
                            label: 'Password',
                            icon: Icons.lock_rounded,
                            hintText: '••••••••',
                            obscureText: true,
                            keyboardType: TextInputType.visiblePassword,
                            controller: _passwordController,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: Checkbox(
                                      value: false,
                                      onChanged: (v) {},
                                      activeColor: const Color(0xFF1A237E),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Remember me',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.black54,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              TextButton(
                                onPressed: () {},
                                style: TextButton.styleFrom(
                                  foregroundColor: const Color(0xFF1A237E),
                                ),
                                child: const Text(
                                  'Forgot Password?',
                                  style: TextStyle(fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF1A237E),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 18),
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            onPressed: _isLoading ? null : _handleLogin,
                            child: _isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text(
                                    'Login',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
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
}

class BackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();

    // Base Gradient
    final baseRect = Offset.zero & size;
    const baseGradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF0D47A1), Color(0xFF1976D2), Color(0xFF42A5F5)],
    );
    paint.shader = baseGradient.createShader(baseRect);
    canvas.drawRect(baseRect, paint);

    // Decorative Blobs
    paint.shader = null;

    // Top Left Blob
    final blob1Path = Path();
    blob1Path.moveTo(0, size.height * 0.3);
    blob1Path.quadraticBezierTo(
      size.width * 0.25,
      size.height * 0.2,
      size.width * 0.4,
      0,
    );
    blob1Path.lineTo(0, 0);
    blob1Path.close();
    paint.color = Colors.white.withOpacity(0.05);
    canvas.drawPath(blob1Path, paint);

    // Bottom Right Blob
    final blob2Path = Path();
    blob2Path.moveTo(size.width, size.height * 0.6);
    blob2Path.quadraticBezierTo(
      size.width * 0.7,
      size.height * 0.8,
      size.width * 0.5,
      size.height,
    );
    blob2Path.lineTo(size.width, size.height);
    blob2Path.close();
    paint.color = Colors.white.withOpacity(0.08);
    canvas.drawPath(blob2Path, paint);

    // Dynamic Circles
    _drawCircle(
      canvas,
      size,
      Offset(size.width * 0.1, size.height * 0.8),
      120,
      0.05,
    );
    _drawCircle(
      canvas,
      size,
      Offset(size.width * 0.9, size.height * 0.1),
      180,
      0.03,
    );
    _drawCircle(
      canvas,
      size,
      Offset(size.width * 0.5, size.height * 0.5),
      80,
      0.04,
    );
  }

  void _drawCircle(
    Canvas canvas,
    Size size,
    Offset center,
    double radius,
    double opacity,
  ) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(opacity)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 30);
    canvas.drawCircle(center, radius, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _BrandLogo extends StatelessWidget {
  const _BrandLogo();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Center(
        child: Container(
          width: 70,
          height: 70,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0D47A1), Color(0xFF1976D2)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Center(
            child: Text(
              'A',
              style: TextStyle(
                color: Colors.white,
                fontSize: 40,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CustomTextField extends StatelessWidget {
  final String label;
  final IconData icon;
  final String hintText;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextEditingController? controller;

  const _CustomTextField({
    required this.label,
    required this.icon,
    required this.hintText,
    this.obscureText = false,
    this.keyboardType,
    this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A237E),
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            suffixIcon: Icon(icon, color: const Color(0xFF1A237E), size: 20),
            hintText: hintText,
            hintStyle: const TextStyle(color: Colors.black26),
            filled: true,
            fillColor: Colors.grey.shade100,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 20,
              vertical: 18,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFF1A237E), width: 2),
            ),
          ),
        ),
      ],
    );
  }
}

class OnboardingDialog extends StatefulWidget {
  final AuthService authService;
  final String userRole;
  final Function(String) onCompleted;

  const OnboardingDialog({
    super.key,
    required this.authService,
    required this.userRole,
    required this.onCompleted,
  });

  @override
  State<OnboardingDialog> createState() => _OnboardingDialogState();
}

class _OnboardingDialogState extends State<OnboardingDialog> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final int _numPages = 3;

  String _selectedPreset = 'c_drive'; // 'c_drive', 'documents', 'custom'
  final TextEditingController _pathController = TextEditingController();
  
  String _documentsPath = '';
  bool _isLoading = false;
  String? _validationError;

  @override
  void initState() {
    super.initState();
    _pathController.text = 'C:\\SmartAkshaya';
    _loadDocumentsPath();
  }

  Future<void> _loadDocumentsPath() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      setState(() {
        _documentsPath = dir.path.replaceAll('/', '\\');
      });
    } catch (e) {
      print('Error getting documents directory: $e');
    }
  }

  void _onPresetChanged(String preset) {
    setState(() {
      _selectedPreset = preset;
      if (preset == 'c_drive') {
        _pathController.text = 'C:\\SmartAkshaya';
      } else if (preset == 'documents') {
        if (_documentsPath.isNotEmpty) {
          _pathController.text = '$_documentsPath\\SmartAkshaya';
        } else {
          _pathController.text = 'SmartAkshaya';
        }
      } else {
        // Leave as is, user can edit
      }
    });
  }

  Future<void> _openNativeDirectoryPicker() async {
    try {
      final String? selectedDirectory = await FilePicker.getDirectoryPath(
        dialogTitle: 'Select Excel Storage Directory',
      );
      if (selectedDirectory != null) {
        setState(() {
          _selectedPreset = 'custom';
          _pathController.text = selectedDirectory.replaceAll('/', '\\');
          _validationError = null;
        });
      }
    } catch (e) {
      print('Error picking directory: $e');
      setState(() {
        _validationError = 'Failed to open native file explorer: $e';
      });
    }
  }

  Future<void> _handleSave() async {
    final path = _pathController.text.trim();
    if (path.isEmpty) {
      setState(() {
        _validationError = 'Please specify a folder path.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _validationError = null;
    });

    try {
      // Test if path is writeable and directory can be created
      await LocalExcelService().testPathWriteable(path);
      
      // Save path
      await widget.authService.setLocalDatabasePath(path);
      
      // Load/sync database details immediately
      await widget.authService.refreshStaffCache();
      
      if (mounted) {
        Navigator.pop(context);
        widget.onCompleted(widget.userRole);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Local Excel database initialized in: $path'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _validationError = 'Unable to write to this folder: $e\nMake sure the path is valid and you have permissions.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // Prevent Android back button dismiss
      child: AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        contentPadding: EdgeInsets.zero,
        content: SizedBox(
          width: 550,
          height: 600,
          child: Column(
            children: [
              // Header Banner
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.storage_rounded, color: Colors.white, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'Database Setup & Onboarding',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Smart Akshaya Configuration Assistant',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              
              // Slide View
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(), // Force navigation via buttons
                  onPageChanged: (page) {
                    setState(() {
                      _currentPage = page;
                      _validationError = null;
                    });
                  },
                  children: [
                    _buildSlide1(),
                    _buildSlide2(),
                    _buildSlide3(),
                  ],
                ),
              ),
              
              const Divider(height: 1),
              
              // Navigation Footer
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Back Button
                    TextButton(
                      onPressed: _currentPage == 0
                          ? null
                          : () {
                              _pageController.previousPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            },
                      child: Text(
                        'Back',
                        style: TextStyle(
                          color: _currentPage == 0 ? Colors.grey : const Color(0xFF1A237E),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    
                    // Dots indicator
                    Row(
                      children: List.generate(
                        _numPages,
                        (index) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _currentPage == index
                                ? const Color(0xFF1A237E)
                                : Colors.grey.shade300,
                          ),
                        ),
                      ),
                    ),
                    
                    // Next / Action Button
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A237E),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: _isLoading
                          ? null
                          : () {
                              if (_currentPage < _numPages - 1) {
                                _pageController.nextPage(
                                  duration: const Duration(milliseconds: 300),
                                  curve: Curves.easeInOut,
                                );
                              } else {
                                _handleSave();
                              }
                            },
                      child: _isLoading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              _currentPage == _numPages - 1 ? 'Save & Start' : 'Next',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSlide1() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: Color(0xFFE8EAF6),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.offline_bolt_rounded,
            size: 64,
            color: Color(0xFF1A237E),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Offline-First Architecture',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1A237E),
          ),
        ),
        const SizedBox(height: 12),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            'Smart Akshaya is built to run 100% offline. Every action—managing staff, adding services, or tracking wallets—is written directly to a local Excel file on this machine first.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              height: 1.5,
              color: Color(0xFF475569),
            ),
          ),
        ),
        const SizedBox(height: 12),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            'Enjoy instant load times and zero dependency on active internet.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF0F172A),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSlide2() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: Color(0xFFE8F5E9),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.table_chart_rounded,
            size: 64,
            color: Colors.green,
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'Your Local Excel Database',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1A237E),
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'smart_akshaya_db.xlsx',
          style: TextStyle(
            fontFamily: 'monospace',
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.green,
          ),
        ),
        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40),
          child: Column(
            children: [
              _buildFeatureRow(
                Icons.storage_rounded,
                'Full Data Storage',
                'Stores staff details, master services, fees, and wallets locally.',
              ),
              const SizedBox(height: 12),
              _buildFeatureRow(
                Icons.warning_amber_rounded,
                'Important Safety Notice',
                'Do not rename, relocate, or manually edit this Excel sheet. Let the application manage it.',
              ),
              const SizedBox(height: 12),
              _buildFeatureRow(
                Icons.sync_rounded,
                'Automatic Sync to Google Sheets',
                'All your changes automatically backup and sync to the cloud spreadsheet when online.',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFeatureRow(IconData icon, String title, String subtitle) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: const Color(0xFF1A237E)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF475569),
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSlide3() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'നമുക്ക് എക്സൽ ഫയലുകൾ സൂക്ഷിക്കണം',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A237E),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'ഉപയോക്താവ് ഫയൽ എക്സ്പ്ലോറർ തുറന്ന് അവർക്ക് താല്പര്യമുള്ള സ്ഥലം തിരഞ്ഞെടുക്കേണ്ടതുണ്ട്.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 16),
          
          // Preset Cards
          _buildPresetCard(
            id: 'c_drive',
            title: 'Local Disk C: (Recommended)',
            subtitle: 'C:\\SmartAkshaya (Fast, reliable and easy to find)',
            icon: Icons.computer_rounded,
          ),
          const SizedBox(height: 8),
          _buildPresetCard(
            id: 'documents',
            title: 'My Documents Folder',
            subtitle: _documentsPath.isNotEmpty 
              ? '$_documentsPath\\SmartAkshaya'
              : 'Loading Documents path...',
            icon: Icons.folder_rounded,
          ),
          const SizedBox(height: 8),
          _buildPresetCard(
            id: 'custom',
            title: 'Custom Location Path',
            subtitle: 'Enter a custom path manually below',
            icon: Icons.edit_location_alt_rounded,
          ),
          
          const SizedBox(height: 12),
          
          // Custom input text field with Browse suffix icon
          TextField(
            controller: _pathController,
            enabled: _selectedPreset == 'custom',
            style: const TextStyle(fontSize: 12),
            decoration: InputDecoration(
              labelText: 'Excel Storage Folder Path',
              hintText: 'e.g. C:\\Users\\Name\\Desktop',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              prefixIcon: const Icon(Icons.folder_open_rounded, size: 20),
              suffixIcon: IconButton(
                icon: const Icon(Icons.folder_open_rounded, color: Color(0xFF1A237E)),
                tooltip: 'Select Directory via Windows Explorer',
                onPressed: _openNativeDirectoryPicker,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
          
          // Error Display
          if (_validationError != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.error_outline_rounded, color: Colors.red.shade700, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _validationError!,
                      style: TextStyle(
                        color: Colors.red.shade800,
                        fontSize: 10,
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPresetCard({
    required String id,
    required String title,
    required String subtitle,
    required IconData icon,
  }) {
    final isSelected = _selectedPreset == id;
    return InkWell(
      onTap: () => _onPresetChanged(id),
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE8EAF6) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF1A237E) : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(0xFF1A237E) : Colors.grey.shade600,
              size: 24,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: isSelected ? const Color(0xFF1A237E) : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 10,
                      color: isSelected ? const Color(0xFF3F51B5) : Colors.grey.shade600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? const Color(0xFF1A237E) : Colors.grey.shade400,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Color(0xFF1A237E),
                          shape: BoxShape.circle,
                        ),
                      ),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
