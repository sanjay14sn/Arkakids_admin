class UserModel {
  final String id;
  final String name;
  final String email;
  final String role; // 'super_admin' | 'owner' | 'trainer' | 'student' | 'bde'
  final String? avatar;
  final String? tenantId;
  final String? childName;
  final String? className;
  final String? rollNumber;
  final String? centerName;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.avatar,
    this.tenantId,
    this.childName,
    this.className,
    this.rollNumber,
    this.centerName,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    String? firstNonEmpty(List<dynamic> values) {
      for (final value in values) {
        final text = value?.toString().trim();
        if (text != null && text.isNotEmpty && text != '-') return text;
      }
      return null;
    }

    return UserModel(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'User',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'student',
      avatar: json['avatar']?.toString(),
      tenantId: json['tenantId']?.toString(),
      childName: json['childName']?.toString() ?? json['name']?.toString(),
      className: json['className']?.toString(),
      rollNumber: firstNonEmpty([
        json['rollNumber'],
        json['rollNo'],
        json['studentCode'],
        json['admissionNo'],
        json['studentId'],
      ]),
      centerName: json['centerName']?.toString(),
    );
  }

  UserModel copyWith({
    String? childName,
    String? className,
    String? rollNumber,
    String? centerName,
    String? avatar,
  }) {
    return UserModel(
      id: id,
      name: name,
      email: email,
      role: role,
      avatar: avatar ?? this.avatar,
      tenantId: tenantId,
      childName: childName ?? this.childName,
      className: className ?? this.className,
      rollNumber: rollNumber ?? this.rollNumber,
      centerName: centerName ?? this.centerName,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'avatar': avatar,
      'tenantId': tenantId,
      'childName': childName,
      'className': className,
      'rollNumber': rollNumber,
      'centerName': centerName,
    };
  }
}
