import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/attendance_model.dart';
import '../../theme/app_theme.dart';

class ParentAttendanceScreen extends StatefulWidget {
  const ParentAttendanceScreen({super.key});

  @override
  State<ParentAttendanceScreen> createState() => _ParentAttendanceScreenState();
}

class _ParentAttendanceScreenState extends State<ParentAttendanceScreen> {
  late Future<List<AttendanceRecordModel>> _attendanceFuture;

  @override
  void initState() {
    super.initState();
    _attendanceFuture = ApiService.getAttendance();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance & Leave'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showLeaveRequestBottomSheet,
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Apply Child Leave', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Month Overview Header Card
            Container(
              decoration: BoxDecoration(
                color: AppTheme.primary,
                gradient: AppTheme.headerGradient,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Stack(
                  children: [
                    // Container Background Image Overlay
                    Positioned(
                      right: -10,
                      bottom: -15,
                      child: Opacity(
                        opacity: 0.20,
                        child: Image.asset(
                          'assets/icons/story_playtime.png',
                          width: 140,
                          height: 140,
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) => Image.asset(
                            'assets/icons/app_icon.png',
                            width: 120,
                            height: 120,
                            opacity: const AlwaysStoppedAnimation(0.15),
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: const [
                              Expanded(
                                child: Text(
                                  'Monthly Overview',
                                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              SizedBox(width: 8),
                              Text(
                                'August 2026',
                                style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              Expanded(child: _buildStatColumn('22 Days', 'Present', Colors.white)),
                              Expanded(child: _buildStatColumn('1 Day', 'Late Check-in', Colors.amberAccent)),
                              Expanded(child: _buildStatColumn('0 Days', 'Unexcused', Colors.white70)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Attendance History',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryLight),
            ),
            const SizedBox(height: 12),

            FutureBuilder<List<AttendanceRecordModel>>(
              future: _attendanceFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                final records = snapshot.data ?? [];

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: records.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = records[index];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: _getStatusColor(item.status).withValues(alpha: 0.15),
                          child: Icon(
                            _getStatusIcon(item.status),
                            color: _getStatusColor(item.status),
                            size: 20,
                          ),
                        ),
                        title: Text(
                          _formatDateDDMMYYYY(item.date),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        subtitle: Text(
                          item.checkInTime != null
                              ? 'In: ${item.checkInTime} • Out: ${item.checkOutTime ?? "N/A"}'
                              : (item.remarks ?? 'Absent'),
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStatusColor(item.status).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            item.status.toUpperCase(),
                            style: TextStyle(
                              color: _getStatusColor(item.status),
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateDDMMYYYY(String dateStr) {
    if (dateStr.isEmpty) return dateStr;
    try {
      final parts = dateStr.split('-');
      if (parts.length == 3) {
        if (parts[0].length == 4) {
          // yyyy-mm-dd -> dd-mm-yyyy
          return '${parts[2].padLeft(2, '0')}-${parts[1].padLeft(2, '0')}-${parts[0]}';
        } else if (parts[2].length == 4) {
          // dd-mm-yyyy or d-m-yyyy
          return '${parts[0].padLeft(2, '0')}-${parts[1].padLeft(2, '0')}-${parts[2]}';
        }
      }
      final parsed = DateTime.tryParse(dateStr);
      if (parsed != null) {
        return '${parsed.day.toString().padLeft(2, '0')}-${parsed.month.toString().padLeft(2, '0')}-${parsed.year}';
      }
    } catch (_) {}
    return dateStr;
  }

  Widget _buildStatColumn(String number, String label, Color color) {
    return Column(
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            number,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 11, color: Colors.white70),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'present':
        return AppTheme.success;
      case 'late':
        return AppTheme.warning;
      case 'absent':
        return AppTheme.danger;
      default:
        return AppTheme.primary;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'present':
        return Icons.check_circle_outline_rounded;
      case 'late':
        return Icons.access_time_rounded;
      case 'absent':
        return Icons.cancel_outlined;
      default:
        return Icons.event_note_rounded;
    }
  }

  void _showLeaveRequestBottomSheet() {
    DateTime fromDate = DateTime.now().add(const Duration(days: 1));
    DateTime toDate = DateTime.now().add(const Duration(days: 1));
    String selectedLeaveType = 'Sick Leave';
    String leaveDurationType = 'Full Day';
    final reasonController = TextEditingController();
    final contactController = TextEditingController(text: '+91 98765 43210');
    bool notifyTeacher = true;

    final leaveTypes = [
      {'label': 'Sick Leave', 'icon': Icons.medical_services_rounded},
      {'label': 'Family Vacation', 'icon': Icons.flight_takeoff_rounded},
      {'label': 'Personal Function', 'icon': Icons.cake_rounded},
      {'label': 'Other', 'icon': Icons.edit_note_rounded},
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          String formatDate(DateTime dt) =>
              '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';

          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            padding: EdgeInsets.only(
              top: 20,
              left: 20,
              right: 20,
              bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle Bar
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.event_note_rounded,
                              color: AppTheme.primary,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'Apply Child Leave',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF111827),
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                Text(
                                  'Submit absence request for coordinator approval',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF6B7280),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.close_rounded, color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Scrollable Sheet Content
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [

                  // Child Info Card
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryLight,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: AppTheme.primary,
                          child: const Icon(Icons.child_care_rounded, color: Colors.white, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: const [
                              Text(
                                'Arjun Sharma',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryDark,
                                ),
                              ),
                              Text(
                                'Sunflower Class • Roll #07',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.secondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.success.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: const Text(
                            'Active Student',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.success,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Leave Category Selection
                  const Text(
                    'Leave Category',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF374151),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: leaveTypes.map((item) {
                      final label = item['label'] as String;
                      final icon = item['icon'] as IconData;
                      final isSelected = selectedLeaveType == label;
                      return ChoiceChip(
                        avatar: Icon(
                          icon,
                          size: 16,
                          color: isSelected ? Colors.white : AppTheme.primary,
                        ),
                        label: Text(label),
                        selected: isSelected,
                        selectedColor: AppTheme.primary,
                        backgroundColor: const Color(0xFFF3F4F6),
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : const Color(0xFF374151),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                        onSelected: (val) {
                          setModalState(() {
                            selectedLeaveType = label;
                          });
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 18),

                  // Duration Type Selector (Full Day / Half Day / Multiple Days)
                  Row(
                    children: ['Full Day', 'Half Day', 'Multiple Days'].map((dType) {
                      final isSelected = leaveDurationType == dType;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setModalState(() {
                              leaveDurationType = dType;
                            });
                          },
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            decoration: BoxDecoration(
                              color: isSelected ? AppTheme.primary : const Color(0xFFF3F4F6),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: Text(
                                dType,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? Colors.white : const Color(0xFF4B5563),
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 18),

                  // Date Picker Row
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'From Date',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF374151),
                              ),
                            ),
                            const SizedBox(height: 6),
                            InkWell(
                              onTap: () async {
                                final picked = await showDatePicker(
                                  context: context,
                                  initialDate: fromDate,
                                  firstDate: DateTime.now(),
                                  lastDate: DateTime.now().add(const Duration(days: 90)),
                                );
                                if (picked != null) {
                                  setModalState(() {
                                    fromDate = picked;
                                    if (toDate.isBefore(fromDate)) {
                                      toDate = fromDate;
                                    }
                                  });
                                }
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF9FAFB),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFFE5E7EB)),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      formatDate(fromDate),
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF111827),
                                      ),
                                    ),
                                    const Icon(Icons.calendar_today_rounded, size: 16, color: AppTheme.primary),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'To Date',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF374151),
                              ),
                            ),
                            const SizedBox(height: 6),
                            InkWell(
                              onTap: () async {
                                final picked = await showDatePicker(
                                  context: context,
                                  initialDate: toDate,
                                  firstDate: fromDate,
                                  lastDate: DateTime.now().add(const Duration(days: 90)),
                                );
                                if (picked != null) {
                                  setModalState(() {
                                    toDate = picked;
                                  });
                                }
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF9FAFB),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFFE5E7EB)),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      formatDate(toDate),
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF111827),
                                      ),
                                    ),
                                    const Icon(Icons.calendar_today_rounded, size: 16, color: AppTheme.primary),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Reason & Notes Field
                  const Text(
                    'Reason & Notes for Teacher',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF374151),
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: reasonController,
                    maxLines: 3,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'e.g. High fever and doctor recommended 2 days rest...',
                      hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12.5),
                      fillColor: const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Emergency Contact Field
                  const Text(
                    'Emergency Contact Number',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF374151),
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: contactController,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.phone_rounded, size: 18, color: AppTheme.primary),
                      fillColor: const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Notify Teacher Checkbox
                  Row(
                    children: [
                      SizedBox(
                        height: 24,
                        width: 24,
                        child: Checkbox(
                          value: notifyTeacher,
                          activeColor: AppTheme.primary,
                          onChanged: (val) {
                            setModalState(() {
                              notifyTeacher = val ?? true;
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'Send immediate WhatsApp & App notification to Class Coordinator',
                          style: TextStyle(fontSize: 12, color: Color(0xFF4B5563)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 22),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Row(
                              children: const [
                                Icon(Icons.check_circle_rounded, color: Colors.white),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text('Child leave request submitted successfully!'),
                                ),
                              ],
                            ),
                            backgroundColor: AppTheme.success,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.brightRed,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'Submit Leave Request',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
        },
      ),
    );
  }
}
