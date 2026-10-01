import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'submit_document_screen.dart';

class ParentActivitiesScreen extends StatefulWidget {
  const ParentActivitiesScreen({super.key});

  @override
  State<ParentActivitiesScreen> createState() => _ParentActivitiesScreenState();
}

class _ParentActivitiesScreenState extends State<ParentActivitiesScreen> {
  int _selectedTabIndex = 0;

  // ── Homework data with image asset paths ──────────────────
  final List<Map<String, dynamic>> _homeworkItems = [
    {
      'subject': 'English',
      'imagePath': 'assets/icons/english_icon.png',
      'iconBg': const Color(0xFFFEE2E2),
      'title': 'Write 5 sentences about My Family',
      'dueDate': 'Due: Thu, 28 Aug',
      'dueBg': const Color(0xFFFEF3C7),
      'dueColor': const Color(0xFFB45309),
      'priority': 'High Priority',
      'priorityIcon': Icons.error_rounded,
      'priorityBg': const Color(0xFFFFEDD5),
      'priorityColor': const Color(0xFFC2410C),
    },
    {
      'subject': 'Maths',
      'imagePath': 'assets/icons/maths_icon.png',
      'iconBg': const Color(0xFFDBEAFE),
      'title': 'Practice counting 1–50 with household objects',
      'dueDate': 'Due: Thu, 28 Aug',
      'dueBg': const Color(0xFFFEF3C7),
      'dueColor': const Color(0xFFB45309),
      'priority': 'Medium Priority',
      'priorityIcon': Icons.bar_chart_rounded,
      'priorityBg': const Color(0xFFDBEAFE),
      'priorityColor': const Color(0xFF0369A1),
    },
    {
      'subject': 'EVS',
      'imagePath': 'assets/icons/evs_icon.png',
      'iconBg': const Color(0xFFDCFCE7),
      'title': 'Draw and label 3 types of plants',
      'dueDate': 'Due: Fri, 29 Aug',
      'dueBg': const Color(0xFFDCFCE7),
      'dueColor': const Color(0xFF15803D),
      'priority': 'Low Priority',
      'priorityIcon': Icons.flag_rounded,
      'priorityBg': const Color(0xFFDCFCE7),
      'priorityColor': const Color(0xFF15803D),
    },
    {
      'subject': 'Art',
      'imagePath': 'assets/icons/art_icon.png',
      'iconBg': const Color(0xFFFFEDD5),
      'title': 'Bring a drawing of your favourite animal',
      'dueDate': 'Due: Mon, 1 Sep',
      'dueBg': const Color(0xFFDCFCE7),
      'dueColor': const Color(0xFF15803D),
      'priority': 'Low Priority',
      'priorityIcon': Icons.flag_rounded,
      'priorityBg': const Color(0xFFDCFCE7),
      'priorityColor': const Color(0xFF15803D),
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F3F7),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(context),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSummaryRow(),
                  const SizedBox(height: 24),
                  if (_selectedTabIndex == 0)
                    _buildHomeworkTab()
                  else if (_selectedTabIndex == 1)
                    _buildActivitiesTab()
                  else
                    _buildCertificatesTab(),
                  const SizedBox(height: 36),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  HEADER
  // ─────────────────────────────────────────────────────────
  Widget _buildHeader(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF6B0000), Color(0xFF8B0000)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 20,
        right: 20,
        bottom: 22,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Activities',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Homework, class activities & achievements',
                      style: GoogleFonts.inter(
                        color: Colors.white60,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              // Clipboard action button (top right)
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.assignment_outlined,
                    color: Colors.white, size: 22),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Tab pills
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFF520000),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Expanded(child: _buildTabBtn(0, Icons.assignment_rounded, 'Homework')),
                Expanded(child: _buildTabBtn(1, Icons.star_outline_rounded, 'Activities')),
                Expanded(child: _buildTabBtn(2, Icons.workspace_premium_outlined, 'Certificates')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBtn(int index, IconData icon, String label) {
    final active = _selectedTabIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTabIndex = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.10),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  )
                ]
              : [],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                size: 15,
                color: active
                    ? const Color(0xFF6B0000)
                    : Colors.white.withValues(alpha: 0.75)),
            const SizedBox(width: 5),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12.5,
                fontWeight: active ? FontWeight.bold : FontWeight.w500,
                color: active
                    ? const Color(0xFF6B0000)
                    : Colors.white.withValues(alpha: 0.85),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  SUMMARY STATS ROW
  // ─────────────────────────────────────────────────────────
  Widget _buildSummaryRow() {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            icon: Icons.assignment_late_rounded,
            iconColor: const Color(0xFFD97706),
            number: '2',
            label: 'Due Today',
            bg: const Color(0xFFFFF8E7),
            textColor: const Color(0xFFD97706),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Icons.calendar_month_rounded,
            iconColor: const Color(0xFFDC2626),
            number: '4',
            label: 'This Week',
            bg: const Color(0xFFFDE8E8),
            textColor: const Color(0xFFDC2626),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Icons.check_circle_rounded,
            iconColor: const Color(0xFF16A34A),
            number: '12',
            label: 'Completed',
            bg: const Color(0xFFE8F5E9),
            textColor: const Color(0xFF16A34A),
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color iconColor,
    required String number,
    required String label,
    required Color bg,
    required Color textColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 22),
          const SizedBox(height: 6),
          Text(
            number,
            style: GoogleFonts.outfit(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: textColor,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11.5,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  HOMEWORK TAB
  // ─────────────────────────────────────────────────────────
  Widget _buildHomeworkTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Pending Homework',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF111827),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 14),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _homeworkItems.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (_, i) => _buildHomeworkCard(_homeworkItems[i]),
        ),
      ],
    );
  }

  Widget _buildHomeworkCard(Map<String, dynamic> item) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Image icon ──
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: item['iconBg'] as Color,
                  borderRadius: BorderRadius.circular(16),
                ),
                clipBehavior: Clip.antiAlias,
                child: Image.asset(
                  item['imagePath'] as String,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const Center(
                    child: Icon(Icons.book_rounded,
                        size: 28, color: Color(0xFF6B7280)),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // ── Subject + task ──
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['subject'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF7B0000),
                        letterSpacing: -0.1,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item['title'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 13.5,
                        color: const Color(0xFF374151),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),

              // ── Due date pill ──
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: item['dueBg'] as Color,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.calendar_today_rounded,
                        size: 11, color: item['dueColor'] as Color),
                    const SizedBox(width: 4),
                    Text(
                      item['dueDate'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: item['dueColor'] as Color,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // ── Priority badge ──
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: item['priorityBg'] as Color,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(item['priorityIcon'] as IconData,
                    size: 13, color: item['priorityColor'] as Color),
                const SizedBox(width: 5),
                Text(
                  item['priority'] as String,
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    fontWeight: FontWeight.bold,
                    color: item['priorityColor'] as Color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────
  //  ACTIVITIES TAB
  // ─────────────────────────────────────────────────────────
  Widget _buildActivitiesTab() {
    final list = [
      {
        'title': 'Montessori Sensory Water Bead Activity',
        'time': 'Today, 10:00 AM',
        'desc': 'Explored tactile water beads and primary color mixing to develop fine motor skills.',
        'tag': 'Sensory Play',
        'icon': Icons.opacity_rounded,
        'iconBg': const Color(0xFFECFEFF),
        'iconColor': const Color(0xFF0D9488),
      },
      {
        'title': 'Outdoor Autumn Leaf Collection Walk',
        'time': 'Yesterday, 11:30 AM',
        'desc': 'Discovered 5 different leaf shapes in the garden and sorted them by color.',
        'tag': 'Nature Exploration',
        'icon': Icons.park_rounded,
        'iconBg': const Color(0xFFFEF3C7),
        'iconColor': const Color(0xFFD97706),
      },
      {
        'title': 'Group Storytelling & Puppet Theatre',
        'time': '25 Aug 2026',
        'desc': 'Interactive story session on kindness and sharing with hand puppets.',
        'tag': 'Literacy & Values',
        'icon': Icons.theater_comedy_rounded,
        'iconBg': const Color(0xFFEDE9FE),
        'iconColor': const Color(0xFF7C3AED),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Classroom Activities',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF111827),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 14),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: list.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (_, i) {
            final item = list[i];
            final iconColor = item['iconColor'] as Color;
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: item['iconBg'] as Color,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(item['icon'] as IconData,
                        color: iconColor, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['title'] as String,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          item['time'] as String,
                          style: GoogleFonts.inter(
                              fontSize: 12, color: const Color(0xFF9CA3AF)),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          item['desc'] as String,
                          style: GoogleFonts.inter(
                              fontSize: 13,
                              color: const Color(0xFF4B5563),
                              height: 1.4),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                            color: (item['iconBg'] as Color),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            item['tag'] as String,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: iconColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────────────
  //  CERTIFICATES TAB
  // ─────────────────────────────────────────────────────────
  Widget _buildCertificatesTab() {
    final list = [
      {
        'title': 'Star Student of the Month',
        'date': 'August 2026',
        'badge': 'Outstanding Behavior',
        'icon': Icons.emoji_events_rounded,
        'iconBg': const Color(0xFFFFF7ED),
        'iconColor': const Color(0xFFD97706),
      },
      {
        'title': 'Creative Young Artist Award',
        'date': 'July 2026',
        'badge': 'Best Color Mixing',
        'icon': Icons.color_lens_rounded,
        'iconBg': const Color(0xFFFCE7F3),
        'iconColor': const Color(0xFFDB2777),
      },
      {
        'title': 'Montessori Phonics Master',
        'date': 'June 2026',
        'badge': 'Spelling Bee Hero',
        'icon': Icons.school_rounded,
        'iconBg': const Color(0xFFE0F2FE),
        'iconColor': const Color(0xFF0284C7),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Upload Certificate Banner
        InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const SubmitDocumentScreen(
                  initialCategory: 'Certificates & Awards',
                  initialTitle: 'External Competition Certificate',
                ),
              ),
            );
          },
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFEFF1),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: const Color(0xFF8B0000).withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B0000),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.workspace_premium_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Upload External Certificate',
                        style: GoogleFonts.inter(
                          fontSize: 14.5,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF4A0A0A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Submit extracurricular awards & certificates',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: const Color(0xFF8C7474),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Color(0xFF8B0000),
                  size: 16,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        Text(
          'Achievements & Badges',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF111827),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 14),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: list.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (_, i) {
            final item = list[i];
            final iconColor = item['iconColor'] as Color;
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
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
                      color: item['iconBg'] as Color,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(item['icon'] as IconData,
                        color: iconColor, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['title'] as String,
                          style: GoogleFonts.inter(
                            fontSize: 14.5,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Awarded ${item['date']} · ${item['badge']}',
                          style: GoogleFonts.inter(
                              fontSize: 12, color: const Color(0xFF6B7280)),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.file_download_outlined,
                        color: Color(0xFF6B0000)),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                              'Downloading ${item['title']}…'),
                          backgroundColor: const Color(0xFF6B0000),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    },
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
