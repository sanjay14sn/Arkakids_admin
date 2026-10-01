class FeeInvoiceModel {
  final String id;
  final String title;
  final double amountTotal;
  final double amountPaid;
  final DateTime dueDate;
  final String status; // 'paid' | 'pending' | 'overdue' | 'partial'

  FeeInvoiceModel({
    required this.id,
    required this.title,
    required this.amountTotal,
    required this.amountPaid,
    required this.dueDate,
    required this.status,
  });

  double get amountRemaining => amountTotal - amountPaid;

  factory FeeInvoiceModel.fromJson(Map<String, dynamic> json) {
    return FeeInvoiceModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Term Fee',
      amountTotal: (json['amountTotal'] as num?)?.toDouble() ?? 0.0,
      amountPaid: (json['amountPaid'] as num?)?.toDouble() ?? 0.0,
      dueDate: json['dueDate'] != null
          ? DateTime.tryParse(json['dueDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      status: json['status']?.toString() ?? 'pending',
    );
  }
}
