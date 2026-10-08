import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class NoticeItem {
  final String id;
  final String title;
  final String detail;
  final String type;
  final String timeAgo;
  final String date;

  const NoticeItem({
    required this.id,
    required this.title,
    required this.detail,
    required this.type,
    required this.timeAgo,
    required this.date,
  });

  factory NoticeItem.fromApi(Map<String, dynamic> n) {
    return NoticeItem(
      id: (n['id'] ?? '').toString(),
      title: (n['title'] ?? '').toString(),
      detail: (n['subtitle'] ?? n['description'] ?? '').toString(),
      type: (n['type'] ?? 'info').toString(),
      timeAgo: (n['timeAgo'] ?? '').toString(),
      date: (n['date'] ?? '').toString(),
    );
  }
}

class NoticeCfg {
  final Color accentColor;
  final Color borderColor;
  final Color shadowColor;
  final Color wash;
  final String label;
  final IconData icon;
  const NoticeCfg({
    required this.accentColor,
    required this.borderColor,
    required this.shadowColor,
    required this.wash,
    required this.label,
    required this.icon,
  });
}

NoticeCfg getNoticeConfig(String type) {
  switch (type) {
    case 'urgent':
    case 'fee':
      return const NoticeCfg(
        accentColor: Color(0xFFDC2626),
        borderColor: Color(0xFFFECACA),
        shadowColor: Color(0xFFDC2626),
        wash: Color(0xFFFEF2F2),
        label: 'URGENT',
        icon: Icons.priority_high_rounded,
      );
    case 'holiday':
      return const NoticeCfg(
        accentColor: Color(0xFF059669),
        borderColor: Color(0xFFA7F3D0),
        shadowColor: Color(0xFF059669),
        wash: Color(0xFFECFDF5),
        label: 'HOLIDAY',
        icon: Icons.beach_access_rounded,
      );
    case 'event':
      return const NoticeCfg(
        accentColor: AppTheme.goldDark,
        borderColor: Color(0xFFF0D48A),
        shadowColor: AppTheme.gold,
        wash: AppTheme.goldLight,
        label: 'EVENT',
        icon: Icons.celebration_rounded,
      );
    default:
      return const NoticeCfg(
        accentColor: Color(0xFF5B0202),
        borderColor: Color(0xFFE8C9B8),
        shadowColor: Color(0xFF5B0202),
        wash: Color(0xFFFFF6E5),
        label: 'NOTICE',
        icon: Icons.campaign_rounded,
      );
  }
}

class AllNoticesScreen extends StatefulWidget {
  const AllNoticesScreen({Key? key}) : super(key: key);

  @override
  State<AllNoticesScreen> createState() => _AllNoticesScreenState();
}

class _AllNoticesScreenState extends State<AllNoticesScreen> {
  List<NoticeItem> _notices = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final token = context.read<AuthProvider>().token;
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      setState(() => _loading = false);
      return;
    }
    final raw = await ApiService.getNotices(token);
    if (!mounted) return;
    setState(() {
      _notices = raw.map(NoticeItem.fromApi).toList();
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Scaffold(
      backgroundColor: const Color(0xFF5B0202),
      body: Column(
        children: [
          Container(
            decoration: const BoxDecoration(
              color: Color(0xFF5B0202),
              image: DecorationImage(
                image: AssetImage('assets/icons/toodle.png'),
                fit: BoxFit.cover,
                colorFilter: ColorFilter.mode(
                  Color(0xFF5B0202),
                  BlendMode.lighten,
                ),
                opacity: 0.15,
              ),
            ),
            padding: EdgeInsets.only(top: top + 12, left: 8, right: 18, bottom: 12),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
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
                    'All Notices',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                if (_notices.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppTheme.gold,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      '${_notices.length}',
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
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Color(0xFFFFFCF7),
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(color: Color(0xFF8B0000)),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: const Color(0xFF8B0000),
                      child: _notices.isEmpty
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.fromLTRB(16, 40, 16, 24),
                              children: [
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 40,
                                    horizontal: 16,
                                  ),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFFFFFBF2), Color(0xFFFFF6E5)],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    borderRadius: BorderRadius.circular(22),
                                    border: Border.all(
                                      color: const Color(0xFFF0D48A),
                                      width: 1.2,
                                    ),
                                  ),
                                  child: const Column(
                                    children: [
                                      Icon(
                                        Icons.notifications_none_rounded,
                                        color: Color(0xFFD6B56A),
                                        size: 36,
                                      ),
                                      SizedBox(height: 10),
                                      Text(
                                        'No notices right now',
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF374151),
                                        ),
                                      ),
                                      SizedBox(height: 4),
                                      Text(
                                        'School updates will appear here',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF9CA3AF),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            )
                          : ListView.separated(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.fromLTRB(16, 20, 16, 36),
                              itemCount: _notices.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, i) {
                                final n = _notices[i];
                                final cfg = getNoticeConfig(n.type);
                                final meta = [n.date, n.timeAgo]
                                    .where((s) => s.isNotEmpty)
                                    .join(' · ');

                                return Container(
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
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(width: 5, color: cfg.accentColor),
                                        Expanded(
                                          child: Padding(
                                            padding: const EdgeInsets.fromLTRB(12, 14, 14, 14),
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
                                                    if (meta.isNotEmpty)
                                                      Text(
                                                        meta,
                                                        style: const TextStyle(
                                                          fontSize: 11,
                                                          fontWeight: FontWeight.w600,
                                                          color: Color(0xFF9CA3AF),
                                                        ),
                                                      ),
                                                  ],
                                                ),
                                                const SizedBox(height: 12),
                                                Text(
                                                  n.title,
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 15,
                                                    color: Color(0xFF111827),
                                                    letterSpacing: -0.2,
                                                  ),
                                                ),
                                                if (n.detail.isNotEmpty) ...[
                                                  const SizedBox(height: 6),
                                                  Text(
                                                    n.detail,
                                                    style: const TextStyle(
                                                      fontSize: 13,
                                                      color: Color(0xFF6B7280),
                                                      height: 1.4,
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
