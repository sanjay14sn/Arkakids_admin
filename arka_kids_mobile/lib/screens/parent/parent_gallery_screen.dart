import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ParentGalleryScreen extends StatefulWidget {
  const ParentGalleryScreen({super.key});

  @override
  State<ParentGalleryScreen> createState() => _ParentGalleryScreenState();
}

class _ParentGalleryScreenState extends State<ParentGalleryScreen> {
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Class Activities',
    'Festivals & Events',
    'Art & Craft',
    'Outdoor & Sports',
  ];

  final List<Map<String, dynamic>> _albums = [
    {
      'title': 'Montessori Water Bead & Color Sorting Activity',
      'category': 'Class Activities',
      'date': '24 Aug 2026',
      'count': '12 Photos',
      'uploader': 'Ms. Anitha (Class Teacher)',
      'coverIcon': Icons.water_drop_rounded,
      'coverColor': const Color(0xFF0284C7),
      'coverBg': const Color(0xFFE0F2FE),
      'assetPath': 'assets/icons/story_playtime.png',
      'likes': 18,
      'isLiked': true,
      'photos': [
        {
          'caption': 'Arjun sorting primary blue & yellow water beads',
          'date': '24 Aug 2026, 10:15 AM',
        },
        {
          'caption': 'Group water play table sensory exploration',
          'date': '24 Aug 2026, 10:30 AM',
        },
        {
          'caption': 'Fine motor pincher grasp exercise with scoops',
          'date': '24 Aug 2026, 10:45 AM',
        },
      ],
    },
    {
      'title': 'Independence Day Grand Flag Hoisting & Parade',
      'category': 'Festivals & Events',
      'date': '15 Aug 2026',
      'count': '28 Photos • 2 Videos',
      'uploader': 'School Admin',
      'coverIcon': Icons.flag_rounded,
      'coverColor': const Color(0xFF16A34A),
      'coverBg': const Color(0xFFDCFCE7),
      'assetPath': 'assets/icons/story_playtime.png',
      'likes': 34,
      'isLiked': false,
      'photos': [
        {
          'caption': 'Playgroup kids performing tricolor flag song',
          'date': '15 Aug 2026, 09:30 AM',
        },
        {
          'caption': 'Arjun dressed as Little Freedom Fighter',
          'date': '15 Aug 2026, 09:50 AM',
        },
      ],
    },
    {
      'title': 'Clay Modeling & Diya Painting Workshop',
      'category': 'Art & Craft',
      'date': '10 Aug 2026',
      'count': '16 Photos',
      'uploader': 'Art Teacher Ms. Divya',
      'coverIcon': Icons.palette_rounded,
      'coverColor': const Color(0xFFD97706),
      'coverBg': const Color(0xFFFEF3C7),
      'assetPath': 'assets/icons/story_playtime.png',
      'likes': 25,
      'isLiked': true,
      'photos': [
        {
          'caption': 'Creative hands painting terracotta pots with sparkles',
          'date': '10 Aug 2026, 11:00 AM',
        },
      ],
    },
    {
      'title': 'Outdoor Nature Exploration & Garden Picnic',
      'category': 'Outdoor & Sports',
      'date': '02 Aug 2026',
      'count': '20 Photos',
      'uploader': 'Physical Educator Coach Raj',
      'coverIcon': Icons.park_rounded,
      'coverColor': const Color(0xFF059669),
      'coverBg': const Color(0xFFD1FAE5),
      'assetPath': 'assets/icons/story_playtime.png',
      'likes': 22,
      'isLiked': false,
      'photos': [
        {
          'caption': 'Collecting autumn leaves and identifying colors',
          'date': '02 Aug 2026, 11:45 AM',
        },
      ],
    },
    {
      'title': 'Friendship Day Craft & Hug Bear Activity',
      'category': 'Class Activities',
      'date': '28 Jul 2026',
      'count': '14 Photos',
      'uploader': 'Ms. Anitha',
      'coverIcon': Icons.favorite_rounded,
      'coverColor': const Color(0xFFDC2626),
      'coverBg': const Color(0xFFFEE2E2),
      'assetPath': 'assets/icons/story_playtime.png',
      'likes': 40,
      'isLiked': true,
      'photos': [
        {
          'caption': 'Exchanging handmade friendship bands with peers',
          'date': '28 Jul 2026, 10:00 AM',
        },
      ],
    },
  ];

  List<Map<String, dynamic>> get _filteredAlbums {
    if (_selectedCategory == 'All') return _albums;
    return _albums
        .where((album) => album['category'] == _selectedCategory)
        .toList();
  }

  void _openPhotoLightbox(Map<String, dynamic> album, int initialIndex) {
    final photos = album['photos'] as List;

    showDialog(
      context: context,
      builder: (ctx) => Dialog.fullscreen(
        backgroundColor: Colors.black,
        child: StatefulBuilder(
          builder: (context, setDialogState) {
            int currentIndex = initialIndex;

            return Stack(
              children: [
                // PageView
                PageView.builder(
                  itemCount: photos.length,
                  onPageChanged: (idx) {
                    setDialogState(() {
                      currentIndex = idx;
                    });
                  },
                  itemBuilder: (context, index) {
                    final photo = photos[index] as Map<String, dynamic>;
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            constraints: const BoxConstraints(maxHeight: 450),
                            margin: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: const [
                                BoxShadow(
                                  color: Colors.black54,
                                  blurRadius: 20,
                                ),
                              ],
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: Image.asset(
                              album['assetPath'] as String,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                height: 300,
                                color: Colors.grey.shade900,
                                child: const Center(
                                  child: Icon(Icons.image_rounded,
                                      size: 80, color: Colors.white38),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: Text(
                              photo['caption'] as String,
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            photo['date'] as String,
                            style: GoogleFonts.inter(
                              color: Colors.white60,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),

                // Top Controls Bar
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  left: 16,
                  right: 16,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Colors.black45,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close_rounded,
                              color: Colors.white, size: 22),
                        ),
                      ),
                      Text(
                        '${currentIndex + 1} / ${photos.length}',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Row(
                        children: [
                          IconButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Downloading HD Photo to gallery...'),
                                  backgroundColor: Color(0xFF10B981),
                                ),
                              );
                            },
                            icon: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(
                                color: Colors.black45,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.download_rounded,
                                  color: Colors.white, size: 20),
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Photo link copied for sharing!'),
                                  backgroundColor: Color(0xFF8B0000),
                                ),
                              );
                            },
                            icon: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(
                                color: Colors.black45,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.share_rounded,
                                  color: Colors.white, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final albums = _filteredAlbums;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(80),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6B0000), Color(0xFF8B0000)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'School Photo Gallery',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 19,
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.2,
                          ),
                        ),
                        Text(
                          'Classroom moments, festival events & activities',
                          style: GoogleFonts.inter(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),

            // Category Filter Pills
            SizedBox(
              height: 38,
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
                    selectedColor: const Color(0xFF8B0000),
                    backgroundColor: Colors.white,
                    labelStyle: GoogleFonts.inter(
                      color:
                          isSelected ? Colors.white : const Color(0xFF374151),
                      fontSize: 12.5,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.w500,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(100),
                      side: BorderSide(
                        color: isSelected
                            ? const Color(0xFF8B0000)
                            : const Color(0xFFE5E7EB),
                      ),
                    ),
                    showCheckmark: false,
                  );
                },
              ),
            ),
            const SizedBox(height: 20),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Albums (${albums.length})',
                    style: GoogleFonts.outfit(
                      fontSize: 16.5,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF111827),
                    ),
                  ),
                  Text(
                    _selectedCategory,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF8B0000),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: albums.length,
              separatorBuilder: (_, __) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final album = albums[index];
                return _buildAlbumCard(album);
              },
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildAlbumCard(Map<String, dynamic> album) {
    final isLiked = album['isLiked'] as bool;
    final color = album['coverColor'] as Color;
    final bg = album['coverBg'] as Color;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFEFEFEF)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.035),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Album Cover Image Box
          GestureDetector(
            onTap: () => _openPhotoLightbox(album, 0),
            child: Container(
              height: 180,
              width: double.infinity,
              decoration: BoxDecoration(
                color: bg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(album['coverIcon'] as IconData,
                            size: 48, color: color),
                        const SizedBox(height: 8),
                        Text(
                          'Tap to view album photos',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: color,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Category Badge
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(100),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Text(
                        album['category'].toString(),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: color,
                        ),
                      ),
                    ),
                  ),
                  // Photo Count Badge
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.photo_library_rounded,
                              size: 13, color: Colors.white),
                          const SizedBox(width: 5),
                          Text(
                            album['count'].toString(),
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
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

          // Album Details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  album['title'].toString(),
                  style: GoogleFonts.inter(
                    fontSize: 15.5,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF111827),
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 6),

                Row(
                  children: [
                    const Icon(Icons.person_outline_rounded,
                        size: 14, color: Color(0xFF6B7280)),
                    const SizedBox(width: 4),
                    Text(
                      album['uploader'].toString(),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                    const Spacer(),
                    const Icon(Icons.calendar_today_rounded,
                        size: 13, color: Color(0xFF9CA3AF)),
                    const SizedBox(width: 4),
                    Text(
                      album['date'].toString(),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Divider(height: 1, color: Color(0xFFF3F4F6)),
                const SizedBox(height: 10),

                // Footer Actions (Like & View Photos)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    InkWell(
                      onTap: () {
                        setState(() {
                          album['isLiked'] = !isLiked;
                          if (!isLiked) {
                            album['likes'] = (album['likes'] as int) + 1;
                          } else {
                            album['likes'] = (album['likes'] as int) - 1;
                          }
                        });
                      },
                      borderRadius: BorderRadius.circular(100),
                      child: Row(
                        children: [
                          Icon(
                            isLiked
                                ? Icons.favorite_rounded
                                : Icons.favorite_border_rounded,
                            color: isLiked
                                ? const Color(0xFFDC2626)
                                : const Color(0xFF9CA3AF),
                            size: 20,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '${album['likes']} Likes',
                            style: GoogleFonts.inter(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF4B5563),
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _openPhotoLightbox(album, 0),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B0000),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      icon: const Icon(Icons.collections_rounded, size: 16),
                      label: Text(
                        'View Photos',
                        style: GoogleFonts.inter(
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
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
}
