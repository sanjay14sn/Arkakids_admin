class JournalModel {
  final String id;
  final String title;
  final String description;
  final String imageUrl;
  final String authorName;
  final String authorAvatar;
  final String category; // 'activity' | 'learning' | 'meal' | 'nap' | 'announcement'
  final DateTime createdAt;
  final List<String> taggedStudents;

  JournalModel({
    required this.id,
    required this.title,
    required this.description,
    required this.imageUrl,
    required this.authorName,
    required this.authorAvatar,
    required this.category,
    required this.createdAt,
    this.taggedStudents = const [],
  });

  factory JournalModel.fromJson(Map<String, dynamic> json) {
    return JournalModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Daily Moment',
      description: json['description']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? '',
      authorName: json['authorName']?.toString() ?? 'Teacher',
      authorAvatar: json['authorAvatar']?.toString() ?? '',
      category: json['category']?.toString() ?? 'activity',
      createdAt: json['createdAt'] != null 
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      taggedStudents: (json['taggedStudents'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}
