import 'package:flutter/material.dart';

class ParentSearchScreen extends StatefulWidget {
  const ParentSearchScreen({super.key});

  @override
  State<ParentSearchScreen> createState() => _ParentSearchScreenState();
}

class _ParentSearchScreenState extends State<ParentSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  String _selectedCategory = 'All';
  String _searchQuery = '';

  final List<String> _categories = [
    'All',
    'Notices',
    'Activities',
    'Homework',
    'Meals',
    'Fees',
    'Teachers'
  ];

  final List<String> _recentSearches = [
    'Rain Holiday',
    'Annual Day costume',
    'Maths Homework',
    'Lunch Menu',
    'Ms. Priya',
  ];

  // Dummy Search Database
  final List<Map<String, dynamic>> _allItems = [
    {
      'title': 'Rain Holiday Tomorrow',
      'subtitle': 'School will remain closed on 28 Aug due to heavy rainfall advisory.',
      'category': 'Notices',
      'icon': Icons.warning_amber_rounded,
      'color': Color(0xFFDC2626),
      'bgColor': Color(0xFFFDE8E8),
      'date': '30 min ago',
    },
    {
      'title': 'Annual Day – Dress Code',
      'subtitle': 'Children should wear the white & blue costume for Annual Day on Sep 10.',
      'category': 'Notices',
      'icon': Icons.event_rounded,
      'color': Color(0xFF7C3AED),
      'bgColor': Color(0xFFF3E8FF),
      'date': '2 hr ago',
    },
    {
      'title': 'PTM Scheduled – Sep 15',
      'subtitle': 'Parent-Teacher Meeting on 15 Sep, 10 AM – 1 PM. Slot booking open.',
      'category': 'Notices',
      'icon': Icons.info_outline_rounded,
      'color': Color(0xFF0284C7),
      'bgColor': Color(0xFFE0F2FE),
      'date': 'Yesterday',
    },
    {
      'title': 'Morning Circle Time',
      'subtitle': 'Rhymes, attendance & greeting session with classmates.',
      'category': 'Activities',
      'icon': Icons.wb_sunny_rounded,
      'color': Color(0xFFD97706),
      'bgColor': Color(0xFFFFF7ED),
      'date': '9:00 AM Daily',
    },
    {
      'title': 'Art & Craft – Drawing',
      'subtitle': 'Coloring and drawing family shapes with wax crayons.',
      'category': 'Activities',
      'icon': Icons.palette_rounded,
      'color': Color(0xFFDB2777),
      'bgColor': Color(0xFFFFF0F5),
      'date': '9:30 AM Daily',
    },
    {
      'title': 'Story Time & Library',
      'subtitle': 'Reading short stories with Ms. Priya.',
      'category': 'Activities',
      'icon': Icons.menu_book_rounded,
      'color': Color(0xFF0284C7),
      'bgColor': Color(0xFFE0F2FE),
      'date': '10:15 AM Daily',
    },
    {
      'title': 'English Homework',
      'subtitle': 'Write 5 sentences about My Family.',
      'category': 'Homework',
      'icon': Icons.edit_note_rounded,
      'color': Color(0xFFDC2626),
      'bgColor': Color(0xFFFDE8E8),
      'date': 'Due Tomorrow',
    },
    {
      'title': 'Maths Homework',
      'subtitle': 'Practice counting 1–50 with objects.',
      'category': 'Homework',
      'icon': Icons.calculate_rounded,
      'color': Color(0xFF0284C7),
      'bgColor': Color(0xFFE0F2FE),
      'date': 'Due Tomorrow',
    },
    {
      'title': 'EVS Assignment',
      'subtitle': 'Draw & label 3 fruits from home.',
      'category': 'Homework',
      'icon': Icons.eco_rounded,
      'color': Color(0xFF16A34A),
      'bgColor': Color(0xFFDCFCE7),
      'date': 'Due Fri, 29 Aug',
    },
    {
      'title': 'Idli Sambar & Chutney',
      'subtitle': 'Breakfast menu provided to children.',
      'category': 'Meals',
      'icon': Icons.restaurant_rounded,
      'color': Color(0xFFEA580C),
      'bgColor': Color(0xFFFFF7ED),
      'date': 'Today Morning',
    },
    {
      'title': 'Dal Rice & Curd',
      'subtitle': 'Nutritious lunch meal served at 12:30 PM.',
      'category': 'Meals',
      'icon': Icons.restaurant_menu_rounded,
      'color': Color(0xFF16A34A),
      'bgColor': Color(0xFFDCFCE7),
      'date': 'Today Lunch',
    },
    {
      'title': 'September Fee Receipt',
      'subtitle': 'Monthly tuition & activity fee ₹12,500 due by Sep 5.',
      'category': 'Fees',
      'icon': Icons.receipt_long_rounded,
      'color': Color(0xFF8B0000),
      'bgColor': Color(0xFFFFEFF1),
      'date': 'Due Sep 5',
    },
    {
      'title': 'Ms. Priya Sharma',
      'subtitle': 'Class Teacher - Playgroup A',
      'category': 'Teachers',
      'icon': Icons.person_rounded,
      'color': Color(0xFF7C3AED),
      'bgColor': Color(0xFFF3E8FF),
      'date': 'Contact Available',
    },
    {
      'title': 'Mr. Suresh Kumar',
      'subtitle': 'Sports & Outdoor Activity Instructor',
      'category': 'Teachers',
      'icon': Icons.sports_rounded,
      'color': Color(0xFF0284C7),
      'bgColor': Color(0xFFE0F2FE),
      'date': 'Contact Available',
    },
  ];

  List<Map<String, dynamic>> get _filteredResults {
    return _allItems.where((item) {
      final matchesCategory = _selectedCategory == 'All' ||
          item['category'] == _selectedCategory;
      final matchesQuery = _searchQuery.isEmpty ||
          item['title']
              .toString()
              .toLowerCase()
              .contains(_searchQuery.toLowerCase()) ||
          item['subtitle']
              .toString()
              .toLowerCase()
              .contains(_searchQuery.toLowerCase()) ||
          item['category']
              .toString()
              .toLowerCase()
              .contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    }).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onSearchQueryChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
  }

  void _selectSearchTerm(String term) {
    _searchController.text = term;
    _searchController.selection = TextSelection.fromPosition(
      TextPosition(offset: term.length),
    );
    setState(() {
      _searchQuery = term;
    });
  }

  @override
  Widget build(BuildContext context) {
    final results = _filteredResults;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(130),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6B0000), Color(0xFF8B0000)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 8),
                // Top row with Back button & Search TextField
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      Expanded(
                        child: Container(
                          height: 46,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: TextField(
                            controller: _searchController,
                            focusNode: _focusNode,
                            onChanged: _onSearchQueryChanged,
                            autofocus: true,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF1F2937),
                              fontWeight: FontWeight.w500,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Search notices, activities, meals...',
                              hintStyle: TextStyle(
                                color: Colors.grey.shade400,
                                fontSize: 13.5,
                              ),
                              prefixIcon: const Icon(
                                Icons.search_rounded,
                                color: Color(0xFF8B0000),
                                size: 22,
                              ),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(
                                        Icons.clear_rounded,
                                        color: Colors.grey,
                                        size: 18,
                                      ),
                                      onPressed: () {
                                        _searchController.clear();
                                        _onSearchQueryChanged('');
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                vertical: 12,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Category Filter Bar
                SizedBox(
                  height: 36,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected = cat == _selectedCategory;
                      return ChoiceChip(
                        label: Text(cat),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedCategory = cat;
                            });
                          }
                        },
                        labelStyle: TextStyle(
                          color: isSelected
                              ? const Color(0xFF8B0000)
                              : Colors.white70,
                          fontSize: 12.5,
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w500,
                        ),
                        selectedColor: Colors.white,
                        backgroundColor: Colors.white.withValues(alpha: 0.15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                          side: BorderSide(
                            color: isSelected
                                ? Colors.white
                                : Colors.white.withValues(alpha: 0.2),
                          ),
                        ),
                        showCheckmark: false,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: _searchQuery.isEmpty && _selectedCategory == 'All'
          ? _buildRecentAndSuggestions()
          : _buildSearchResults(results),
    );
  }

  // Default view when user hasn't typed anything
  Widget _buildRecentAndSuggestions() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Recent Searches Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: const [
                Icon(Icons.history_rounded, size: 18, color: Color(0xFF6B7280)),
                SizedBox(width: 6),
                Text(
                  'Recent Searches',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF374151),
                  ),
                ),
              ],
            ),
            if (_recentSearches.isNotEmpty)
              GestureDetector(
                onTap: () {
                  setState(() {
                    _recentSearches.clear();
                  });
                },
                child: const Text(
                  'Clear all',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF8B0000),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (_recentSearches.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text(
              'No recent searches',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
          )
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _recentSearches.map((term) {
              return ActionChip(
                onPressed: () => _selectSearchTerm(term),
                avatar: const Icon(
                  Icons.north_west_rounded,
                  size: 13,
                  color: Color(0xFF6B7280),
                ),
                label: Text(term),
                labelStyle: const TextStyle(
                  fontSize: 12.5,
                  color: Color(0xFF374151),
                  fontWeight: FontWeight.w500,
                ),
                backgroundColor: const Color(0xFFF3F4F6),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(100),
                  side: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
              );
            }).toList(),
          ),

        const SizedBox(height: 28),

        // Quick Suggestions / Explore
        Row(
          children: const [
            Icon(Icons.explore_outlined, size: 18, color: Color(0xFF6B7280)),
            SizedBox(width: 6),
            Text(
              'Quick Explore',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Color(0xFF374151),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        _buildQuickExploreCard(
          icon: Icons.notifications_active_rounded,
          title: 'Notices & Announcements',
          subtitle: 'Stay updated with holidays, events & circulars',
          color: const Color(0xFFDC2626),
          bgColor: const Color(0xFFFDE8E8),
          onTap: () => setState(() => _selectedCategory = 'Notices'),
        ),
        const SizedBox(height: 10),
        _buildQuickExploreCard(
          icon: Icons.sports_soccer_rounded,
          title: 'Daily Activities',
          subtitle: 'Check play, circle time & drawing schedules',
          color: const Color(0xFF16A34A),
          bgColor: const Color(0xFFDCFCE7),
          onTap: () => setState(() => _selectedCategory = 'Activities'),
        ),
        const SizedBox(height: 10),
        _buildQuickExploreCard(
          icon: Icons.restaurant_rounded,
          title: 'Food & Meals',
          subtitle: "View today's breakfast & lunch menu",
          color: const Color(0xFFEA580C),
          bgColor: const Color(0xFFFFF7ED),
          onTap: () => setState(() => _selectedCategory = 'Meals'),
        ),
        const SizedBox(height: 10),
        _buildQuickExploreCard(
          icon: Icons.menu_book_rounded,
          title: 'Homework & Assignments',
          subtitle: 'Track English, Maths & EVS tasks due',
          color: const Color(0xFF0284C7),
          bgColor: const Color(0xFFE0F2FE),
          onTap: () => setState(() => _selectedCategory = 'Homework'),
        ),
      ],
    );
  }

  Widget _buildQuickExploreCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFAFAFA),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFF3F4F6)),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF9CA3AF),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  // Search Results view
  Widget _buildSearchResults(List<Map<String, dynamic>> results) {
    if (results.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: const BoxDecoration(
                  color: Color(0xFFF3F4F6),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.search_off_rounded,
                  size: 36,
                  color: Color(0xFF9CA3AF),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'No results found for "$_searchQuery"',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Try searching for different keywords or select another filter category.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFF6B7280),
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: results.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final item = results[index];
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF3F4F6)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
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
                  color: item['bgColor'] as Color,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  item['icon'] as IconData,
                  color: item['color'] as Color,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: (item['color'] as Color).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            item['category'].toString().toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: item['color'] as Color,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                        Text(
                          item['date'].toString(),
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF9CA3AF),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item['title'].toString(),
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item['subtitle'].toString(),
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Color(0xFF4B5563),
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
