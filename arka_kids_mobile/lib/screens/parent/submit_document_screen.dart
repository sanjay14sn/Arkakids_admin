import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SubmitDocumentScreen extends StatefulWidget {
  final String? initialCategory;
  final String? initialTitle;

  const SubmitDocumentScreen({
    super.key,
    this.initialCategory,
    this.initialTitle,
  });

  @override
  State<SubmitDocumentScreen> createState() => _SubmitDocumentScreenState();
}

class _SubmitDocumentScreenState extends State<SubmitDocumentScreen> {
  final _formKey = GlobalKey<FormState>();

  late String _selectedCategory;
  late TextEditingController _titleController;
  final TextEditingController _documentIdController = TextEditingController();
  final TextEditingController _remarksController = TextEditingController();

  DateTime? _expiryDate;
  bool _isDeclarationAgreed = true;
  bool _isSubmitting = false;

  // Selected file simulation state
  Map<String, String>? _selectedFile;

  final List<String> _categories = [
    'Identity & Medical',
    'Academic Reports',
    'Forms & Circulars',
    'Certificates & Awards',
    'Other',
  ];

  final List<String> _suggestedTitles = [
    'Birth Certificate',
    'Immunization & Vaccination Record',
    'Child Aadhaar / Govt ID Proof',
    'Passport / Visa Copy',
    'School Registration Form',
    'Annual Health Checkup Summary',
    'Transfer / Leaving Certificate',
    'Achievement / Sports Certificate',
  ];

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory ?? 'Identity & Medical';
    _titleController = TextEditingController(text: widget.initialTitle ?? '');

