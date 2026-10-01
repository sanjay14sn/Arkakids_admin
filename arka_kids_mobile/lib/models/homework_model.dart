class HomeworkModel {
  final String id;
  final String title;
  final String subject;
  final String description;
  final DateTime dueDate;
  final String status; // 'assigned' | 'submitted' | 'graded'
  final String? score;

  HomeworkModel({
    required this.id,
    required this.title,
    required this.subject,
    required this.description,
    required this.dueDate,
    required this.status,
    this.score,
  });

  factory HomeworkModel.fromJson(Map<String, dynamic> json) {
    return HomeworkModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Assignment',
      subject: json['subject']?.toString() ?? 'General',
      description: json['description']?.toString() ?? '',
      dueDate: json['dueDate'] != null
          ? DateTime.tryParse(json['dueDate'].toString()) ?? DateTime.now().add(const Duration(days: 2))
          : DateTime.now().add(const Duration(days: 2)),
      status: json['status']?.toString() ?? 'assigned',
      score: json['score']?.toString(),
    );
  }
}
