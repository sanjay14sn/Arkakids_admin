import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class TeacherAttendanceScreen extends StatefulWidget {
  const TeacherAttendanceScreen({super.key});

  @override
  State<TeacherAttendanceScreen> createState() => _TeacherAttendanceScreenState();
}

class _TeacherAttendanceScreenState extends State<TeacherAttendanceScreen> {
  final List<Map<String, dynamic>> _students = [
    {'id': 'st-1', 'name': 'Emily Parker', 'status': 'present', 'avatar': 'EP'},
    {'id': 'st-2', 'name': 'Leo Miller', 'status': 'present', 'avatar': 'LM'},
    {'id': 'st-3', 'name': 'Sophia Rodriguez', 'status': 'late', 'avatar': 'SR'},
    {'id': 'st-4', 'name': 'Noah Chen', 'status': 'absent', 'avatar': 'NC'},
    {'id': 'st-5', 'name': 'Chloe Dupont', 'status': 'present', 'avatar': 'CD'},
    {'id': 'st-6', 'name': 'Liam Johnson', 'status': 'present', 'avatar': 'LJ'},
  ];

  @override
  Widget build(BuildContext context) {
    int presentCount = _students.where((s) => s['status'] == 'present').length;
    int totalCount = _students.length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Classroom Attendance'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save_rounded),
            tooltip: 'Save Attendance',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Attendance saved successfully! Syncing with center server...'),
                  backgroundColor: AppTheme.success,
                ),
              );
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Class Banner Summary
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Pre-K Sunflowers Batch', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16), overflow: TextOverflow.ellipsis),
                        SizedBox(height: 2),
                        Text('Educator: Ms. Clara Vance', style: TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight), overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Chip(
                    label: Text('$presentCount / $totalCount Present'),
                    backgroundColor: AppTheme.primary,
                    labelStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            Expanded(
              child: ListView.separated(
                itemCount: _students.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final student = _students[index];
                  final status = student['status'];

                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: AppTheme.primaryLight,
                            child: Text(
                              student['avatar'],
                              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              student['name'],
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                          ),
                          Wrap(
                            spacing: 4,
                            children: [
                              _buildStatusToggle('present', 'P', status == 'present', AppTheme.success, () {
                                setState(() => student['status'] = 'present');
                              }),
                              _buildStatusToggle('late', 'L', status == 'late', AppTheme.warning, () {
                                setState(() => student['status'] = 'late');
                              }),
                              _buildStatusToggle('absent', 'A', status == 'absent', AppTheme.danger, () {
                                setState(() => student['status'] = 'absent');
                              }),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusToggle(String key, String label, bool isSelected, Color activeColor, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? activeColor : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? activeColor : Colors.grey.shade300),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.textSecondaryLight,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
