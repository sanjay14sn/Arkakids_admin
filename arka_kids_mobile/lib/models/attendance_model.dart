class AttendanceRecordModel {
  final String id;
  final String date; // 'YYYY-MM-DD'
  final String status; // 'present' | 'absent' | 'late' | 'holiday'
  final String? checkInTime;
  final String? checkOutTime;
  final String? remarks;

  AttendanceRecordModel({
    required this.id,
    required this.date,
    required this.status,
    this.checkInTime,
    this.checkOutTime,
    this.remarks,
  });

  factory AttendanceRecordModel.fromJson(Map<String, dynamic> json) {
    return AttendanceRecordModel(
      id: json['id']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      status: json['status']?.toString() ?? 'present',
      checkInTime: json['checkInTime']?.toString(),
      checkOutTime: json['checkOutTime']?.toString(),
      remarks: json['remarks']?.toString(),
    );
  }
}
