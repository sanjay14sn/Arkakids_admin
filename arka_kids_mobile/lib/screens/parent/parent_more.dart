import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../login_screen.dart';
import 'parent_messages.dart';
import 'child_profile_screen.dart';
import 'parent_documents_screen.dart';
import 'parent_calendar_screen.dart';
import 'parent_gallery_screen.dart';
import 'parent_transport_screen.dart';

class ParentMoreScreen extends StatefulWidget {
  const ParentMoreScreen({super.key});

  @override
  State<ParentMoreScreen> createState() => _ParentMoreScreenState();
}

class _ParentMoreScreenState extends State<ParentMoreScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      appBar: AppBar(
        title: Text(
          'More & Services',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF6B0000), // Deep Maroon Red
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. CHILD SECTION
            _buildCategorySection(
              title: 'CHILD',
              items: [
                _MenuItemData(
                  icon: Icons.person_outline_rounded,
                  label: 'Profile',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ChildProfileScreen()),
                    );
                  },
                ),
                _MenuItemData(
                  icon: Icons.description_outlined,
                  label: 'Documents & Certificates',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ParentDocumentsScreen()),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),

            // 2. SCHOOL SECTION
            _buildCategorySection(
              title: 'SCHOOL',
              items: [
                _MenuItemData(
                  icon: Icons.calendar_today_rounded,
                  label: 'Calendar & Events',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ParentCalendarScreen()),
                    );
                  },
                ),
                _MenuItemData(
                  icon: Icons.photo_library_outlined,
                  label: 'Photo Gallery',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ParentGalleryScreen()),
                    );
                  },
                ),
                _MenuItemData(
                  icon: Icons.campaign_outlined,
                  label: 'Announcements',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ParentMessagesScreen()),
                    );
                  },
                ),
                _MenuItemData(
                  icon: Icons.directions_bus_outlined,
                  label: 'Transport Tracking',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ParentTransportScreen()),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),

            // 3. REQUESTS SECTION
            _buildCategorySection(
              title: 'REQUESTS',
              items: [
                _MenuItemData(
                  icon: Icons.event_busy_outlined,
                  label: 'Leave Request',
                  onTap: () => _showLeaveRequestDialog(context),
                ),
                _MenuItemData(
                  icon: Icons.headset_mic_outlined,
                  label: 'Support',
                  onTap: () => _showSupportSheet(context),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // 4. ACCOUNT SECTION
            _buildCategorySection(
              title: 'ACCOUNT',
              items: [
                _MenuItemData(
                  icon: Icons.settings_outlined,
                  label: 'Settings',
                  onTap: () => _showSettingsSheet(context),
                ),
                _MenuItemData(
                  icon: Icons.logout_rounded,
                  label: 'Logout',
                  iconColor: Colors.redAccent,
                  labelColor: Colors.redAccent,
                  onTap: () => _handleLogout(context),
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  // ----------------------------------------------------
  // CATEGORY CARD BUILDER (MATCHING SCREENSHOT)
  // ----------------------------------------------------
  Widget _buildCategorySection({
    required String title,
    required List<_MenuItemData> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category Header (Uppercase Bold Grey Text)
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF6B7280),
              letterSpacing: 0.6,
            ),
          ),
        ),

        // White Container Card
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFEFEFEF)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            separatorBuilder: (_, __) => Divider(
              height: 1,
              color: const Color(0xFFF3F4F6),
              indent: 60,
            ),
            itemBuilder: (context, index) {
              final item = items[index];
              return InkWell(
                onTap: item.onTap,
                borderRadius: BorderRadius.vertical(
                  top: index == 0 ? const Radius.circular(16) : Radius.zero,
                  bottom: index == items.length - 1 ? const Radius.circular(16) : Radius.zero,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      // Soft Peach Circular Icon Badge
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF0E6), // Light peach background
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Icon(
                            item.icon,
                            size: 20,
                            color: item.iconColor ?? const Color(0xFF8B4513), // Warm brown/terracotta
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),

                      // Label
                      Expanded(
                        child: Text(
                          item.label,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            color: item.labelColor ?? const Color(0xFF1F2937),
                          ),
                        ),
                      ),

                      // Right Chevron Arrow
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: Color(0xFF9CA3AF),
                        size: 20,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ----------------------------------------------------
  // INTERACTIVE ACTION MODALS & DIALOGS
  // ----------------------------------------------------

  void _showLeaveRequestDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Apply for Leave', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            TextField(
              decoration: InputDecoration(
                labelText: 'Leave Reason',
                hintText: 'e.g., Doctor appointment / Family function',
              ),
            ),
            SizedBox(height: 12),
            TextField(
              decoration: InputDecoration(
                labelText: 'Date(s)',
                hintText: 'e.g., 30 Aug 2026',
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
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Leave application submitted to class teacher!'),
                  backgroundColor: AppTheme.primary,
                ),
              );
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  void _showSupportSheet(BuildContext context) {
    _showSimpleBottomSheet(
      context,
      title: 'Helpdesk & Support',
      items: [
        '📞 Call Front Desk: +91 98000 12345',
        '✉️ Email Support: support@arkakids.com',
        '⏰ Hours: Mon–Sat (8:00 AM – 5:00 PM)',
      ],
    );
  }

  void _showSettingsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('App Settings', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.notifications_outlined),
              title: const Text('Push Notifications'),
              trailing: Switch(value: true, onChanged: (v) {}),
            ),
          ],
        ),
      ),
    );
  }

  void _handleLogout(BuildContext context) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();
    if (context.mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  void _showSimpleBottomSheet(BuildContext context, {required String title, required List<String> items}) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 14),
            ...items.map(
              (text) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF8B4513), size: 18),
                    const SizedBox(width: 10),
                    Expanded(child: Text(text, style: GoogleFonts.inter(fontSize: 14))),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuItemData {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? labelColor;

  _MenuItemData({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor,
    this.labelColor,
  });
}
