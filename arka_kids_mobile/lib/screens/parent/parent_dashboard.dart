import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/attendance_model.dart';
import '../../theme/app_theme.dart';
import '../login_screen.dart';
import 'child_profile_screen.dart';
import 'parent_search_screen.dart';
import 'package:shimmer/shimmer.dart';
import '../../models/homework_model.dart';
import '../../models/journal_model.dart';
import 'all_notices_screen.dart';
import 'parent_activities.dart';
import 'parent_fees.dart';
import 'parent_gallery_screen.dart';

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

  List<_StoryMoment> _moments = [];
  List<_NoticeItem> _notices = [];
  bool _isNoticesLoading = true;

  List<HomeworkModel> _homeworks = [];
  bool _isHomeworkLoading = true;
  double _feesDue = 0;
  String _feesDueLabel = '';
  double _attendancePct = 0;

  @override
  void initState() {
    super.initState();
    _noticeController = PageController();

    // Fetch attendance after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchDashboardData();
    });
  }

  List<AttendanceRecordModel>? _weekAttendance;
  List<dynamic> _meals = [];
  List<dynamic> _naps = [];
  bool _isLoadingAttendance = true;

  Future<void> _fetchDashboardData() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final token = auth.token;
    final user = auth.user;
    if (token == null || user == null) {
      if (mounted) {
        setState(() {
          _isLoadingAttendance = false;
          _isNoticesLoading = false;
          _isHomeworkLoading = false;
        });
      }
      return;
    }

    final studentId = user.id;
    final now = DateTime.now();
    final nowStr =
        "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";

    String dayKey(dynamic value) {
      final text = value?.toString() ?? '';
      if (text.length >= 10) return text.substring(0, 10);
      return text;
    }

    bool isToday(dynamic item) {
      if (item is! Map) return false;
      final date = dayKey(item['date']);
      final created = dayKey(item['createdAt']);
      return date == nowStr || created == nowStr;
    }

    try {
      final results = await Future.wait([
        ApiService.getAttendance(
          token,
          studentId,
          childName: user.childName ?? user.name,
        ),
        ApiService.getJournalFeed(token, className: user.className),
        ApiService.getHomework(
          token,
          className: user.className,
          studentId: studentId,
        ),
        ApiService.getNotices(token),
        ApiService.getCareLogs(token, studentId, 'meal'),
        ApiService.getCareLogs(token, studentId, 'nap'),
        ApiService.getStudent(token, studentId),
      ]);

      final records = results[0] as List<AttendanceRecordModel>;
      final journals = results[1] as List<JournalModel>;
      final homeworksData = results[2] as List<HomeworkModel>;
      final noticesData = results[3] as List<Map<String, dynamic>>;
      final mealsData = results[4] as List<dynamic>;
      final napsData = results[5] as List<dynamic>;
      final student = results[6] as Map<String, dynamic>?;

      final fetchedNotices = noticesData.map((n) {
        _NoticeType nType = _NoticeType.info;
        if (n['type'] == 'urgent') nType = _NoticeType.urgent;
        if (n['type'] == 'event') nType = _NoticeType.event;
        return _NoticeItem(
          title: n['title'] ?? '',
          subtitle: n['subtitle'] ?? '',
          type: nType,
          timeAgo: n['timeAgo'] ?? '',
        );
      }).toList();

      final todayJournals = journals.where((j) {
        final local = j.createdAt.toLocal();
        final isCreatedToday =
            local.year == now.year &&
            local.month == now.month &&
            local.day == now.day;
        return isCreatedToday || j.date == nowStr;
      });
      final momentSource = todayJournals.isNotEmpty
          ? todayJournals
          : journals.take(8);

      final fetchedMoments = <_StoryMoment>[];
      for (final j in momentSource) {
        IconData badgeIcon = Icons.photo;
        Color bg = const Color(0xFFFFF3E0);
        Color ring = const Color(0xFF5B0202);
        final tag = j.tags.isNotEmpty
            ? j.tags.first.toLowerCase()
            : j.category.toLowerCase();

        if (tag.contains('learn') || tag.contains('circle')) {
          bg = const Color(0xFFE0F2FE);
          ring = const Color(0xFF0EA5E9);
          badgeIcon = Icons.menu_book_rounded;
        } else if (tag.contains('play') || tag.contains('outdoor')) {
          bg = const Color(0xFFDCFCE7);
          ring = const Color(0xFF10B981);
          badgeIcon = Icons.sports_soccer_rounded;
        } else if (tag.contains('art') || tag.contains('snack')) {
          bg = const Color(0xFFF3E8FF);
          ring = const Color(0xFF9333EA);
          badgeIcon = Icons.palette_rounded;
        }

        final genericTitle =
            j.title == 'Classroom Update' ||
            j.title == 'Daily Moment' ||
            j.title.isEmpty;
        final label = genericTitle
            ? (j.tags.isNotEmpty
                  ? j.tags.first
                  : (j.description.isNotEmpty
                        ? j.description.split(' ').take(2).join(' ')
                        : 'Moment'))
            : j.title.split(' ').take(2).join(' ');
        final urls = j.photos.isNotEmpty
            ? j.photos
            : (j.imageUrl.isNotEmpty
                  ? [j.imageUrl]
                  : ['assets/icons/story_playtime.png']);
        for (final url in urls) {
          fetchedMoments.add(
            _StoryMoment(
              label: label,
              time: ApiService.timeAgo(j.createdAt),
              imagePath: url,
              cardBg: bg,
              ringColor: ring,
              badge: badgeIcon,
              badgeColor: ring,
            ),
          );
        }
      }

      int presentCount = 0;
      int loggedCount = 0;
      for (final record in records) {
        final status = record.status.toLowerCase();
        if (status == 'holiday') continue;
        loggedCount++;
        if (status == 'present' || status == 'late') presentCount++;
      }

      if (student != null && auth.user != null) {
        String? pick(List<String> keys) {
          for (final key in keys) {
            final value = student[key]?.toString().trim();
            if (value != null && value.isNotEmpty && value != '-') return value;
          }
          return null;
        }

        final roll = pick([
          'rollNumber',
          'rollNo',
          'studentCode',
          'admissionNo',
        ]);
        final className = pick(['className']);
        final childName = pick(['childName', 'name']);
        if (roll != null || className != null || childName != null) {
          await auth.patchUser(
            auth.user!.copyWith(
              rollNumber: roll,
              className: className,
              childName: childName,
            ),
          );
        }
      }

      final fees = student?['fees'];
      final total =
          (fees is Map ? fees['feesTotal'] as num? : null)?.toDouble() ?? 0;
      final paid =
          (fees is Map ? fees['feesPaid'] as num? : null)?.toDouble() ?? 0;
      final due = (total - paid) < 0 ? 0.0 : total - paid;
      final dueDateRaw = fees is Map ? fees['nextDueDate']?.toString() : null;
      DateTime? dueDate = dueDateRaw != null
          ? DateTime.tryParse(dueDateRaw)
          : null;

      if (!mounted) return;
      setState(() {
        _weekAttendance = records;
        _attendancePct = loggedCount == 0 ? 0 : presentCount / loggedCount;
        _moments = fetchedMoments;
        _meals = mealsData.where(isToday).toList();
        _naps = napsData.where(isToday).toList();
        _notices = fetchedNotices.take(8).toList();
        _homeworks = homeworksData.take(4).toList();
        _feesDue = due;
        _feesDueLabel = dueDate != null
            ? 'Due by ${dueDate.day}/${dueDate.month}/${dueDate.year}'
            : (due > 0 ? 'Outstanding balance' : 'No dues');
        _isNoticesLoading = false;
        _isHomeworkLoading = false;
        _isLoadingAttendance = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingAttendance = false;
        _isNoticesLoading = false;
        _isHomeworkLoading = false;
      });
    }
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
      backgroundColor: Colors.white,
      body: Column(
        children: [
          _buildFixedAppBar(context),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchDashboardData,
              color: const Color(0xFF8B0000),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: _buildScrollBody(context),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFixedAppBar(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      color: const Color(0xFF5B0202),
      padding: EdgeInsets.only(top: top + 12, left: 18, right: 18, bottom: 12),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.gold, width: 1.6),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ClipOval(
              child: Padding(
                padding: const EdgeInsets.all(4.0),
                child: Image.asset(
                  'assets/icons/app_icon.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'ARKA KIDS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
            ),
          ),
          GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ParentSearchScreen()),
              );
            },
            child: _headerIconBtn(Icons.search_rounded),
          ),
          const SizedBox(width: 8),
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
          PopupMenuButton<String>(
            onSelected: (val) async {
              if (val == 'logout') {
                final auth = Provider.of<AuthProvider>(context, listen: false);
                await auth.logout();
                if (context.mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
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
                    Icon(
                      Icons.logout_rounded,
                      color: Colors.redAccent,
                      size: 18,
                    ),
                    SizedBox(width: 10),
                    Text('Logout', style: TextStyle(color: Colors.redAccent)),
                  ],
                ),
              ),
            ],
            child: _headerIconBtn(Icons.crop_free_rounded),
          ),
        ],
      ),
    );
  }

  Widget _buildScrollBody(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildMomentsRow(),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
            child: _buildChildCard(context),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildTodayCareSection(),
                const SizedBox(height: 24),
                _buildNoticeBoard(),
                const SizedBox(height: 24),
                _buildSectionHeader(
                  'Homework',
                  showSeeAll: true,
                  count: _isHomeworkLoading ? null : _homeworks.length,
                ),
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
    );
  }

  Widget _headerIconBtn(IconData icon) {
    return Container(
      width: 38,
      height: 38,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: const Color(0xFF5B0202), size: 20),
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
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ParentGalleryScreen(),
                        ),
                      );
                    },
                    child: Row(
                      children: const [
                        Text(
                          'See all',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.goldDark,
                          ),
                        ),
                        SizedBox(width: 2),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 16,
                          color: AppTheme.goldDark,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        SizedBox(
          height: 72,
          child: _moments.isEmpty
              ? Container(
                  margin: const EdgeInsets.symmetric(horizontal: 18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(
                            0xFF8B0000,
                          ).withValues(alpha: 0.06),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(
                              0xFF8B0000,
                            ).withValues(alpha: 0.15),
                          ),
                        ),
                        child: const Icon(
                          Icons.filter_hdr_rounded,
                          color: Color(0xFF8B0000),
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'No moments today yet',
                            style: TextStyle(
                              color: Color(0xFF374151),
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.2,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Check back later for updates!',
                            style: TextStyle(
                              color: Color(0xFF6B7280),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _moments.length,
                  itemBuilder: (_, i) {
                    return _buildMomentCard(_moments[i], i);
                  },
                ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _buildMomentCard(_StoryMoment m, int index) {
    return GestureDetector(
      onTap: () {
        showDialog(
          context: context,
          barrierDismissible: true,
          builder: (context) =>
              _StoryMomentViewerDialog(moments: _moments, initialIndex: index),
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
                    child: m.imagePath.startsWith('http')
                        ? Image.network(
                            m.imagePath,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              color: const Color(0xFFF3F4F6),
                              child: Icon(
                                m.badge,
                                color: m.badgeColor,
                                size: 24,
                              ),
                            ),
                          )
                        : m.imagePath.isEmpty
                        ? Container(
                            color: const Color(0xFFF3F4F6),
                            child: Icon(m.badge, color: m.badgeColor, size: 24),
                          )
                        : Image.asset(
                            m.imagePath,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              color: const Color(0xFFF3F4F6),
                              child: Icon(
                                m.badge,
                                color: m.badgeColor,
                                size: 24,
                              ),
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
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                    child: Icon(m.badge, color: Colors.white, size: 10),
                  ),
                ),
              ],
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
    final auth = Provider.of<AuthProvider>(context);
    final childName = auth.user?.childName ?? auth.user?.name ?? 'Student';

    AttendanceRecordModel? todayRecord;
    final nowStr =
        "${DateTime.now().year}-${DateTime.now().month.toString().padLeft(2, '0')}-${DateTime.now().day.toString().padLeft(2, '0')}";
    final nowStrAlt =
        "${DateTime.now().day.toString().padLeft(2, '0')}-${DateTime.now().month.toString().padLeft(2, '0')}-${DateTime.now().year}";
    if (_weekAttendance != null) {
      try {
        todayRecord = _weekAttendance!.firstWhere(
          (element) => element.date == nowStr || element.date == nowStrAlt,
        );
      } catch (_) {}
    }

    bool isPresent =
        todayRecord?.status.toLowerCase() == 'present' ||
        todayRecord?.status.toLowerCase() == 'late';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 2, bottom: 12),
          child: Text(
            "My place",
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF111827),
              letterSpacing: -0.3,
            ),
          ),
        ),
        GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ChildProfileScreen()),
          ),
          child: Stack(
            alignment: Alignment.topCenter,
            clipBehavior: Clip.none,
            children: [
              // ── Main card body ──
              Container(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF5B0202), Color(0xFF6B0000)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  image: const DecorationImage(
                    image: AssetImage('assets/icons/toodle.png'),
                    fit: BoxFit.cover,
                    colorFilter: ColorFilter.mode(
                      Color(0xFF5B0202),
                      BlendMode.lighten,
                    ),
                    opacity: 0.15,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF5B0202).withValues(alpha: 0.30),
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
                            child:
                                auth.user?.avatar != null &&
                                    auth.user!.avatar!.startsWith('http')
                                ? Image.network(
                                    auth.user!.avatar!,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(
                                      color: const Color(0xFFFB923C),
                                      child: const Icon(
                                        Icons.child_care_rounded,
                                        color: Colors.white,
                                        size: 30,
                                      ),
                                    ),
                                  )
                                : Image.asset(
                                    'assets/icons/child_avatar.png',
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(
                                      color: const Color(0xFFFB923C),
                                      child: const Icon(
                                        Icons.child_care_rounded,
                                        color: Colors.white,
                                        size: 30,
                                      ),
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
                                  Text(
                                    childName,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 18.5,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  if (_isLoadingAttendance)
                                    const SizedBox(
                                      width: 12,
                                      height: 12,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  else if (isPresent)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF10B981),
                                        borderRadius: BorderRadius.circular(
                                          100,
                                        ),
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
                                    )
                                  else if (todayRecord?.status.toLowerCase() ==
                                      'absent')
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEF4444),
                                        borderRadius: BorderRadius.circular(
                                          100,
                                        ),
                                      ),
                                      child: const Text(
                                        'ABSENT',
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
                              Text(
                                '${auth.user?.className ?? "Class"} · Roll #${auth.user?.rollNumber != null && auth.user!.rollNumber!.isNotEmpty ? auth.user!.rollNumber : "-"}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.location_on_rounded,
                                    color: Colors.white70,
                                    size: 12,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    auth.user?.tenantId?.replaceAll(
                                          'ARKA KIDS ',
                                          '',
                                        ) ??
                                        'Arka Kids',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 5),
                              if (!_isLoadingAttendance &&
                                  todayRecord != null &&
                                  isPresent)
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.access_time_rounded,
                                      color: Colors.white,
                                      size: 13,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'In: ${todayRecord.checkInTime ?? "-"}  ·  😊  Happy',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                        ),
                        Stack(
                          alignment: Alignment.center,
                          children: [
                            SizedBox(
                              width: 44,
                              height: 44,
                              child: CircularProgressIndicator(
                                value: _attendancePct,
                                strokeWidth: 4,
                                backgroundColor: Colors.white.withValues(
                                  alpha: 0.15,
                                ),
                                valueColor: const AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            ),
                            Text(
                              _isLoadingAttendance
                                  ? '…'
                                  : '${(_attendancePct * 100).round()}%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Divider(
                      color: Colors.white.withValues(alpha: 0.15),
                      height: 1,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: isPresent
                                      ? const Color(0xFF10B981)
                                      : Colors.white24,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  isPresent
                                      ? Icons.check_rounded
                                      : Icons.info_outline,
                                  color: Colors.white,
                                  size: 16,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  isPresent
                                      ? 'Present today'
                                      : (todayRecord?.status == 'absent'
                                            ? 'Absent today'
                                            : 'No logs'),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),

                        Row(
                          children: [
                            _weekPill('M', _getWeekColor(1)),
                            const SizedBox(width: 5),
                            _weekPill('T', _getWeekColor(2)),
                            const SizedBox(width: 5),
                            _weekPill('W', _getWeekColor(3)),
                            const SizedBox(width: 5),
                            _weekPill('T', _getWeekColor(4)),
                            const SizedBox(width: 5),
                            _weekPill('F', _getWeekColor(5)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Color _getWeekColor(int weekday) {
    if (_isLoadingAttendance || _weekAttendance == null) return Colors.white;
    // Calculate date for this weekday of current week
    final now = DateTime.now();
    final diff = weekday - now.weekday;
    final targetDate = now.add(Duration(days: diff));
    final targetStr =
        "${targetDate.year}-${targetDate.month.toString().padLeft(2, '0')}-${targetDate.day.toString().padLeft(2, '0')}";
    final targetStrAlt =
        "${targetDate.day.toString().padLeft(2, '0')}-${targetDate.month.toString().padLeft(2, '0')}-${targetDate.year}";

    try {
      final record = _weekAttendance!.firstWhere(
        (element) => element.date == targetStr || element.date == targetStrAlt,
      );
      if (record.status.toLowerCase() == 'present' ||
          record.status.toLowerCase() == 'late') {
        return const Color(0xFF10B981);
      } else if (record.status.toLowerCase() == 'leave') {
        return const Color(0xFFE8A317);
      } else if (record.status.toLowerCase() == 'absent') {
        return const Color(0xFFEF4444);
      }
    } catch (_) {}
    return Colors.white; // Default to white
  }

  Widget _weekPill(String letter, Color bg) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      child: Center(
        child: Text(
          letter,
          style: TextStyle(
            color: bg == Colors.white ? const Color(0xFF5B0202) : Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  NOTICEBOARD
  // ─────────────────────────────────────────────────────────
  Widget _buildNoticeBoard() {
    if (_isNoticesLoading) {
      return Shimmer.fromColors(
        baseColor: const Color(0xFFF3E6C8),
        highlightColor: const Color(0xFFFFFBF2),
        child: Container(
          height: 196,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFFBF2), Color(0xFFFFF6E5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFF0D48A), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: AppTheme.gold.withValues(alpha: 0.14),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFF5B0202),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.gold, width: 1.4),
                ),
                child: const Icon(
                  Icons.campaign_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'School Notices',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF111827),
                        letterSpacing: -0.3,
                      ),
                    ),
                    Text(
                      'Updates from school',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF9A7B3C),
                      ),
                    ),
                  ],
                ),
              ),
              if (_notices.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.gold,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    '${_notices.length}',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _openAllNotices,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(100),
                    border: Border.all(color: const Color(0xFFF0D48A)),
                  ),
                  child: const Text(
                    'See all',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.goldDark,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (_notices.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Column(
                children: [
                  Icon(
                    Icons.notifications_none_rounded,
                    color: Color(0xFFD6B56A),
                    size: 28,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'No notices right now',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF374151),
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'School updates will appear here',
                    style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                  ),
                ],
              ),
            )
          else ...[
            SizedBox(
              height: 132,
              child: PageView.builder(
                controller: _noticeController,
                itemCount: _notices.length,
                onPageChanged: (i) => setState(() => _noticeIndex = i),
                itemBuilder: (_, i) => _buildNoticeCard(_notices[i]),
              ),
            ),
            if (_notices.length > 1) ...[
              const SizedBox(height: 12),
              SizedBox(
                height: 6,
                width: double.infinity,
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _notices.length,
                      (i) => AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: _noticeIndex == i ? 18 : 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: _noticeIndex == i
                              ? AppTheme.gold
                              : const Color(0xFFE8D5A3),
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  void _openAllNotices() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const AllNoticesScreen()),
    );
  }

  Widget _buildNoticeCard(_NoticeItem n) {
    final cfg = _noticeConfig(n.type);
    return GestureDetector(
      onTap: _openAllNotices,
      child: Container(
        margin: const EdgeInsets.only(right: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: cfg.borderColor, width: 1),
          boxShadow: [
            BoxShadow(
              color: cfg.shadowColor.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Row(
            children: [
              Container(width: 5, color: cfg.accentColor),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: cfg.wash,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              cfg.icon,
                              size: 15,
                              color: cfg.accentColor,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: cfg.wash,
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Text(
                              cfg.label,
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                color: cfg.accentColor,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            n.timeAgo,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF9CA3AF),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
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
                      const SizedBox(height: 4),
                      Expanded(
                        child: Text(
                          n.subtitle,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280),
                            height: 1.35,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
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
          wash: Color(0xFFFEF2F2),
          label: 'URGENT',
          icon: Icons.priority_high_rounded,
        );
      case _NoticeType.event:
        return const _NoticeCfg(
          accentColor: AppTheme.goldDark,
          borderColor: Color(0xFFF0D48A),
          shadowColor: AppTheme.gold,
          wash: AppTheme.goldLight,
          label: 'EVENT',
          icon: Icons.celebration_rounded,
        );
      case _NoticeType.info:
        return const _NoticeCfg(
          accentColor: Color(0xFF5B0202),
          borderColor: Color(0xFFE8C9B8),
          shadowColor: Color(0xFF5B0202),
          wash: Color(0xFFFFF6E5),
          label: 'NOTICE',
          icon: Icons.campaign_rounded,
        );
    }
  }

  // ─────────────────────────────────────────────────────────
  //  SECTION HEADER
  // ─────────────────────────────────────────────────────────
  Widget _buildSectionHeader(
    String title, {
    bool showSeeAll = false,
    VoidCallback? onSeeAll,
    int? count,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 4,
              height: 16,
              decoration: BoxDecoration(
                color: AppTheme.gold,
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF111827),
                letterSpacing: -0.2,
              ),
            ),
            if (count != null && count > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.gold,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  '$count',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ],
        ),
        if (showSeeAll)
          GestureDetector(
            onTap:
                onSeeAll ??
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const ParentActivitiesScreen(),
                    ),
                  );
                },
            child: const Text(
              'See all',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.goldDark,
              ),
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
        _buildSectionHeader("Today's Care"),
        const SizedBox(height: 12),
        _buildCareGrid(),
      ],
    );
  }

  Widget _buildCareGrid() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: _buildMealsCareCard()),
        const SizedBox(width: 12),
        Expanded(child: _buildNapCareCard()),
      ],
    );
  }

  Widget _buildMealsCareCard() {
    final hasMeals = _meals.isNotEmpty;
    final latest = hasMeals ? _meals.last : null;
    final mealName = latest?['meal']?.toString().trim() ?? '';
    final items = latest?['items']?.toString().trim() ?? '';
    final served = latest != null && latest['eaten'] != 'Refused';

    return GestureDetector(
      onTap: _showMealsBottomSheet,
      child: Container(
        height: 208,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFFFBF2), AppTheme.goldLight],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFF0D48A), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: AppTheme.gold.withValues(alpha: 0.16),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.gold,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.restaurant_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Meals',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF111827),
                        ),
                      ),
                      Text(
                        "Today's menu",
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF9A7B3C),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: AppTheme.goldDark,
                  size: 20,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: hasMeals
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  mealName.isEmpty ? 'Meal logged' : mealName,
                                  style: const TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF111827),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: served
                                      ? const Color(0xFFDCFCE7)
                                      : AppTheme.goldLight,
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: Text(
                                  served ? 'Served' : 'Logged',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: served
                                        ? const Color(0xFF15803D)
                                        : AppTheme.goldDark,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (items.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              items,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF6B7280),
                                height: 1.35,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                          const Spacer(),
                          Text(
                            '${_meals.length} ${_meals.length == 1 ? 'entry' : 'entries'} today',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.goldDark,
                            ),
                          ),
                        ],
                      )
                    : const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.no_meals_outlined,
                              color: Color(0xFFD6B56A),
                              size: 22,
                            ),
                            SizedBox(height: 6),
                            Text(
                              'No meals logged yet',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Tap to view menu',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF9CA3AF),
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

  Widget _buildNapCareCard() {
    final hasNap = _naps.isNotEmpty;
    final latest = hasNap ? _naps.last : null;
    final start = latest?['start']?.toString().trim() ?? '';
    final end = latest?['end']?.toString().trim() ?? '';
    final quality = latest?['quality']?.toString() ?? 'Good rest';
    final skipped = quality == 'Skipped';
    final window = start.isEmpty && end.isEmpty
        ? 'Logged'
        : end.isEmpty
        ? start
        : '$start – $end';

    return GestureDetector(
      onTap: _showNapBottomSheet,
      child: Container(
        height: 208,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFFF8F6), Color(0xFFF8EDE8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFE8C9B8), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF5B0202).withValues(alpha: 0.08),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF5B0202),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.gold, width: 1.4),
                  ),
                  child: const Icon(
                    Icons.nightlight_round,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Nap',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF111827),
                        ),
                      ),
                      Text(
                        'Sleep time',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF9A7B3C),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: AppTheme.goldDark,
                  size: 20,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: hasNap
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            window,
                            style: const TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF111827),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: skipped
                                  ? const Color(0xFFFEE2E2)
                                  : AppTheme.goldLight,
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Text(
                              skipped ? 'Skipped' : quality,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: skipped
                                    ? const Color(0xFFB91C1C)
                                    : AppTheme.goldDark,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '${_naps.length} ${_naps.length == 1 ? 'entry' : 'entries'} today',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.goldDark,
                            ),
                          ),
                        ],
                      )
                    : const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.bedtime_outlined,
                              color: Color(0xFFC4A07A),
                              size: 22,
                            ),
                            SizedBox(height: 6),
                            Text(
                              'No nap logged yet',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Tap to view rest log',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF9CA3AF),
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

  void _showMealsBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final maxH = MediaQuery.of(context).size.height * 0.78;
        return SafeArea(
          child: Container(
            constraints: BoxConstraints(maxHeight: maxH),
            decoration: const BoxDecoration(
              color: Color(0xFFFFFCF7),
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 10),
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8D5A3),
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppTheme.gold,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.restaurant_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Today's Menu",
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF111827),
                                letterSpacing: -0.3,
                              ),
                            ),
                            Text(
                              'Meals logged at school',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF9A7B3C),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (_meals.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.gold,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            '${_meals.length}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Color(0xFFF0D48A)),
                if (_meals.isEmpty)
                  const Padding(
                    padding: EdgeInsets.fromLTRB(24, 36, 24, 48),
                    child: Column(
                      children: [
                        Icon(
                          Icons.no_meals_outlined,
                          color: Color(0xFFD6B56A),
                          size: 42,
                        ),
                        SizedBox(height: 12),
                        Text(
                          'No meals logged yet',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF374151),
                          ),
                        ),
                        SizedBox(height: 6),
                        Text(
                          'Today’s menu will show up here once the teacher logs a meal.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.4,
                            color: Color(0xFF9CA3AF),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  ConstrainedBox(
                    constraints: BoxConstraints(maxHeight: maxH - 140),
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                      shrinkWrap: true,
                      itemCount: _meals.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final m = _meals[i];
                        return _buildMealItemRow(
                          m['meal']?.toString() ?? '',
                          m['items']?.toString() ?? '',
                          isDone: m['eaten'] != 'Refused',
                          time:
                              m['time']?.toString() ??
                              m['servedAt']?.toString(),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showNapBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final maxH = MediaQuery.of(context).size.height * 0.78;
        return SafeArea(
          child: Container(
            constraints: BoxConstraints(maxHeight: maxH),
            decoration: const BoxDecoration(
              color: Color(0xFFFFF8F6),
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 10),
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8C9B8),
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFF5B0202),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.gold, width: 1.4),
                        ),
                        child: const Icon(
                          Icons.nightlight_round,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Nap Log',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF111827),
                                letterSpacing: -0.3,
                              ),
                            ),
                            Text(
                              'Rest time at school',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF9A7B3C),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (_naps.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.gold,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            '${_naps.length}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Color(0xFFE8C9B8)),
                if (_naps.isEmpty)
                  const Padding(
                    padding: EdgeInsets.fromLTRB(24, 36, 24, 48),
                    child: Column(
                      children: [
                        Icon(
                          Icons.bedtime_outlined,
                          color: Color(0xFFC4A07A),
                          size: 42,
                        ),
                        SizedBox(height: 12),
                        Text(
                          'No nap logged yet',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF374151),
                          ),
                        ),
                        SizedBox(height: 6),
                        Text(
                          'Rest time will show up here once the teacher logs a nap.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.4,
                            color: Color(0xFF9CA3AF),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  ConstrainedBox(
                    constraints: BoxConstraints(maxHeight: maxH - 140),
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                      shrinkWrap: true,
                      itemCount: _naps.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => _buildNapItemRow(_naps[i]),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildNapItemRow(dynamic nap) {
    final map = nap is Map
        ? Map<String, dynamic>.from(nap)
        : <String, dynamic>{};
    final start = map['start']?.toString().trim() ?? '';
    final end = map['end']?.toString().trim() ?? '';
    final quality = map['quality']?.toString() ?? 'Good rest';
    final skipped = quality == 'Skipped';
    final window = start.isEmpty && end.isEmpty
        ? 'Nap logged'
        : end.isEmpty
        ? start
        : '$start – $end';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE8C9B8)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF5B0202).withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: skipped
                  ? const Color(0xFFFEE2E2)
                  : const Color(0xFFFFF6E5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              skipped ? Icons.bedtime_off_rounded : Icons.nightlight_round,
              color: skipped
                  ? const Color(0xFFB91C1C)
                  : const Color(0xFF5B0202),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  window,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF111827),
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  quality,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: skipped
                  ? const Color(0xFFFEE2E2)
                  : const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(
              skipped ? 'Skipped' : 'Slept',
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                color: skipped
                    ? const Color(0xFFB91C1C)
                    : const Color(0xFF15803D),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMealItemRow(
    String meal,
    String detail, {
    required bool isDone,
    String? time,
  }) {
    final title = meal.trim().isEmpty ? 'Meal logged' : meal.trim();
    final items = detail.trim();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF0D48A)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.gold.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppTheme.goldLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isDone ? Icons.restaurant_rounded : Icons.no_meals_outlined,
              color: AppTheme.goldDark,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF111827),
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isDone
                            ? const Color(0xFFDCFCE7)
                            : AppTheme.goldLight,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        isDone ? 'Served' : 'Logged',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          color: isDone
                              ? const Color(0xFF15803D)
                              : AppTheme.goldDark,
                        ),
                      ),
                    ),
                  ],
                ),
                if (items.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    items,
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.35,
                      color: Color(0xFF6B7280),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
                if (time != null && time.trim().isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.schedule_rounded,
                        size: 13,
                        color: Color(0xFF9A7B3C),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        time.trim(),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF9A7B3C),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  HOMEWORK
  // ─────────────────────────────────────────────────────────
  static const _monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  void _openActivities() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const ParentActivitiesScreen()),
    );
  }

  Widget _buildHomeworkCard() {
    if (_isHomeworkLoading) {
      return Shimmer.fromColors(
        baseColor: Colors.grey[300]!,
        highlightColor: Colors.grey[100]!,
        child: Column(
          children: List.generate(
            3,
            (i) => Container(
              height: 88,
              margin: EdgeInsets.only(bottom: i == 2 ? 0 : 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
              ),
            ),
          ),
        ),
      );
    }
    if (_homeworks.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFF0E4C8)),
        ),
        child: const Column(
          children: [
            Icon(Icons.menu_book_rounded, color: Color(0xFFD6B56A), size: 30),
            SizedBox(height: 8),
            Text(
              'No homework right now',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: Color(0xFF374151),
              ),
            ),
            SizedBox(height: 2),
            Text(
              'New activities from school will show here',
              style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
            ),
          ],
        ),
      );
    }

    final items = _homeworks.take(3).toList();
    return Column(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          _buildHomeworkRow(items[i]),
          if (i != items.length - 1) const SizedBox(height: 10),
        ],
      ],
    );
  }

  Widget _buildHomeworkRow(HomeworkModel item) {
    final subject = item.subject.trim().isEmpty ? 'General' : item.subject.trim();
    final title = item.title.trim().isEmpty ? subject : item.title.trim();
    final lower = subject.toLowerCase();
    final isMaths = lower.contains('math');
    final isEnglish = lower.contains('english');
    final iconBg = isMaths
        ? const Color(0xFFE0F2FE)
        : (isEnglish ? const Color(0xFFFFF1F1) : const Color(0xFFFFF6E5));
    final iconColor = isMaths
        ? const Color(0xFF0284C7)
        : (isEnglish ? const Color(0xFF8B0000) : AppTheme.goldDark);
    final icon = isMaths
        ? Icons.calculate_rounded
        : (isEnglish ? Icons.menu_book_rounded : Icons.auto_stories_rounded);

    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    final dueDay = DateTime(item.dueDate.year, item.dueDate.month, item.dueDate.day);
    final diff = dueDay.difference(today).inDays;
    final overdue = !item.submitted && diff < 0;
    final dueSoon = !item.submitted && diff >= 0 && diff <= 1;

    Color tileBg = const Color(0xFFFFF6E5);
    Color tileFg = AppTheme.goldDark;
    if (item.submitted) {
      tileBg = const Color(0xFFDCFCE7);
      tileFg = const Color(0xFF15803D);
    } else if (overdue) {
      tileBg = const Color(0xFFFEE2E2);
      tileFg = const Color(0xFFB91C1C);
    } else if (dueSoon) {
      tileBg = const Color(0xFFFFEDD5);
      tileFg = const Color(0xFFC2410C);
    }

    String statusLabel = 'Upcoming';
    Color statusBg = const Color(0xFFF3F4F6);
    Color statusFg = const Color(0xFF6B7280);
    if (item.submitted) {
      statusLabel = 'Submitted';
      statusBg = const Color(0xFFDCFCE7);
      statusFg = const Color(0xFF15803D);
    } else if (overdue) {
      statusLabel = 'Overdue';
      statusBg = const Color(0xFFFEE2E2);
      statusFg = const Color(0xFFB91C1C);
    } else if (diff == 0) {
      statusLabel = 'Due today';
      statusBg = const Color(0xFFFFEDD5);
      statusFg = const Color(0xFFC2410C);
    } else if (diff == 1) {
      statusLabel = 'Due tomorrow';
      statusBg = const Color(0xFFFFF6E5);
      statusFg = AppTheme.goldDark;
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: _openActivities,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFF3E6C8)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF5B0202).withValues(alpha: 0.05),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: iconColor, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF111827),
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF1F1),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            subject.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF8B0000),
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: statusBg,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            statusLabel,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: statusFg,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 46,
                padding: const EdgeInsets.symmetric(vertical: 7),
                decoration: BoxDecoration(
                  color: tileBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Text(
                      '${dueDay.day}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: tileFg,
                        height: 1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _monthsShort[dueDay.month - 1].toUpperCase(),
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        color: tileFg,
                        letterSpacing: 0.4,
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

  // ─────────────────────────────────────────────────────────
  //  FEES DUE BANNER
  // ─────────────────────────────────────────────────────────
  Widget _buildFeesDueBanner() {
    if (_feesDue <= 0) {
      return const SizedBox.shrink();
    }
    final amount = _feesDue >= 1000
        ? _feesDue
              .toStringAsFixed(0)
              .replaceAllMapped(
                RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                (m) => '${m[1]},',
              )
        : _feesDue.toStringAsFixed(0);
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
                  Icon(
                    Icons.receipt_long_rounded,
                    color: Colors.white60,
                    size: 15,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'FEES DUE',
                    style: TextStyle(
                      color: Colors.white60,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '₹$amount',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                _feesDueLabel,
                style: const TextStyle(color: Colors.white60, fontSize: 12),
              ),
            ],
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ParentFeesScreen()),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF8B0000),
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(100),
              ),
              elevation: 0,
            ),
            child: const Text(
              'Pay Now',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
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
  final Color wash;
  final String label;
  final IconData icon;
  const _NoticeCfg({
    required this.accentColor,
    required this.borderColor,
    required this.shadowColor,
    required this.wash,
    required this.label,
    required this.icon,
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
  State<_StoryMomentViewerDialog> createState() =>
      _StoryMomentViewerDialogState();
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

  Widget _buildFallback(_StoryMoment m) {
    return Container(
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
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentMoment = widget.moments[_currentIndex];
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final childName = auth.user?.childName ?? auth.user?.name ?? 'Student';

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
                    child: m.imagePath.startsWith('http')
                        ? Image.network(
                            m.imagePath,
                            fit: BoxFit.contain,
                            width: double.infinity,
                            height: double.infinity,
                            errorBuilder: (_, __, ___) => _buildFallback(m),
                          )
                        : m.imagePath.isEmpty
                        ? _buildFallback(m)
                        : Image.asset(
                            m.imagePath,
                            fit: BoxFit.contain,
                            width: double.infinity,
                            height: double.infinity,
                            errorBuilder: (_, __, ___) => _buildFallback(m),
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
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
                                backgroundColor: Colors.white.withValues(
                                  alpha: 0.3,
                                ),
                                valueColor: const AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
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
                          child: Icon(
                            currentMoment.badge,
                            color: Colors.white,
                            size: 18,
                          ),
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
                                '$childName • ${currentMoment.time}',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.75),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.close_rounded,
                            color: Colors.white,
                            size: 26,
                          ),
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
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
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