    // Default sample attached file to make UX super responsive
    _selectedFile = {
      'name': widget.initialTitle != null
          ? '${widget.initialTitle!.replaceAll(' ', '_').toLowerCase()}.pdf'
          : 'student_document_scan.pdf',
      'size': '1.8 MB',
      'format': 'PDF',
      'type': 'Document',
    };
  }

  @override
  void dispose() {
    _titleController.dispose();
    _documentIdController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  void _pickSource(String sourceType) {
    setState(() {
      if (sourceType == 'Camera') {
        _selectedFile = {
          'name': 'camera_scan_${DateTime.now().millisecondsSinceEpoch}.jpg',
          'size': '2.4 MB',
          'format': 'JPG',
          'type': 'Photo Scan',
        };
      } else if (sourceType == 'Gallery') {
        _selectedFile = {
          'name': 'gallery_photo_${DateTime.now().millisecondsSinceEpoch}.png',
          'size': '3.1 MB',
          'format': 'PNG',
          'type': 'Image File',
        };
      } else {
        _selectedFile = {
          'name': 'document_${DateTime.now().millisecondsSinceEpoch}.pdf',
          'size': '1.5 MB',
          'format': 'PDF',
          'type': 'PDF Document',
        };
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Attached file via $sourceType! Ready for submission.'),
        backgroundColor: const Color(0xFF10B981),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _selectExpiryDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _expiryDate ?? now.add(const Duration(days: 365)),
      firstDate: now,
      lastDate: DateTime(now.year + 10),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF8B0000),
              onPrimary: Colors.white,
              onSurface: Color(0xFF1F2937),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _expiryDate = picked;
      });
    }
  }

  void _submitDocument() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please upload or attach a document file first.'),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
      return;
    }

    if (!_isDeclarationAgreed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please confirm the document authenticity declaration.'),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    // Simulate server upload delay
    await Future.delayed(const Duration(milliseconds: 1200));

    if (!mounted) return;

    final newDoc = {
      'title': _titleController.text.trim().isEmpty
          ? 'Submitted Document'
          : _titleController.text.trim(),
      'category': _selectedCategory,
      'status': 'Pending Verification',
      'statusColor': const Color(0xFFD97706), // Amber
      'statusBg': const Color(0xFFFFFBEB),
      'format': _selectedFile!['format'] ?? 'PDF',
      'size': _selectedFile!['size'] ?? '2.0 MB',
      'date':
          'Uploaded on ${DateTime.now().day} ${_monthName(DateTime.now().month)} ${DateTime.now().year}',
      'icon': _getCategoryIcon(_selectedCategory),
      'color': const Color(0xFF8B0000),
    };

    Navigator.pop(context, newDoc);
  }

  IconData _getCategoryIcon(String cat) {
    switch (cat) {
      case 'Identity & Medical':
        return Icons.health_and_safety_outlined;
      case 'Academic Reports':
        return Icons.analytics_outlined;
      case 'Forms & Circulars':
        return Icons.assignment_outlined;
      case 'Certificates & Awards':
        return Icons.workspace_premium_outlined;
      default:
        return Icons.description_outlined;
    }
  }

  String _monthName(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return months[month - 1];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(80),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6B0000), Color(0xFF8B0000)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Submit Document & Certificate',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 18.5,
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.2,
                          ),
                        ),
                        Text(
                          'Upload student records for school verification',
                          style: GoogleFonts.inter(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Child Profile Info Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFEFF1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.child_care_rounded,
                        color: Color(0xFF8B0000),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Arjun Sharma',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF111827),
                            ),
                          ),
                          Text(
                            'Playgroup A • Roll #07 • Admission ID: AK-2026-042',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Step 1: Select Category
              Text(
                '1. Document Category',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 38,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final cat = _categories[index];
                    final isSelected = cat == _selectedCategory;
                    return ChoiceChip(
                      label: Text(cat),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedCategory = cat;
                          });
                        }
                      },
                      selectedColor: const Color(0xFF8B0000),
                      backgroundColor: Colors.white,
                      labelStyle: GoogleFonts.inter(
                        color: isSelected ? Colors.white : const Color(0xFF374151),
                        fontSize: 12.5,
                        fontWeight:
                            isSelected ? FontWeight.bold : FontWeight.w500,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100),
                        side: BorderSide(
                          color: isSelected
                              ? const Color(0xFF8B0000)
                              : const Color(0xFFE5E7EB),
                        ),
                      ),
                      showCheckmark: false,
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),

              // Step 2: Document Title
              Text(
                '2. Document Title / Name',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(
                  hintText: 'e.g. Birth Certificate or Vaccine Card',
                  hintStyle: GoogleFonts.inter(
                    fontSize: 13.5,
                    color: const Color(0xFF9CA3AF),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  prefixIcon: const Icon(
                    Icons.title_rounded,
                    color: Color(0xFF8B0000),
                    size: 20,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(
                      color: Color(0xFF8B0000),
                      width: 1.5,
                    ),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a document title';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 10),

              // Quick title pills
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: _suggestedTitles.map((title) {
                  return InkWell(
                    onTap: () {
                      setState(() {
                        _titleController.text = title;
                      });
                    },
                    borderRadius: BorderRadius.circular(100),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFEFF1),
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(
                          color: const Color(0xFF8B0000).withValues(alpha: 0.15),
                        ),
                      ),
                      child: Text(
                        '+ $title',
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF8B0000),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 22),

              // Step 3: Attach File / Upload Zone
              Text(
                '3. Upload File (PDF / JPG / PNG)',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 10),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: _selectedFile != null
                        ? const Color(0xFF10B981)
                        : const Color(0xFFD1D5DB),
                    width: _selectedFile != null ? 1.5 : 1,
                  ),
                ),
                child: Column(
                  children: [
                    if (_selectedFile != null) ...[
                      // File Attached Preview Card
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Center(
                                child: Text(
                                  _selectedFile!['format'] ?? 'PDF',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _selectedFile!['name']!,
                                    style: GoogleFonts.inter(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF065F46),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${_selectedFile!['size']} • Ready to Upload',
                                    style: GoogleFonts.inter(
                                      fontSize: 11.5,
                                      color: const Color(0xFF047857),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.check_circle_rounded,
                              color: Color(0xFF10B981),
                              size: 22,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    Text(
                      _selectedFile == null
                          ? 'Select how you want to upload your document'
                          : 'Change or upload another file source:',
                      style: GoogleFonts.inter(
                        fontSize: 12.5,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: _buildSourceBtn(
                            icon: Icons.camera_alt_rounded,
                            label: 'Camera',
                            onTap: () => _pickSource('Camera'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildSourceBtn(
                            icon: Icons.photo_library_rounded,
                            label: 'Gallery',
                            onTap: () => _pickSource('Gallery'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildSourceBtn(
                            icon: Icons.picture_as_pdf_rounded,
                            label: 'PDF File',
                            onTap: () => _pickSource('PDF File'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),

              // Step 4: Additional Optional Fields
              Text(
                '4. Additional Information (Optional)',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 10),

              // Doc ID / Serial Number
              TextFormField(
                controller: _documentIdController,
                decoration: InputDecoration(
                  labelText: 'Document Serial / ID Number (Optional)',
                  hintText: 'e.g. REG-88239-2026',
                  filled: true,
                  fillColor: Colors.white,
                  prefixIcon: const Icon(
                    Icons.pin_rounded,
                    color: Color(0xFF6B7280),
                    size: 20,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Expiry Date Selector Row
              InkWell(
                onTap: _selectExpiryDate,
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.event_outlined,
                        color: Color(0xFF8B0000),
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _expiryDate == null
                              ? 'Document Expiry Date (If applicable)'
                              : 'Expiry Date: ${_expiryDate!.day}/${_expiryDate!.month}/${_expiryDate!.year}',
                          style: GoogleFonts.inter(
                            fontSize: 13.5,
                            color: _expiryDate == null
                                ? const Color(0xFF6B7280)
                                : const Color(0xFF111827),
                            fontWeight: _expiryDate == null
                                ? FontWeight.normal
                                : FontWeight.bold,
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.calendar_month_rounded,
                        color: Color(0xFF6B7280),
                        size: 18,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Remarks
              TextFormField(
                controller: _remarksController,
                maxLines: 2,
                decoration: InputDecoration(
                  labelText: 'Notes / Remarks for Coordinator (Optional)',
                  hintText: 'Add any extra context regarding this document...',
                  filled: true,
                  fillColor: Colors.white,
                  prefixIcon: const Icon(
                    Icons.edit_note_rounded,
                    color: Color(0xFF6B7280),
                    size: 22,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Authenticity Declaration Checkbox
              CheckboxListTile(
                value: _isDeclarationAgreed,
                onChanged: (val) {
                  setState(() {
                    _isDeclarationAgreed = val ?? false;
                  });
                },
                activeColor: const Color(0xFF8B0000),
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                title: Text(
                  'I declare that the document attached is genuine, authentic, and clear.',
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    color: const Color(0xFF374151),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitDocument,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B0000),
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _isSubmitting
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Submitting Document...',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.cloud_upload_rounded, size: 22),
                            const SizedBox(width: 10),
                            Text(
                              'Submit Document for Verification',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSourceBtn({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFEFF1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFF8B0000).withValues(alpha: 0.2),
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF8B0000), size: 22),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF8B0000),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
