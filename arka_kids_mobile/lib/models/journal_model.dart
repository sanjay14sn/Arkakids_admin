class JournalModel {
  final String id;
  final String title;
  final String description;
  final String imageUrl;
  final List<String> photos;
  final String authorName;
  final String authorAvatar;
  final String category; // 'activity' | 'learning' | 'meal' | 'nap' | 'announcement'
  final DateTime createdAt;
  final String date;
  final List<String> tags;
  final List<String> taggedStudents;

  JournalModel({
    required this.id,
    required this.title,
    required this.description,
    required this.imageUrl,
    this.photos = const [],
    required this.authorName,
    required this.authorAvatar,
    required this.category,
    required this.createdAt,
    this.date = '',
    this.tags = const [],
    this.taggedStudents = const [],
  });

  factory JournalModel.fromJson(Map<String, dynamic> json) {
    final photos = _collectPhotos(json);
    final created = DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
        DateTime.tryParse(json['date']?.toString() ?? '');

    return JournalModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Daily Moment',
      description: json['description']?.toString() ??
          json['note']?.toString() ??
          json['content']?.toString() ??
          '',
      imageUrl: photos.isNotEmpty ? photos.first : '',
      photos: photos,
      authorName: json['authorName']?.toString() ??
          json['author']?.toString() ??
          json['postedBy']?.toString() ??
          'Teacher',
      authorAvatar: json['authorAvatar']?.toString() ?? '',
      category: json['category']?.toString() ??
          ((json['tags'] is List && (json['tags'] as List).isNotEmpty)
              ? (json['tags'] as List).first.toString()
              : 'activity'),
      createdAt: created ?? DateTime.now(),
      date: json['date']?.toString() ?? '',
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          const [],
      taggedStudents: (json['taggedStudents'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
    );
  }

  static List<String> _collectPhotos(Map<String, dynamic> json) {
    final seen = <String>{};
    final out = <String>[];
    void add(dynamic raw) {
      final url = raw?.toString().trim() ?? '';
      if (url.isEmpty || url == 'null') return;
      final ok = url.startsWith('http') || url.startsWith('assets/');
      if (!ok) return;
      if (seen.add(url)) out.add(url);
    }

    add(json['imageUrl']);
    final photos = json['photos'];
    if (photos is List) {
      for (final item in photos) {
        add(item);
      }
    }
    final media = json['media'];
    if (media is List) {
      for (final item in media) {
        if (item is Map) {
          add(item['src']);
        } else {
          add(item);
        }
      }
    }
    return out;
  }
}
