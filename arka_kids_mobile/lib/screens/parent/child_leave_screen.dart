import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class ChildLeaveScreen extends StatefulWidget {
  const ChildLeaveScreen({super.key});

  @override
  State<ChildLeaveScreen> createState() => _ChildLeaveScreenState();
}

class _ChildLeaveScreenState extends State<ChildLeaveScreen> {
  bool _isLoading = true;
  List<dynamic> _leaveRequests = [];

  final _reasonController = TextEditingController();
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  bool _isSubmitting = false;
  String? _cancellingId;

  @override
  void initState() {
    super.initState();
    _fetchLeaveRequests();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _fetchLeaveRequests() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token ?? '';
      final response = await ApiService.get('/attendance/child-leave', token: token);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _leaveRequests = data is List ? data : [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching leaves: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submitLeave() async {
    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a reason'),
          backgroundColor: Color(0xFFB45309),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      final auth = context.read<AuthProvider>();
      final token = auth.token ?? '';
      final user = auth.user;
      final response = await ApiService.post(
        '/attendance/child-leave',
        token: token,
        body: {
          'childId': user?.id ?? '',
          'childName': user?.childName ?? user?.name ?? 'Student',
          'className': user?.className ?? '',
          'parentName': user?.name ?? 'Parent',
          'fromDate': _startDate.toIso8601String().split('T')[0],
          'toDate': _endDate.toIso8601String().split('T')[0],
          'reason': _reasonController.text.trim(),
          'requestedBy': user?.name ?? 'Parent',
        },
      );

      if (!mounted) return;
      if (response.statusCode == 201 || response.statusCode == 200) {
        _reasonController.clear();
        await _fetchLeaveRequests();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Leave request submitted'),
            backgroundColor: Color(0xFF6B0000),
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not submit request. Try again.'),
            backgroundColor: Color(0xFFB45309),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      debugPrint('Submit error: $e');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _cancelLeave(dynamic req) async {
    final id = (req['_id'] ?? req['id'] ?? '').toString();
    if (id.isEmpty) return;
    setState(() => _cancellingId = id);
    try {
      final token = context.read<AuthProvider>().token ?? '';
      final response = await ApiService.put(
        '/attendance/child-leave/$id/review',
        token: token,
        body: {'status': 'cancelled'},
      );
      if (!mounted) return;
      if (response.statusCode == 200) {
        await _fetchLeaveRequests();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Leave cancelled'),
            backgroundColor: Color(0xFF6B0000),
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not cancel leave. Try again.'),
            backgroundColor: Color(0xFFB45309),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      debugPrint('Cancel error: $e');
    } finally {
      if (mounted) setState(() => _cancellingId = null);
    }
  }

  Future<DateTime?> _pickDate(DateTime initial, DateTime first) {
    return showDatePicker(
      context: context,
      initialDate: initial.isBefore(first) ? first : initial,
      firstDate: first,
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF8B0000),
              onPrimary: Colors.white,
              onSurface: Color(0xFF111827),
            ),
          ),
          child: child!,
        );
      },
    );
  }

  String _fmt(DateTime d) => '${d.day}/${d.month}/${d.year}';

