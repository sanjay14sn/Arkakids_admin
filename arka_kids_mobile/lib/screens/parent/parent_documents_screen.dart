import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'submit_document_screen.dart';

class ParentDocumentsScreen extends StatefulWidget {
  const ParentDocumentsScreen({super.key});

  @override
  State<ParentDocumentsScreen> createState() => _ParentDocumentsScreenState();
}

class _ParentDocumentsScreenState extends State<ParentDocumentsScreen> {
  String _selectedFilter = 'All';

  final List<String> _filters = [
    'All',
    'Identity & Medical',
    'Academic Reports',
    'Forms & Circulars',
    'Certificates & Awards',
  ];

  final List<Map<String, dynamic>> _documents = [
    {
      'title': 'Birth Certificate',
      'category': 'Identity & Medical',
      'status': 'Verified ✓',
      'statusColor': const Color(0xFF10B981),
      'statusBg': const Color(0xFFECFDF5),
      'format': 'PDF',
      'size': '1.4 MB',
      'date': 'Uploaded on 12 Jun 2026',
      'icon': Icons.badge_outlined,
      'color': const Color(0xFF0284C7),
    },
    {
      'title': 'Immunization & Vaccination Record',
      'category': 'Identity & Medical',
      'status': 'Verified ✓',
      'statusColor': const Color(0xFF10B981),
      'statusBg': const Color(0xFFECFDF5),
      'format': 'PDF',
      'size': '2.1 MB',
      'date': 'Uploaded on 14 Jun 2026',
      'icon': Icons.health_and_safety_outlined,
      'color': const Color(0xFFDC2626),
    },
    {
      'title': 'Term 1 Progress Report Card',
      'category': 'Academic Reports',
      'status': 'Issued',
      'statusColor': const Color(0xFF8B0000),
      'statusBg': const Color(0xFFFFEFF1),
      'format': 'PDF',
      'size': '3.8 MB',
      'date': 'Issued on 15 Sep 2026',
      'icon': Icons.analytics_outlined,
      'color': const Color(0xFF8B0000),
    },
    {
      'title': 'Child Aadhaar / Govt ID Proof',
      'category': 'Identity & Medical',
      'status': 'Verified ✓',
      'statusColor': const Color(0xFF10B981),
      'statusBg': const Color(0xFFECFDF5),
      'format': 'JPG',
      'size': '850 KB',
      'date': 'Uploaded on 10 Jun 2026',
      'icon': Icons.verified_user_outlined,
      'color': const Color(0xFFD97706),
    },
    {
      'title': 'School Registration & Admission Form',
      'category': 'Forms & Circulars',
      'status': 'Signed',
      'statusColor': const Color(0xFF7C3AED),
      'statusBg': const Color(0xFFF3E8FF),
      'format': 'PDF',
      'size': '1.9 MB',
      'date': 'Submitted on 01 Jun 2026',
      'icon': Icons.assignment_outlined,
      'color': const Color(0xFF7C3AED),
    },
    {
      'title': 'Annual Health Checkup Summary',
      'category': 'Identity & Medical',
      'status': 'Verified ✓',
      'statusColor': const Color(0xFF10B981),
      'statusBg': const Color(0xFFECFDF5),
      'format': 'PDF',
      'size': '1.2 MB',
      'date': 'Uploaded on 20 Aug 2026',
      'icon': Icons.medical_services_outlined,
      'color': const Color(0xFF16A34A),
    },
  ];

  List<Map<String, dynamic>> get _filteredDocs {
    if (_selectedFilter == 'All') return _documents;
    return _documents
        .where((doc) => doc['category'] == _selectedFilter)
        .toList();
  }

  void _openSubmitDocumentPage(BuildContext context, {String? category, String? title}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SubmitDocumentScreen(
          initialCategory: category,
          initialTitle: title,
        ),
      ),
    );

    if (result != null && result is Map<String, dynamic>) {
      setState(() {
        _documents.insert(0, result);
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🎉 "${result['title']}" submitted successfully! Pending verification.'),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final docs = _filteredDocs;
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(130),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6B0000), Color(0xFF8B0000)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Documents & Records',
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                letterSpacing: -0.2,
                              ),
                            ),
                            Text(
                              'Arjun Sharma · Playgroup A',
                              style: GoogleFonts.inter(
                                color: Colors.white70,
                                fontSize: 12,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => _openSubmitDocumentPage(context),
                        icon: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.add_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                SizedBox(
                  height: 36,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: _filters.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final filter = _filters[index];
                      final isSelected = filter == _selectedFilter;
                      return ChoiceChip(
                        label: Text(filter),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedFilter = filter;
                            });
                          }
                        },
                        labelStyle: GoogleFonts.inter(
                          color: isSelected
                              ? const Color(0xFF8B0000)
                              : Colors.white70,
                          fontSize: 12.5,
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w500,
                        ),
                        selectedColor: Colors.white,
                        backgroundColor: Colors.white.withValues(alpha: 0.15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                          side: BorderSide(
                            color: isSelected
                                ? Colors.white
                                : Colors.white.withValues(alpha: 0.2),
                          ),
                        ),
                        showCheckmark: false,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: () => _openSubmitDocumentPage(context),
              borderRadius: BorderRadius.circular(18),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEFF1),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: const Color(0xFF8B0000).withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFF8B0000),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.cloud_upload_rounded,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Upload Missing Document',
                            style: GoogleFonts.inter(
                              fontSize: 14.5,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF4A0A0A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Need to submit health or id records? Tap here.',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF8C7474),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: Color(0xFF8B0000),
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Verified Records (${docs.length})',
                  style: GoogleFonts.outfit(
                    fontSize: 16.5,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF111827),
                  ),
                ),
                Text(
                  _selectedFilter,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF8B0000),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: docs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final doc = docs[index];
                return _buildDocumentCard(context, doc);
              },
            ),

            const SizedBox(height: 24),

            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(100),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.lock_outline_rounded,
                        size: 15, color: Color(0xFF6B7280)),
                    const SizedBox(width: 6),
                    Text(
                      '256-bit Encrypted & Verified Storage',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildDocumentCard(
      BuildContext context, Map<String, dynamic> doc) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEFEFEF)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: (doc['color'] as Color).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  doc['icon'] as IconData,
                  color: doc['color'] as Color,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            doc['format'].toString(),
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF4B5563),
                            ),
                          ),
                        ),

                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 9, vertical: 3),
                          decoration: BoxDecoration(
                            color: doc['statusBg'] as Color,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            doc['status'].toString(),
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: doc['statusColor'] as Color,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      doc['title'].toString(),
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${doc['date']} · ${doc['size']}',
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
          const SizedBox(height: 14),
          const Divider(height: 1, color: Color(0xFFF3F4F6)),
          const SizedBox(height: 10),

          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Opening ${doc['title']} PDF preview...'),
                      backgroundColor: const Color(0xFF8B0000),
                    ),
                  );
                },
                icon: const Icon(Icons.remove_red_eye_outlined,
                    size: 16, color: Color(0xFF8B0000)),
                label: Text(
                  'View PDF',
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF8B0000),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Downloading ${doc['title']}...'),
                      backgroundColor: const Color(0xFF10B981),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B0000),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                icon: const Icon(Icons.download_rounded, size: 16),
                label: Text(
                  'Download',
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
