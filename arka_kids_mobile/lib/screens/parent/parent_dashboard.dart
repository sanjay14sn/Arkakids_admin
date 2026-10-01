import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../login_screen.dart';
import 'child_profile_screen.dart';
import 'parent_search_screen.dart';

class _StoryMoment {
  final String label;
  final String time;
  final String imagePath;
  final Color cardBg;
  final Color ringColor;
  final IconData badge;
  final Color badgeColor;

  const _StoryMoment({
    required this.label,
    required this.time,
    required this.imagePath,
    required this.cardBg,
    required this.ringColor,
    required this.badge,
    required this.badgeColor,
  });
}

class _NoticeItem {
  final String title;
  final String subtitle;
  final _NoticeType type;
  final String timeAgo;
  const _NoticeItem({
    required this.title,
    required this.subtitle,
    required this.type,
    required this.timeAgo,
  });
}

enum _NoticeType { urgent, info, event }


class ParentDashboardScreen extends StatefulWidget {
  const ParentDashboardScreen({super.key});

  @override
  State<ParentDashboardScreen> createState() => _ParentDashboardScreenState();
}

class _ParentDashboardScreenState extends State<ParentDashboardScreen>
    with SingleTickerProviderStateMixin {
  late final PageController _noticeController;
  int _noticeIndex = 0;

  final List<_StoryMoment> _moments = const [
    _StoryMoment(
      label: 'Play Time',
      time: 'now',
      imagePath: 'assets/icons/story_playtime.png',
      cardBg: Color(0xFFFFF3E0),
      ringColor: Color(0xFFFB923C),
      badge: Icons.toys_rounded,
      badgeColor: Color(0xFFFB923C),
    ),
    _StoryMoment(
      label: 'Art & Craft',
      time: '10 min',
      imagePath: 'assets/icons/story_artcraft.png',
      cardBg: Color(0xFFF3E8FF),
      ringColor: Color(0xFF9333EA),
      badge: Icons.palette_rounded,
      badgeColor: Color(0xFF9333EA),
    ),
    _StoryMoment(
      label: 'Music',
      time: '25 min',
      imagePath: 'assets/icons/story_playtime.png',
      cardBg: Color(0xFFE0F2FE),
      ringColor: Color(0xFF0EA5E9),
      badge: Icons.music_note_rounded,
      badgeColor: Color(0xFF0EA5E9),
    ),
    _StoryMoment(
      label: 'Outdoor',
      time: '1 hr',
      imagePath: 'assets/icons/story_outdoor.png',
      cardBg: Color(0xFFDCFCE7),
      ringColor: Color(0xFF10B981),
      badge: Icons.sports_soccer_rounded,
      badgeColor: Color(0xFF10B981),
    ),
    _StoryMoment(
      label: 'Story Time',
      time: '2 hr',
      imagePath: 'assets/icons/story_artcraft.png',
      cardBg: Color(0xFFFCE7F3),
      ringColor: Color(0xFFDB2777),
      badge: Icons.menu_book_rounded,
      badgeColor: Color(0xFFDB2777),
    ),
  ];

  final List<_NoticeItem> _notices = const [
    _NoticeItem(
      title: 'Rain Holiday Tomorrow',
      subtitle: 'School will remain closed on 28 Aug due to heavy rainfall advisory.',
      type: _NoticeType.urgent,
      timeAgo: '30 min ago',
    ),
    _NoticeItem(
      title: 'Annual Day – Dress Code',
      subtitle: 'Children should wear the white & blue costume for Annual Day on Sep 10.',
      type: _NoticeType.event,
      timeAgo: '2 hr ago',
    ),
    _NoticeItem(
      title: 'PTM Scheduled – Sep 15',
      subtitle: 'Parent-Teacher Meeting on 15 Sep, 10 AM – 1 PM. Slot booking is now open.',
      type: _NoticeType.info,
      timeAgo: 'Yesterday',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _noticeController = PageController();
  }

  @override
  void dispose() {
    _noticeController.dispose();
    super.dispose();
  }

  // ─────────────────────────────────────────────────────────
  //  BUILD
  // ─────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF6B0000),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header + end-to-end white section ──
            _buildHeaderBlock(context),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  HEADER BLOCK (maroon bg + white floating section)
  // ─────────────────────────────────────────────────────────
  Widget _buildHeaderBlock(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF6B0000), Color(0xFF8B0000)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          // ── Top header content ──
          Padding(
            padding: EdgeInsets.only(
                top: top + 12, left: 18, right: 18, bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Row: avatar + name + action icons
                Row(
                  children: [
                    // Child photo circle
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.6),
                            width: 2),
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/icons/child_avatar.png',
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: const Color(0xFFFB923C),
                            child: const Icon(Icons.child_care_rounded,
                                color: Colors.white, size: 26),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Arjun Sharma',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    // Search
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const ParentSearchScreen(),
                          ),
                        );
                      },
                      child: _headerIconBtn(Icons.search_rounded),
                    ),
                    const SizedBox(width: 8),
                    // Bell with badge
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        _headerIconBtn(Icons.notifications_outlined),
                        Positioned(
                          right: -2,
                          top: -2,
                          child: Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(
                              color: Color(0xFFEF4444),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 8),
                    // Logout/scan icon
                    PopupMenuButton<String>(
                      onSelected: (val) async {
                        if (val == 'logout') {
                          final auth = Provider.of<AuthProvider>(context,
                              listen: false);
                          await auth.logout();
                          if (context.mounted) {
                            Navigator.of(context).pushAndRemoveUntil(
                              MaterialPageRoute(
                                  builder: (_) => const LoginScreen()),
                              (r) => false,
                            );
                          }
                        }
                      },
                      itemBuilder: (_) => [
                        const PopupMenuItem(
                          value: 'logout',
                          child: Row(
                            children: [
                              Icon(Icons.logout_rounded,
                                  color: Colors.redAccent, size: 18),
                              SizedBox(width: 10),
                              Text('Logout',
                                  style:
                                      TextStyle(color: Colors.redAccent)),
                            ],
                          ),
                        ),
                      ],
                      child: _headerIconBtn(Icons.crop_free_rounded),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ── White end-to-end section covering full dashboard ──
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Today's Moments
                _buildMomentsRow(),

                // Child profile card
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  child: _buildChildCard(context),
                ),

                // Padded rest of content
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildNoticeBoard(),
                      const SizedBox(height: 24),
                      _buildTodayCareSection(),
                      const SizedBox(height: 24),
                      _buildSectionHeader("Today's Activities", showSeeAll: false),
                      const SizedBox(height: 12),
                      _buildActivitiesList(),
                      const SizedBox(height: 24),
                      _buildSectionHeader('Homework', showSeeAll: true),
                      const SizedBox(height: 12),
                      _buildHomeworkCard(),
                      const SizedBox(height: 24),
                      _buildFeesDueBanner(),
                      const SizedBox(height: 36),
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

  Widget _headerIconBtn(IconData icon) {
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: Colors.white, size: 20),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  TODAY'S MOMENTS
  // ─────────────────────────────────────────────────────────
  Widget _buildMomentsRow() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Today's Moments",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF111827),
                  letterSpacing: -0.3,
                ),
              ),
              Row(
                children: [
                  GestureDetector(
                    onTap: () => _showAddMomentBottomSheet(context),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF8B0000).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(
                          color: const Color(0xFF8B0000).withValues(alpha: 0.2),
                        ),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.add_rounded,
                              size: 14, color: Color(0xFF8B0000)),
                          SizedBox(width: 2),
                          Text(
                            'Add',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF8B0000),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: () {},
                    child: Row(
                      children: const [
                        Text('See all',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF8B0000),
                            )),
                        SizedBox(width: 2),
                        Icon(Icons.chevron_right_rounded,
                            size: 16, color: Color(0xFF8B0000)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        SizedBox(
          height: 122,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: _moments.length + 1,
            itemBuilder: (_, i) {
              if (i == 0) {
                return _buildAddMomentCard(context);
              }
              return _buildMomentCard(_moments[i - 1], i - 1);
            },
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _buildAddMomentCard(BuildContext context) {
    return GestureDetector(
      onTap: () => _showAddMomentBottomSheet(context),
      child: Container(
        width: 76,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFFFF1F2),
                    border: Border.all(
                      color: const Color(0xFF8B0000).withValues(alpha: 0.4),
                      width: 2,
                    ),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.add_a_photo_rounded,
                      color: Color(0xFF8B0000),
                      size: 24,
                    ),
                  ),
                ),
                Positioned(
                  right: -1,
                  bottom: -1,
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B0000),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                    child: const Icon(
                      Icons.add_rounded,
                      color: Colors.white,
                      size: 13,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Add New',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFF8B0000),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 1),
            const Text(
              'Moment',
              style: TextStyle(
                fontSize: 10,
                color: Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddMomentBottomSheet(BuildContext context) {
    final titleController = TextEditingController();
    String selectedCategory = 'Play Time';
    final categories = ['Play Time', 'Art & Craft', 'Outdoor', 'Meal Time', 'Nap Time'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            top: 20,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "Add Today's Moment",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF111827),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close_rounded),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Opening camera / gallery picker...'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                child: Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFFE5E7EB),
                      width: 1.5,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.cloud_upload_rounded,
                          size: 36, color: Color(0xFF8B0000)),
                      SizedBox(height: 8),
                      Text(
                        'Tap to Upload Photo or Video',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF374151),
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'JPG, PNG, MP4 up to 25MB',
                        style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Moment Caption',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF374151),
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: titleController,
                decoration: InputDecoration(
                  hintText: 'e.g. Building block tower with friends!',
                  hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
                  filled: true,
                  fillColor: const Color(0xFFF9FAFB),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF8B0000)),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Category',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF374151),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: categories.map((cat) {
                  final isSelected = selectedCategory == cat;
                  return ChoiceChip(
                    label: Text(cat),
                    selected: isSelected,
                    selectedColor: const Color(0xFF8B0000),
                    backgroundColor: const Color(0xFFF3F4F6),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF374151),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                    onSelected: (val) {
                      setModalState(() {
                        selectedCategory = cat;
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text("Today's moment posted successfully! 🎉"),
                        backgroundColor: Color(0xFF10B981),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B0000),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Publish Moment',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
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

  Widget _buildMomentCard(_StoryMoment m, int index) {
    return GestureDetector(
      onTap: () {
        showDialog(
          context: context,
          barrierDismissible: true,
          builder: (context) => _StoryMomentViewerDialog(
            moments: _moments,
            initialIndex: index,
          ),
        );
      },
      child: Container(
        width: 76,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Photo circle with ring + badge
            Stack(
              clipBehavior: Clip.none,
              children: [
                // Ring
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: m.ringColor, width: 2.5),
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      m.imagePath,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: const Color(0xFFF3F4F6),
                        child: Icon(m.badge,
                            color: m.badgeColor, size: 24),
                      ),
                    ),
                  ),
                ),
                // Badge
                Positioned(
                  right: -1,
                  bottom: -1,
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: m.badgeColor,
                      shape: BoxShape.circle,
                      border:
                          Border.all(color: Colors.white, width: 1.5),
                    ),
                    child: Icon(m.badge,
                        color: Colors.white, size: 10),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              m.label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFF111827),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 1),
            Text(
              m.time,
              style: const TextStyle(
                fontSize: 10,
                color: Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  CHILD PROFILE CARD
  // ─────────────────────────────────────────────────────────
  Widget _buildChildCard(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const ChildProfileScreen()),
      ),
      child: Stack(
        alignment: Alignment.topCenter,
        clipBehavior: Clip.none,
        children: [
          // ── Tab / notch that protrudes above the card ──
          Positioned(
            top: 0,
            child: Container(
              width: 60,
              height: 22,
              decoration: const BoxDecoration(
                color: Color(0xFF8B0000),
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
              ),
              child: Center(
                child: Container(
                  width: 28,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
              ),
            ),
          ),

          // ── Main card body (shifted down so tab sits above it) ──
          Container(
            margin: const EdgeInsets.only(top: 16),
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF8B0000), Color(0xFF6B0000)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF8B0000).withValues(alpha: 0.30),
                  blurRadius: 22,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    // Avatar
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.8),
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/icons/child_avatar.png',
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: const Color(0xFFFB923C),
                            child: const Icon(Icons.child_care_rounded,
                                color: Colors.white, size: 30),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text(
                                'Arjun Sharma',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.2,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981),
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: const Text(
                                  'CHECKED IN',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          const Text(
                            'Sunflower Class · Roll #07',
                            style: TextStyle(
                                color: Colors.white60, fontSize: 12.5),
                          ),
                          const SizedBox(height: 5),
                          Row(
                            children: const [
                              Icon(Icons.access_time_rounded,
                                  color: Colors.white54, size: 13),
                              SizedBox(width: 4),
                              Text(
                                'In: 8:42 AM  ·  😊  Happy',
                                style: TextStyle(
                                    color: Colors.white60, fontSize: 12),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded,
                        color: Colors.white38, size: 22),
                  ],
                ),
                const SizedBox(height: 14),
                Divider(
                    color: Colors.white.withValues(alpha: 0.15), height: 1),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: const BoxDecoration(
                            color: Color(0xFF10B981),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.check_rounded,
                              color: Colors.white, size: 16),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Present today',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        _weekPill('M', const Color(0xFF10B981)),
                        const SizedBox(width: 5),
                        _weekPill('T', const Color(0xFFEF4444)),
                        const SizedBox(width: 5),
                        _weekPill('W', const Color(0xFF10B981)),
                        const SizedBox(width: 5),
                        _weekPill('T', Colors.white24),
                        const SizedBox(width: 5),
                        _weekPill('F', Colors.white24),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }


  Widget _weekPill(String letter, Color bg) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      child: Center(
        child: Text(letter,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold)),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  NOTICEBOARD
  // ─────────────────────────────────────────────────────────
  Widget _buildNoticeBoard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 4,
                  height: 16,
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B0000),
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'School Notices',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF111827),
                    letterSpacing: -0.3,
                  ),
                ),
              ],
            ),
            GestureDetector(
              onTap: () {},
              child: const Text(
                'All notices',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF8B0000),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 116,
          child: PageView.builder(
            controller: _noticeController,
            itemCount: _notices.length,
            onPageChanged: (i) => setState(() => _noticeIndex = i),
            itemBuilder: (_, i) => _buildNoticeCard(_notices[i]),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _notices.length,
            (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _noticeIndex == i ? 20 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _noticeIndex == i
                    ? const Color(0xFF8B0000)
                    : const Color(0xFFD1D5DB),
                borderRadius: BorderRadius.circular(100),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNoticeCard(_NoticeItem n) {
    final cfg = _noticeConfig(n.type);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 1),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: cfg.borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: cfg.shadowColor.withValues(alpha: 0.08),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: cfg.accentColor.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  cfg.label,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: cfg.accentColor,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
              Text(
                n.timeAgo,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF9CA3AF),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            n.title,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 14,
              color: Color(0xFF111827),
              letterSpacing: -0.2,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 3),
          Text(
            n.subtitle,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF4B5563),
              height: 1.35,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  _NoticeCfg _noticeConfig(_NoticeType t) {
    switch (t) {
      case _NoticeType.urgent:
        return const _NoticeCfg(
          accentColor: Color(0xFFDC2626),
          borderColor: Color(0xFFFECACA),
          shadowColor: Color(0xFFDC2626),
          label: 'URGENT NOTICE',
        );
      case _NoticeType.event:
        return const _NoticeCfg(
          accentColor: Color(0xFF7C3AED),
          borderColor: Color(0xFFE9D5FF),
          shadowColor: Color(0xFF7C3AED),
          label: 'SCHOOL EVENT',
        );
      case _NoticeType.info:
        return const _NoticeCfg(
          accentColor: Color(0xFF0284C7),
          borderColor: Color(0xFFBAE6FD),
          shadowColor: Color(0xFF0284C7),
          label: 'ANNOUNCEMENT',
        );
    }
  }

  // ─────────────────────────────────────────────────────────
  //  SECTION HEADER
  // ─────────────────────────────────────────────────────────
  Widget _buildSectionHeader(String title, {bool showSeeAll = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Color(0xFF111827),
            letterSpacing: -0.2,
          ),
        ),
        if (showSeeAll)
          GestureDetector(
            onTap: () {},
            child: const Text(
              'See all',
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF8B0000)),
            ),
          ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────
  //  TODAY'S CARE SECTION
  // ─────────────────────────────────────────────────────────
  Widget _buildTodayCareSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader("Today's Care", showSeeAll: true),
        const SizedBox(height: 12),
        _buildCareGrid(),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────
  //  TODAY'S CARE GRID
  // ─────────────────────────────────────────────────────────
  Widget _buildCareGrid() {
    final cardWidth = MediaQuery.of(context).size.width * 0.75;

    return SizedBox(
      height: 200,
      child: ListView(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        padding: const EdgeInsets.symmetric(horizontal: 2),
        children: [
          // ── MEALS CARD (75% Screen Width) ──
          SizedBox(
            width: cardWidth,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFFFF6ED),
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF8B0000),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Icons.restaurant_rounded,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: const [
                                    Text(
                                      'Meals',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF3B0A0A),
                                        letterSpacing: -0.3,
                                      ),
                                    ),
                                    SizedBox(height: 1),
                                    Text(
                                      "Today's Menu",
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                        color: Color(0xFF8C746E),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          // White container
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  _buildMealItemRow('Breakfast', 'Idli Sambar', isDone: true),
                                  const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 4),
                                    child: Divider(
                                      height: 1,
                                      color: Color(0xFFF3F4F6),
                                    ),
                                  ),
                                  _buildMealItemRow('Lunch', 'Dal Rice', isDone: true),
                                  const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 4),
                                    child: Divider(
                                      height: 1,
                                      color: Color(0xFFF3F4F6),
                                    ),
                                  ),
                                  _buildMealItemRow('Evening', 'Pending', isDone: false),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Food Image (Larger size)
                    Positioned(
                      top: 6,
                      right: 10,
                      child: Image.asset(
                        'assets/icons/food.png',
                        width: 72,
                        height: 60,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.fastfood_rounded,
                          size: 38,
                          color: Color(0xFFF97316),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(width: 14),

          // ── NAP CARD (75% Screen Width) ──
          SizedBox(
            width: cardWidth,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFFFEFF1),
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: const Color(0xFF8B0000),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.nightlight_round,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  Text(
                                    'Nap',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF4A0A0A),
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  SizedBox(height: 1),
                                  Text(
                                    'Sleep Time',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF8C7474),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // White container
                        Expanded(
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 30,
                                      height: 30,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFFFE4E6),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.access_time_rounded,
                                        color: Color(0xFFBE123C),
                                        size: 16,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: const [
                                        Text(
                                          '1h 15m',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w800,
                                            color: Color(0xFF7F1D1D),
                                            letterSpacing: -0.3,
                                          ),
                                        ),
                                        Text(
                                          '12:00 – 1:15 PM',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: Color(0xFF9CA3AF),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFE4E6),
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: const Text(
                                    'Good rest 👍',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF9F1239),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Nap Image
                  Positioned(
                    top: 8,
                    right: 10,
                    child: Image.asset(
                      'assets/icons/nap.png',
                      width: 56,
                      height: 50,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.king_bed_rounded,
                        size: 32,
                        color: Color(0xFFBE123C),
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

  Widget _buildMealItemRow(String meal, String detail, {required bool isDone}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          meal,
          style: const TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            color: Color(0xFF4B5563),
          ),
        ),
        const SizedBox(width: 4),
        Expanded(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Icon(
                isDone ? Icons.check_circle_rounded : Icons.circle_outlined,
                color: isDone ? const Color(0xFF10B981) : const Color(0xFFD1D5DB),
                size: 14,
              ),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  detail,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: isDone ? FontWeight.bold : FontWeight.w500,
                    color: isDone ? const Color(0xFF10B981) : const Color(0xFF9CA3AF),
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────
  //  TODAY'S ACTIVITIES
  // ─────────────────────────────────────────────────────────
  Widget _buildActivitiesList() {
    final activities = [
      {'icon': Icons.wb_sunny_rounded, 'iconBg': const Color(0xFFFFF7ED), 'iconColor': const Color(0xFFD97706), 'name': 'Morning Circle Time', 'time': '9:00 AM', 'done': true},
      {'icon': Icons.palette_rounded, 'iconBg': const Color(0xFFFFF0F5), 'iconColor': const Color(0xFFDB2777), 'name': 'Art & Craft – Drawing', 'time': '9:30 AM', 'done': true},
      {'icon': Icons.menu_book_rounded, 'iconBg': const Color(0xFFE0F2FE), 'iconColor': const Color(0xFF0284C7), 'name': 'Story Time', 'time': '10:15 AM', 'done': true},
      {'icon': Icons.sports_soccer_rounded, 'iconBg': const Color(0xFFDCFCE7), 'iconColor': const Color(0xFF16A34A), 'name': 'Outdoor Play', 'time': '11:00 AM', 'done': true},
      {'icon': Icons.music_note_rounded, 'iconBg': const Color(0xFFF3E8FF), 'iconColor': const Color(0xFF9333EA), 'name': 'Music & Rhymes', 'time': '2:00 PM', 'done': false},
      {'icon': Icons.record_voice_over_rounded, 'iconBg': const Color(0xFFFDE8E8), 'iconColor': const Color(0xFFDC2626), 'name': 'Show & Tell', 'time': '2:45 PM', 'done': false},
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.035),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: activities.length,
        separatorBuilder: (_, __) =>
            Divider(height: 1, color: Colors.grey.shade100),
        itemBuilder: (_, i) {
          final item = activities[i];
          final isDone = item['done'] == true;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                      color: item['iconBg'] as Color,
                      borderRadius: BorderRadius.circular(10)),
                  child: Center(
                      child: Icon(item['icon'] as IconData,
                          color: item['iconColor'] as Color, size: 19)),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['name'].toString(),
                          style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13.5,
                              color: isDone
                                  ? const Color(0xFF1F2937)
                                  : const Color(0xFF6B7280))),
                      const SizedBox(height: 2),
                      Text(item['time'].toString(),
                          style: const TextStyle(
                              fontSize: 12, color: Color(0xFF9CA3AF))),
                    ],
                  ),
                ),
                Icon(
                  isDone
                      ? Icons.check_circle_rounded
                      : Icons.radio_button_unchecked_rounded,
                  color: isDone
                      ? const Color(0xFF10B981)
                      : const Color(0xFFD1D5DB),
                  size: 20,
                ),
              ],
            ),
          );
        },
      ),
    );
  }



  // ─────────────────────────────────────────────────────────
  //  HOMEWORK
  // ─────────────────────────────────────────────────────────
  Widget _buildHomeworkCard() {
    final hw = [
      {'subject': 'English', 'icon': Icons.edit_note_rounded, 'iconBg': const Color(0xFFFDE8E8), 'iconColor': const Color(0xFFDC2626), 'task': 'Write 5 sentences about My Family', 'due': 'Due: Tomorrow', 'dueColor': const Color(0xFFEA580C)},
      {'subject': 'Maths', 'icon': Icons.calculate_rounded, 'iconBg': const Color(0xFFE0F2FE), 'iconColor': const Color(0xFF0284C7), 'task': 'Practice counting 1–50 with objects', 'due': 'Due: Tomorrow', 'dueColor': const Color(0xFFEA580C)},
      {'subject': 'EVS', 'icon': Icons.eco_rounded, 'iconBg': const Color(0xFFDCFCE7), 'iconColor': const Color(0xFF16A34A), 'task': 'Draw & label 3 fruits from home', 'due': 'Due: Fri, 29 Aug', 'dueColor': const Color(0xFF6B7280)},
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.035),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: hw.length,
        separatorBuilder: (_, __) =>
            Divider(height: 1, color: Colors.grey.shade100),
        itemBuilder: (_, i) {
          final item = hw[i];
          return Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                      color: item['iconBg'] as Color,
                      borderRadius: BorderRadius.circular(10)),
                  child: Center(
                      child: Icon(item['icon'] as IconData,
                          color: item['iconColor'] as Color, size: 20)),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(item['subject'].toString(),
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13.5,
                                  color: Color(0xFF8B0000))),
                          Text(item['due'].toString(),
                              style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: item['dueColor'] as Color)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(item['task'].toString(),
                          style: const TextStyle(
                              fontSize: 13, color: Color(0xFF374151))),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  FEES DUE BANNER
  // ─────────────────────────────────────────────────────────
  Widget _buildFeesDueBanner() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF6B0000), Color(0xFF8B0000)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF8B0000).withValues(alpha: 0.3),
            blurRadius: 18,
            offset: const Offset(0, 7),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  Icon(Icons.receipt_long_rounded,
                      color: Colors.white60, size: 15),
                  SizedBox(width: 6),
                  Text('FEES DUE',
                      style: TextStyle(
                          color: Colors.white60,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1)),
                ],
              ),
              const SizedBox(height: 6),
              const Text('₹12,500',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.5)),
              const SizedBox(height: 3),
              const Text('September 2026 · Due by Sep 5',
                  style: TextStyle(color: Colors.white60, fontSize: 12)),
            ],
          ),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Redirecting to Payment Gateway…'),
                    backgroundColor: AppTheme.success),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF8B0000),
              padding:
                  const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(100)),
              elevation: 0,
            ),
            child: const Text('Pay Now',
                style: TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 14)),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────
