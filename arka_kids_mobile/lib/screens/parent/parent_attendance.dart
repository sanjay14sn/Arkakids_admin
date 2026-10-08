import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/attendance_model.dart';
import '../../theme/app_theme.dart';
import 'child_leave_screen.dart';

class ParentAttendanceScreen extends StatefulWidget {
  const ParentAttendanceScreen({super.key});

  @override
  State<ParentAttendanceScreen> createState() => _ParentAttendanceScreenState();
}

class _ParentAttendanceScreenState extends State<ParentAttendanceScreen> {
  List<AttendanceRecordModel> _records = [];
  bool _loading = true;
  bool _wasVisible = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final token = auth.token;
    final user = auth.user;
    if (token == null || token.isEmpty || user == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    final records = await ApiService.getAttendance(
      token,
      user.id,
      childName: user.childName ?? user.name,
    );
    if (!mounted) return;
    setState(() {
      _records = records;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final visible = TickerMode.of(context);
    if (visible && !_wasVisible) {
      _wasVisible = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _load();
      });
    } else if (!visible) {
      _wasVisible = false;
    }

    final now = DateTime.now();
    final monthPrefix =
        '${now.year}-${now.month.toString().padLeft(2, '0')}';
    final monthRecords =
        _records.where((r) => r.date.startsWith(monthPrefix)).toList();
    final presentDays = monthRecords
        .where((r) =>
            r.status.toLowerCase() == 'present' ||
            r.status.toLowerCase() == 'late')
        .length;
    final absentDays =
        monthRecords.where((r) => r.status.toLowerCase() == 'absent').length;
    final totalDays = monthRecords.length;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      appBar: AppBar(
        title: const Text(
          'Attendance & Leave',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF6B0000),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ChildLeaveScreen()),
          );
          if (mounted) _load();
        },
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Leave', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B0000)))
          : RefreshIndicator(
              onRefresh: _load,
              color: const Color(0xFF8B0000),
              child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
            // Month Overview Header Card
            Container(
              decoration: BoxDecoration(
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
              padding: const EdgeInsets.all(20.0),
              child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  'Monthly Overview',
                                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              SizedBox(width: 8),
                              Text(
                                '${DateTime.now().month}/${DateTime.now().year}',
                                style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              Expanded(child: _buildStatColumn('$presentDays', 'Present', Colors.white)),
                              Expanded(child: _buildStatColumn('$absentDays', 'Absent', Colors.white)),
                              Expanded(child: _buildStatColumn('$totalDays', 'Total', Colors.white)),
                            ],
                          ),
                        ],
                      ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Attendance History',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryLight),
            ),
            const SizedBox(height: 12),

            if (_records.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 36),
                child: Column(
                  children: [
                    Icon(Icons.event_busy_rounded, size: 42, color: Colors.grey.shade400),
                    const SizedBox(height: 10),
                    const Text(
                      'No attendance yet',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Marks from school will appear here after attendance is submitted.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                    ),
                  ],
                ),
              )
            else
            ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _records.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = _records[index];
                    final subtitle = item.checkInTime != null && item.checkInTime!.isNotEmpty
                        ? 'In: ${item.checkInTime}${item.checkOutTime != null && item.checkOutTime!.isNotEmpty ? ' • Out: ${item.checkOutTime}' : ''}'
                        : (item.remarks != null && item.remarks!.isNotEmpty
                            ? item.remarks!
                            : item.status);
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
                          subtitle,
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
                ),
              ],
            ),
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
      case 'leave':
        return AppTheme.goldDark;
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
      case 'leave':
        return Icons.beach_access_rounded;
      case 'absent':
        return Icons.cancel_outlined;
      default:
        return Icons.event_note_rounded;
    }
  }




}
