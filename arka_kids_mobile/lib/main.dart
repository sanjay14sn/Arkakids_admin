import 'package:flutter/material.dart';
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

class ArkaKidsApp extends StatelessWidget {
  const ArkaKidsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Arka Kids Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      themeMode: ThemeMode.light,
      home: const SplashScreen(),
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
        body: IndexedStack(
          index: _currentIndex < _teacherScreens.length ? _currentIndex : 0,
          children: _teacherScreens,
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
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex < _teacherScreens.length ? _currentIndex : 0,
          onTap: (index) => setState(() => _currentIndex = index),
          selectedItemColor: AppTheme.primary,
          unselectedItemColor: AppTheme.textSecondaryLight,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.fact_check_rounded),
              label: 'Attendance',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.chat_bubble_outline_rounded),
              label: 'Messages',
            ),
          ],
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
      body: IndexedStack(
        index: _currentIndex,
        children: _parentScreens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 10,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppTheme.primary,
          unselectedItemColor: AppTheme.textSecondaryLight,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_awesome_mosaic_rounded),
              label: 'Journal',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.calendar_month_rounded),
              label: 'Attendance',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment_rounded),
              label: 'Activities',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.credit_card_rounded),
              label: 'Fees',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.grid_view_rounded),
              label: 'More',
            ),
          ],
        ),
      ),
    );
  }
}
