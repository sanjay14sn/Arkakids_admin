import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/parent/parent_dashboard.dart';
import 'screens/parent/parent_attendance.dart';
import 'screens/parent/parent_activities.dart';
import 'screens/parent/parent_fees.dart';
import 'screens/parent/parent_messages.dart';
import 'screens/parent/parent_more.dart';
import 'screens/teacher/teacher_attendance.dart';
import 'screens/teacher/teacher_journal_upload.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: const ArkaKidsApp(),
    ),
  );
}

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class ArkaKidsApp extends StatelessWidget {
  const ArkaKidsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Arka Kids Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      themeMode: ThemeMode.light,
      home: const InternetGate(child: SplashScreen()),
    );
  }
}

class InternetGate extends StatefulWidget {
  final Widget child;

  const InternetGate({super.key, required this.child});

  @override
  State<InternetGate> createState() => _InternetGateState();
}

class _InternetGateState extends State<InternetGate> {
  bool _checking = true;
  bool _online = false;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _checkInternet();
  }

  Future<bool> _hasInternet() async {
    try {
      final result = await InternetAddress.lookup('example.com')
          .timeout(const Duration(seconds: 8));
      return result.isNotEmpty && result.first.rawAddress.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  Future<void> _checkInternet() async {
    setState(() {
      _checking = true;
      _ready = false;
    });
    final online = await _hasInternet();
    if (!mounted) return;
    setState(() {
      _online = online;
      _checking = false;
    });
    if (!online) return;
    await Future<void>.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() => _ready = true);
  }

  @override
  Widget build(BuildContext context) {
    if (_ready) return widget.child;

    return Scaffold(
      backgroundColor: const Color(0xFFF3E6C8),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(26),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.16),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Icon(
                  _checking
                      ? Icons.wifi_find_rounded
                      : _online
                          ? Icons.wifi_rounded
                          : Icons.wifi_off_rounded,
                  color: const Color(0xFF5B0202),
                  size: 42,
                ),
              ),
              const SizedBox(height: 22),
              Text(
                _checking
                    ? 'Checking internet'
                    : _online
                        ? 'Internet is active'
                        : 'No internet',
                style: GoogleFonts.outfit(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF5B0202),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _checking
                    ? 'Please wait while we confirm your connection.'
                    : _online
                        ? 'Connected. Opening Arka Kids…'
                        : 'Turn on mobile data or Wi‑Fi, then try again.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF5B0202),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 28),
              if (_checking || _online)
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: Color(0xFF5B0202),
                    strokeWidth: 2.5,
                  ),
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _checkInternet,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF5B0202),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      'Try again',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  final List<Widget> _parentScreens = const [
    ParentDashboardScreen(),
    ParentAttendanceScreen(),
    ParentActivitiesScreen(),
    ParentFeesScreen(),
    ParentMoreScreen(),
  ];

  final List<Widget> _teacherScreens = const [
    TeacherAttendanceScreen(),
    ParentMessagesScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userRole = authProvider.userRole;

    if (userRole == 'trainer' || userRole == 'teacher') {
      return Scaffold(
        backgroundColor: Colors.transparent,
        extendBody: true,
        body: Stack(
          children: [
            _insetForFloatingNav(
              IndexedStack(
                index: _currentIndex < _teacherScreens.length ? _currentIndex : 0,
                children: _teacherScreens,
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: FloatingPillNavBar(
                currentIndex: _currentIndex < _teacherScreens.length ? _currentIndex : 0,
                onTap: (index) => setState(() => _currentIndex = index),
                items: const [
                  FloatingPillNavItem(icon: Icons.fact_check_rounded, label: 'Attendance'),
                  FloatingPillNavItem(icon: Icons.chat_bubble_outline_rounded, label: 'Messages'),
                ],
              ),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const TeacherJournalUploadScreen()),
            );
          },
          backgroundColor: AppTheme.primary,
          icon: const Icon(Icons.add_a_photo_rounded, color: Colors.white),
          label: const Text('Post Moment', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
      );
    }

    if (userRole == 'super_admin' || userRole == 'bde') {
      return Scaffold(
        appBar: AppBar(
          title: Text(userRole == 'super_admin' ? 'Super Admin Control Center' : 'Staff / BDE Portal'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout_rounded),
              onPressed: () async {
                await authProvider.logout();
                if (context.mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (route) => false,
                  );
                }
              },
            ),
          ],
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  userRole == 'super_admin' ? Icons.admin_panel_settings_rounded : Icons.badge_rounded,
                  size: 72,
                  color: AppTheme.primary,
                ),
                const SizedBox(height: 16),
                Text(
                  authProvider.user?.name ?? 'Admin Profile',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text(
                  'Active Role: ${userRole.toUpperCase()}',
                  style: const TextStyle(fontSize: 14, color: AppTheme.textSecondaryLight),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => authProvider.switchRole('student'),
                  icon: const Icon(Icons.swap_horiz_rounded),
                  label: const Text('Switch to Parent Portal View'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Default Parent / Student View
    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBody: true,
      body: Stack(
        children: [
          _insetForFloatingNav(
            IndexedStack(
              index: _currentIndex,
              children: _parentScreens,
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: FloatingPillNavBar(
              currentIndex: _currentIndex,
              onTap: (index) => setState(() => _currentIndex = index),
              items: const [
                FloatingPillNavItem(icon: Icons.auto_awesome_mosaic_rounded, label: 'Home'),
                FloatingPillNavItem(icon: Icons.calendar_month_rounded, label: 'Attendance'),
                FloatingPillNavItem(icon: Icons.assignment_rounded, label: 'Activities'),
                FloatingPillNavItem(icon: Icons.credit_card_rounded, label: 'Fees'),
                FloatingPillNavItem(icon: Icons.menu_rounded, label: 'More'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _insetForFloatingNav(Widget child) {
    final mq = MediaQuery.of(context);
    return MediaQuery(
      data: mq.copyWith(
        padding: mq.padding.copyWith(bottom: mq.padding.bottom + 84),
        viewPadding: mq.viewPadding.copyWith(bottom: mq.viewPadding.bottom + 84),
      ),
      child: child,
    );
  }
}

class FloatingPillNavItem {
  final IconData icon;
  final String label;

  const FloatingPillNavItem({required this.icon, required this.label});
}

class FloatingPillNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<FloatingPillNavItem> items;

  const FloatingPillNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Material(
      color: Colors.transparent,
      child: Padding(
      padding: EdgeInsets.fromLTRB(16, 8, 16, 10 + (bottom > 0 ? bottom * 0.35 : 8)),
      child: Container(
        height: 68,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF5B0202), Color(0xFF6B0000)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(40),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF5B0202).withValues(alpha: 0.28),
              blurRadius: 22,
              offset: const Offset(0, 10),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            for (var i = 0; i < items.length; i++)
              Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onTap(i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    curve: Curves.easeOut,
                    margin: const EdgeInsets.symmetric(horizontal: 5, vertical: 8),
                    decoration: BoxDecoration(
                      color: currentIndex == i
                          ? Colors.white.withValues(alpha: 0.22)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(items[i].icon, color: Colors.white, size: 22),
                        const SizedBox(height: 3),
                        Text(
                          items[i].label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: currentIndex == i ? FontWeight.w800 : FontWeight.w600,
                            height: 1.1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
      ),
    );
  }
}
