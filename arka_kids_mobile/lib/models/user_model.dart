class UserModel {
  final String id;
  final String name;
  final String email;
  final String role; // 'super_admin' | 'owner' | 'trainer' | 'student' | 'bde'
  final String? avatar;
  final String? tenantId;
  final String? childName;
  final String? className;
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
    this.centerName,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'User',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'student',
      avatar: json['avatar']?.toString(),
      tenantId: json['tenantId']?.toString(),
      childName: json['childName']?.toString(),
      className: json['className']?.toString(),
      centerName: json['centerName']?.toString(),
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
      'centerName': centerName,
    };
  }
}