  @override
  Widget build(BuildContext context) {
    int pending = _leaveRequests.where((l) => l['status'] == 'pending').length;
    int approved = _leaveRequests.where((l) => l['status'] == 'approved').length;
    int rejected = _leaveRequests.where((l) => l['status'] == 'rejected').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      appBar: AppBar(
        title: Text(
          'Child Leave',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: const Color(0xFF6B0000),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B0000)))
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Request leave for your child. Once approved, it is marked on the attendance register.',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF4B5563),
                      fontSize: 13.5,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFEFEFEF)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'New request',
                          style: GoogleFonts.outfit(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              child: _dateField(
                                label: 'From Date',
                                value: _fmt(_startDate),
                                onTap: () async {
                                  final date = await _pickDate(_startDate, DateTime.now());
                                  if (date != null) {
                                    setState(() {
                                      _startDate = date;
                                      if (_endDate.isBefore(_startDate)) {
                                        _endDate = _startDate;
                                      }
                                    });
                                  }
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _dateField(
                                label: 'To Date',
                                value: _fmt(_endDate),
                                onTap: () async {
                                  final date = await _pickDate(_endDate, _startDate);
                                  if (date != null) setState(() => _endDate = date);
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Reason',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF374151),
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _reasonController,
                          maxLines: 3,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: const Color(0xFF111827),
                          ),
                          decoration: InputDecoration(
                            hintText: 'Why is your child taking leave?',
                            hintStyle: GoogleFonts.inter(color: const Color(0xFF9CA3AF)),
                            filled: true,
                            fillColor: const Color(0xFFF9FAFB),
                            contentPadding: const EdgeInsets.all(14),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFF8B0000), width: 1.6),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : _submitLeave,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF8B0000),
                              foregroundColor: Colors.white,
                              disabledBackgroundColor:
                                  const Color(0xFF8B0000).withValues(alpha: 0.5),
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: _isSubmitting
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : Text(
                                    'Submit request',
                                    style: GoogleFonts.inter(
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Expanded(child: _statBox('Pending', pending.toString(), const Color(0xFFB45309), const Color(0xFFFEF3C7))),
                      const SizedBox(width: 8),
                      Expanded(child: _statBox('Approved', approved.toString(), const Color(0xFF15803D), const Color(0xFFDCFCE7))),
                      const SizedBox(width: 8),
                      Expanded(child: _statBox('Rejected', rejected.toString(), const Color(0xFFB91C1C), const Color(0xFFFEE2E2))),
                    ],
                  ),
                  const SizedBox(height: 22),
                  Text(
                    'Leave requests',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (_leaveRequests.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 28),
                        child: Text(
                          'No leave requests yet.',
                          style: GoogleFonts.inter(
                            fontSize: 13.5,
                            color: const Color(0xFF6B7280),
                          ),
                        ),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _leaveRequests.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final req = _leaveRequests[index];
                        final status = (req['status'] ?? 'pending').toString().toLowerCase();
                        final reqId = (req['_id'] ?? req['id'] ?? '').toString();
                        Color statusColor = const Color(0xFFB45309);
                        Color statusBg = const Color(0xFFFEF3C7);
                        if (status == 'approved') {
                          statusColor = const Color(0xFF15803D);
                          statusBg = const Color(0xFFDCFCE7);
                        }
                        if (status == 'rejected') {
                          statusColor = const Color(0xFFB91C1C);
                          statusBg = const Color(0xFFFEE2E2);
                        }
                        if (status == 'cancelled') {
                          statusColor = const Color(0xFF4B5563);
                          statusBg = const Color(0xFFF3F4F6);
                        }
                        final from = (req['fromDate'] ?? req['startDate'] ?? '').toString();
                        final to = (req['toDate'] ?? req['endDate'] ?? from).toString();

                        return Container(
                          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFEFEFEF)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      req['reason'] ?? 'No reason provided',
                                      style: GoogleFonts.inter(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                        color: const Color(0xFF111827),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '$from to $to',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: const Color(0xFF6B7280),
                                      ),
                                    ),
                                    if (status == 'pending' || status == 'approved') ...[
                                      const SizedBox(height: 8),
                                      TextButton(
                                        onPressed: _cancellingId == reqId
                                            ? null
                                            : () => _cancelLeave(req),
                                        style: TextButton.styleFrom(
                                          foregroundColor: const Color(0xFF8B0000),
                                          padding: EdgeInsets.zero,
                                          minimumSize: const Size(0, 0),
                                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                        ),
                                        child: Text(
                                          _cancellingId == reqId ? 'Cancelling…' : 'Cancel leave',
                                          style: GoogleFonts.inter(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: statusBg,
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: Text(
                                  status.toUpperCase(),
                                  style: GoogleFonts.inter(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: statusColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
    );
  }

  Widget _dateField({
    required String label,
    required String value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 6),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF111827),
                    ),
                  ),
                ),
                const Icon(Icons.calendar_today_rounded, size: 16, color: Color(0xFF8B0000)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statBox(String title, String value, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF111827),
            ),
          ),
        ],
      ),
    );
  }
}
