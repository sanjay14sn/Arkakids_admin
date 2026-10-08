class HomeworkModel {
  final String id;
  final String title;
  final String subject;
  final String description;
  final DateTime dueDate;
  final DateTime? assignedDate;
  final String status; // 'assigned' | 'submitted' | 'graded'
  final String? score;
  final String batch;
  final String createdBy;
  final String? attachmentUrl;
  final String? attachmentName;
  final bool submitted;
  final bool submittable;
  final String? submissionUrl;

  HomeworkModel({
    required this.id,
    required this.title,
    required this.subject,
    required this.description,
    required this.dueDate,
    this.assignedDate,
    required this.status,
    this.score,
    this.batch = '',
    this.createdBy = '',
    this.attachmentUrl,
    this.attachmentName,
    this.submitted = false,
    this.submittable = false,
    this.submissionUrl,
  });

  factory HomeworkModel.fromJson(Map<String, dynamic> json, {String? studentId}) {
    DateTime parseDay(dynamic raw, DateTime fallback) {
      final text = raw?.toString() ?? '';
      if (text.isEmpty) return fallback;
      return DateTime.tryParse(text) ??
          DateTime.tryParse('${text}T00:00:00') ??
          fallback;
    }

    final attachment = json['attachment'];
    final attachmentUrl = json['attachmentUrl']?.toString().isNotEmpty == true
        ? json['attachmentUrl'].toString()
        : (attachment is Map ? attachment['src']?.toString() : null);
    final attachmentName =
        attachment is Map ? attachment['name']?.toString() : null;

    final submissions = json['submissions'];
    var submitted = false;
    String? submissionUrl;
    if (submissions is List && studentId != null && studentId.isNotEmpty) {
      for (final row in submissions) {
        if (row is! Map) continue;
        if (row['studentId']?.toString() != studentId) continue;
        submitted = true;
        final url = row['fileUrl']?.toString();
        if (url != null && url.isNotEmpty) submissionUrl = url;
        break;
      }
    }

    return HomeworkModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? json['activity']?.toString() ?? 'Assignment',
      subject: json['activity']?.toString() ??
          json['subject']?.toString() ??
          'General',
      description: json['instructions']?.toString() ??
          json['description']?.toString() ??
          '',
      dueDate: parseDay(json['dueDate'], DateTime.now().add(const Duration(days: 2))),
      assignedDate: json['assignedDate'] != null
          ? parseDay(json['assignedDate'], DateTime.now())
          : DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      status: submitted ? 'submitted' : _mapStatus(json['status']?.toString()),
      score: json['score']?.toString() ?? json['grade']?.toString(),
      batch: json['batch']?.toString() ?? json['className']?.toString() ?? '',
      createdBy: json['createdBy']?.toString() ?? '',
      attachmentUrl: attachmentUrl,
      attachmentName: attachmentName,
      submitted: submitted,
      submittable: json['submittable'] == true,
      submissionUrl: submissionUrl,
    );
  }

  static String _mapStatus(String? raw) {
    switch ((raw ?? '').toLowerCase()) {
      case 'completed':
      case 'graded':
        return 'graded';
      case 'submitted':
        return 'submitted';
      default:
        return 'assigned';
    }
  }
}
