import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../theme/app_theme.dart';

class TeacherJournalUploadScreen extends StatefulWidget {
  const TeacherJournalUploadScreen({super.key});

  @override
  State<TeacherJournalUploadScreen> createState() => _TeacherJournalUploadScreenState();
}

class _TeacherJournalUploadScreenState extends State<TeacherJournalUploadScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  File? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  final List<String> _availableStudents = ['Emily Parker', 'Leo Miller', 'Sophia Rodriguez', 'Noah Chen', 'Chloe Dupont'];
  final Set<String> _selectedStudents = {'Emily Parker'};
  String _category = 'activity';

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? photo = await _picker.pickImage(source: source, imageQuality: 85);
      if (photo != null) {
        setState(() {
          _selectedImage = File(photo.path);
        });
      }
    } catch (_) {
      // Fallback for emulator / mock testing
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Post Daily Journal Moment'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Selector Container
            GestureDetector(
              onTap: () => _showPickerModal(),
              child: Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppTheme.primaryLight,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3), style: BorderStyle.solid),
                ),
                child: _selectedImage != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: Image.file(_selectedImage!, fit: BoxFit.cover),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.add_a_photo_rounded, size: 48, color: AppTheme.primary),
                          SizedBox(height: 10),
                          Text(
                            'Tap to Take Photo or Choose Gallery',
                            style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Capture a cute moment from today’s class',
                            style: TextStyle(color: AppTheme.textSecondaryLight, fontSize: 12),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 20),

            // Category Selector
            const Text('Moment Category:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildCatChoice('activity', '🎨 Activity'),
                _buildCatChoice('learning', '📚 Lesson'),
                _buildCatChoice('meal', '🍎 Meal/Snack'),
              ],
            ),
            const SizedBox(height: 16),

            // Title Field
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Moment Title',
                hintText: 'e.g. Clay Modeling & Finger Painting',
              ),
            ),
            const SizedBox(height: 16),

            // Description Field
            TextField(
              controller: _descController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Activity Details / Educator Notes',
                hintText: 'Write a short description for parents to read...',
              ),
            ),
            const SizedBox(height: 20),

            // Student Multi-Select Tagging
            const Text('Tag Students:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _availableStudents.map((student) {
                final isSelected = _selectedStudents.contains(student);
                return FilterChip(
                  label: Text(student),
                  selected: isSelected,
                  selectedColor: AppTheme.primary,
                  backgroundColor: AppTheme.primaryLight,
                  checkmarkColor: Colors.white,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppTheme.primary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  ),
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        _selectedStudents.add(student);
                      } else {
                        _selectedStudents.remove(student);
                      }
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 28),

            // Publish Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Daily Moment published to Parent feed!'),
                      backgroundColor: AppTheme.success,
                    ),
                  );
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.send_rounded, color: Colors.white),
                label: const Text('Publish Moment to Parents', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCatChoice(String value, String label) {
    final isSel = _category == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSel,
      selectedColor: AppTheme.primary,
      backgroundColor: Colors.grey.shade200,
      labelStyle: TextStyle(color: isSel ? Colors.white : AppTheme.textPrimaryLight, fontWeight: isSel ? FontWeight.bold : FontWeight.normal),
      onSelected: (sel) {
        if (sel) setState(() => _category = value);
      },
    );
  }

  void _showPickerModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded, color: AppTheme.primary),
              title: const Text('Take Photo with Camera'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded, color: AppTheme.primary),
              title: const Text('Choose from Photo Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }
}
