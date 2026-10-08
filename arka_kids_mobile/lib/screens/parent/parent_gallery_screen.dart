import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/journal_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class _GalleryPhoto {
  final String url;
  final String caption;
  final String dateLabel;
  final String category;
  final String author;

  const _GalleryPhoto({
    required this.url,
    required this.caption,
    required this.dateLabel,
    required this.category,
    required this.author,
  });
}

class ParentGalleryScreen extends StatefulWidget {
  const ParentGalleryScreen({super.key});

  @override
  State<ParentGalleryScreen> createState() => _ParentGalleryScreenState();
}

class _ParentGalleryScreenState extends State<ParentGalleryScreen> {
  bool _loading = true;
  String _selectedCategory = 'All';
  List<_GalleryPhoto> _photos = [];

  static const _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  String _dateLabel(JournalModel journal) {
    final local = journal.createdAt.toLocal();
    return '${local.day} ${_months[local.month - 1]} ${local.year}';
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final token = auth.token;
    final user = auth.user;
    if (token == null || token.isEmpty) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    final journals = await ApiService.getJournalFeed(
      token,
      className: user?.className,
    );
    final photos = <_GalleryPhoto>[];
    for (final journal in journals) {
      final urls = journal.photos.isNotEmpty
          ? journal.photos
          : (journal.imageUrl.isNotEmpty ? [journal.imageUrl] : <String>[]);
      final caption = journal.title.isNotEmpty && journal.title != 'Classroom Update'
          ? journal.title
          : (journal.description.isNotEmpty ? journal.description : 'Class moment');
      final category = journal.tags.isNotEmpty
          ? journal.tags.first
          : (journal.category.isNotEmpty ? journal.category : 'Moments');
      for (final url in urls) {
        photos.add(_GalleryPhoto(
          url: url,
          caption: caption,
          dateLabel: _dateLabel(journal),
          category: category,
          author: journal.authorName,
        ));
      }
    }
    if (!mounted) return;
    setState(() {
      _photos = photos;
      _loading = false;
    });
  }

  List<String> get _categories {
    final tags = _photos
        .map((p) => p.category)
        .where((c) => c.trim().isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    return ['All', ...tags];
  }

  List<_GalleryPhoto> get _filtered {
    if (_selectedCategory == 'All') return _photos;
    return _photos.where((p) => p.category == _selectedCategory).toList();
  }

  void _openLightbox(int initialIndex) {
    final photos = _filtered;
    if (photos.isEmpty) return;
    showDialog(
      context: context,
      builder: (ctx) => _GalleryLightbox(
        photos: photos,
        initialIndex: initialIndex,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final photos = _filtered;
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      appBar: AppBar(
        title: Text(
          'Photo Gallery',
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF6B0000),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _loading = true);
          await _load();
        },
        color: const Color(0xFF8B0000),
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B0000)))
            : CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: Text(
                        photos.isEmpty
                            ? 'Classroom moments from Daily Journal'
                            : '${photos.length} photo${photos.length == 1 ? '' : 's'} from class moments',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: const Color(0xFF6B7280),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  if (_categories.length > 2)
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 42,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          scrollDirection: Axis.horizontal,
                          itemCount: _categories.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, index) {
                            final cat = _categories[index];
                            final selected = cat == _selectedCategory;
                            return ChoiceChip(
                              label: Text(cat),
                              selected: selected,
                              onSelected: (_) => setState(() => _selectedCategory = cat),
                              selectedColor: const Color(0xFF8B0000),
                              backgroundColor: Colors.white,
                              labelStyle: GoogleFonts.inter(
                                color: selected ? Colors.white : const Color(0xFF374151),
                                fontSize: 12.5,
                                fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(100),
                                side: BorderSide(
                                  color: selected ? const Color(0xFF8B0000) : const Color(0xFFE5E7EB),
                                ),
                              ),
                              showCheckmark: false,
                            );
                          },
                        ),
                      ),
                    ),
                  if (photos.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.photo_library_outlined, size: 42, color: Colors.grey.shade400),
                              const SizedBox(height: 10),
                              Text(
                                'No photos yet',
                                style: GoogleFonts.outfit(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF111827),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Moment photos from Daily Journal will appear here.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF6B7280)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                      sliver: SliverGrid(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          mainAxisSpacing: 6,
                          crossAxisSpacing: 6,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final photo = photos[index];
                            return GestureDetector(
                              onTap: () => _openLightbox(index),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: photo.url.startsWith('http')
                                    ? Image.network(
                                        photo.url,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => _photoFallback(),
                                      )
                                    : Image.asset(
                                        photo.url,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => _photoFallback(),
                                      ),
                              ),
                            );
                          },
                          childCount: photos.length,
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _photoFallback() {
    return Container(
      color: AppTheme.goldLight,
      child: const Icon(Icons.photo_rounded, color: AppTheme.goldDark),
    );
  }
}

class _GalleryLightbox extends StatefulWidget {
  final List<_GalleryPhoto> photos;
  final int initialIndex;

  const _GalleryLightbox({required this.photos, required this.initialIndex});

  @override
  State<_GalleryLightbox> createState() => _GalleryLightboxState();
}

class _GalleryLightboxState extends State<_GalleryLightbox> {
  late int _index;
  late final PageController _controller;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _controller = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final photo = widget.photos[_index];
    return Dialog.fullscreen(
      backgroundColor: Colors.black,
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: widget.photos.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (_, i) {
              final item = widget.photos[i];
              return InteractiveViewer(
                child: Center(
                  child: item.url.startsWith('http')
                      ? Image.network(item.url, fit: BoxFit.contain)
                      : Image.asset(item.url, fit: BoxFit.contain),
                ),
              );
            },
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 8,
            right: 8,
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                    child: const Icon(Icons.close_rounded, color: Colors.white, size: 22),
                  ),
                ),
                const Spacer(),
                Text(
                  '${_index + 1} / ${widget.photos.length}',
                  style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 12),
              ],
            ),
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: MediaQuery.of(context).padding.bottom + 24,
            child: Column(
              children: [
                Text(
                  photo.caption,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${photo.dateLabel} · ${photo.author}',
                  style: GoogleFonts.inter(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
