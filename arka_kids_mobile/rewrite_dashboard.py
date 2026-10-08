import re

with open('lib/screens/parent/parent_dashboard.dart', 'r') as f:
    content = f.read()

# 1. Replace _buildHeaderBlock
new_header = """  Widget _buildHeaderBlock(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    final auth = Provider.of<AuthProvider>(context);
    final childName = auth.user?.childName ?? auth.user?.name ?? 'Student';
    
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF4B39EF), Color(0xFF33207B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          // ── Top header content ──
          Padding(
            padding: EdgeInsets.only(
                top: top + 16, left: 20, right: 20, bottom: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Welcome Back 👋',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          childName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    PopupMenuButton<String>(
                      onSelected: (val) async {
                        if (val == 'logout') {
                          final a = Provider.of<AuthProvider>(context, listen: false);
                          await a.logout();
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
                              Icon(Icons.logout_rounded, color: Colors.redAccent, size: 18),
                              SizedBox(width: 10),
                              Text('Logout', style: TextStyle(color: Colors.redAccent)),
                            ],
                          ),
                        ),
                      ],
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.sort, color: Colors.white),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Search Bar
                Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TextField(
                    onTap: () {
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ParentSearchScreen()));
                    },
                    readOnly: true,
                    decoration: InputDecoration(
                      hintText: 'Search',
                      hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 15),
                      prefixIcon: Icon(Icons.search, color: Colors.grey.shade400),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── White end-to-end section covering full dashboard ──
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),
                _buildAttendanceCard(childName),
                const SizedBox(height: 24),
                _buildAssignmentStatus(),
                const SizedBox(height: 24),
                _buildSchoolMoments(),
                const SizedBox(height: 24),

                // Old features
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildTodayCareSection(),
                      const SizedBox(height: 24),
                      _buildNoticeBoard(),
                      const SizedBox(height: 24),
                      _buildSectionHeader("Calendar", showSeeAll: false),
                      const SizedBox(height: 12),
                      _buildCalendar(),
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
  }"""

# 2. Replace _buildMomentsRow + _buildChildCard with new functions
new_components = """
  Widget _buildAttendanceCard(String childName) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Attendance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Text('View Details', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F1FA),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.asset('assets/icons/child_avatar.png', width: 56, height: 56, fit: BoxFit.cover, errorBuilder: (_,__,___) => Container(width: 56, height: 56, color: Colors.orange, child: const Icon(Icons.person, color: Colors.white))),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(childName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      Text('December 2025', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                    ],
                  ),
                ),
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 54,
                      height: 54,
                      child: CircularProgressIndicator(
                        value: 0.67,
                        strokeWidth: 5,
                        backgroundColor: Colors.white,
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF4B39EF)),
                      ),
                    ),
                    const Text('67%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssignmentStatus() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Assignment Status', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Text('See All', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
            ],
          ),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.5,
            padding: EdgeInsets.zero,
            children: [
              _assignmentCard('English', '20/11/2024', const Color(0xFFF27B50), Icons.chat_bubble),
              _assignmentCard('Hindi', '12/08/2023', const Color(0xFF7067D2), Icons.menu_book),
              _assignmentCard('Science', '17/12/2025', const Color(0xFF4C66A4), Icons.science),
              _assignmentCard('Maths', '17/12/2025', const Color(0xFF55A4B2), Icons.grid_view),
            ],
          ),
        ],
      ),
    );
  }

  Widget _assignmentCard(String title, String date, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Align(
            alignment: Alignment.topRight,
            child: Icon(icon, color: Colors.white.withOpacity(0.9), size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 4),
              Text('Last Date : $date', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSchoolMoments() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('School Moments', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Text('See All', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 190,
            child: ListView(
              scrollDirection: Axis.horizontal,
              clipBehavior: Clip.none,
              children: [
                _momentCard('Science Fair 2025', 'Showcasing student artwork from...', 'assets/images/science_fair.png', Colors.blueGrey),
                const SizedBox(width: 16),
                _momentCard('Yoga & Wellness Day', 'A day promoting mindfulness...', 'assets/images/yoga_day.png', Colors.green),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _momentCard(String title, String subtitle, String imgPath, Color fallback) {
    return Container(
      width: 240,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Container(
              height: 110,
              width: double.infinity,
              color: fallback,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text(subtitle, style: TextStyle(color: Colors.grey.shade600, fontSize: 11), maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }
"""

start_header = content.find('  Widget _buildHeaderBlock(BuildContext context) {')
end_header = content.find('  Widget _headerIconBtn(IconData icon) {')

if start_header == -1 or end_header == -1:
    print("Could not find _buildHeaderBlock or _headerIconBtn")
    exit(1)

content = content[:start_header] + new_header + "\n\n" + content[end_header:]

start_moments = content.find('  // ─────────────────────────────────────────────────────────\n  //  TODAY\'S MOMENTS')
end_moments = content.find('  // ─────────────────────────────────────────────────────────\n  //  TODAY\'S CARE (Meals, Naps, Activity)')

if start_moments == -1 or end_moments == -1:
    print("Could not find moments row or today care section")
    exit(1)

content = content[:start_moments] + new_components + "\n\n" + content[end_moments:]

with open('lib/screens/parent/parent_dashboard.dart', 'w') as f:
    f.write(content)

print("Done replacing.")