class _NoticeCfg {
  final Color accentColor;
  final Color borderColor;
  final Color shadowColor;
  final String label;
  const _NoticeCfg({
    required this.accentColor,
    required this.borderColor,
    required this.shadowColor,
    required this.label,
  });
}

// ─────────────────────────────────────────────────────────
//  SWIPEABLE STORY MOMENT VIEWER DIALOG WITH 15S SEGMENTED LOADER
// ─────────────────────────────────────────────────────────
class _StoryMomentViewerDialog extends StatefulWidget {
  final List<_StoryMoment> moments;
  final int initialIndex;

  const _StoryMomentViewerDialog({
    required this.moments,
    this.initialIndex = 0,
  });

  @override
  State<_StoryMomentViewerDialog> createState() => _StoryMomentViewerDialogState();
}

class _StoryMomentViewerDialogState extends State<_StoryMomentViewerDialog>
    with SingleTickerProviderStateMixin {
  late PageController _pageController;
  late AnimationController _animController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 15),
    );

    _animController.addListener(() {
      if (mounted) {
        setState(() {});
      }
    });

    _animController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _onNextStory();
      }
    });

    _startTimer();
  }

  void _startTimer() {
    _animController.stop();
    _animController.reset();
    _animController.forward();
  }

  void _onNextStory() {
    if (_currentIndex < widget.moments.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      if (mounted && Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }
    }
  }

  void _onPreviousStory() {
    if (_currentIndex > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _startTimer();
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentMoment = widget.moments[_currentIndex];

    return Dialog.fullscreen(
      backgroundColor: Colors.black,
      child: SafeArea(
        child: Stack(
          children: [
            // PageView for swipeable moments transition
            GestureDetector(
              onTapUp: (details) {
                final screenWidth = MediaQuery.of(context).size.width;
                if (details.globalPosition.dx > screenWidth * 0.65) {
                  _onNextStory();
                } else if (details.globalPosition.dx < screenWidth * 0.35) {
                  _onPreviousStory();
                }
              },
              child: PageView.builder(
                controller: _pageController,
                itemCount: widget.moments.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentIndex = index;
                  });
                  _startTimer();
                },
                itemBuilder: (context, i) {
                  final m = widget.moments[i];
                  return Center(
                    child: Image.asset(
                      m.imagePath,
                      fit: BoxFit.contain,
                      width: double.infinity,
                      height: double.infinity,
                      errorBuilder: (_, __, ___) => Container(
                        color: m.cardBg,
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(m.badge, size: 80, color: m.badgeColor),
                            const SizedBox(height: 16),
                            Text(
                              m.label,
                              style: TextStyle(
                                color: m.badgeColor,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Top Header: Segmented 15-second Loader Bars & Moment Info
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.black87, Colors.transparent],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Segmented Top Progress Indicators
                    Row(
                      children: List.generate(widget.moments.length, (idx) {
                        double progress = 0.0;
                        if (idx < _currentIndex) {
                          progress = 1.0;
                        } else if (idx == _currentIndex) {
                          progress = _animController.value;
                        } else {
                          progress = 0.0;
                        }
                        return Expanded(
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: progress,
                                backgroundColor: Colors.white.withValues(alpha: 0.3),
                                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                                minHeight: 4,
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: currentMoment.badgeColor,
                          ),
                          child: Icon(currentMoment.badge, color: Colors.white, size: 18),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                currentMoment.label,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                              Text(
                                'Arjun Sharma • ${currentMoment.time}',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.75),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, color: Colors.white, size: 26),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Bottom Caption Overlay
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: IgnorePointer(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.transparent, Colors.black87],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: currentMoment.badgeColor,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          "Moment ${_currentIndex + 1} of ${widget.moments.length}",
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Captured during ${currentMoment.label} session today at school! 🌟',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
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
    );
  }
}
