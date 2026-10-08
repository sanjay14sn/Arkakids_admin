import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/homework_model.dart';

class HomeworkSubmissionScreen extends StatelessWidget {
  final HomeworkModel item;

  const HomeworkSubmissionScreen({super.key, required this.item});

  bool get _isImage {
    final url = (item.submissionUrl ?? '').toLowerCase();
    return url.contains('.png') ||
        url.contains('.jpg') ||
        url.contains('.jpeg') ||
        url.contains('.gif') ||
        url.contains('.webp') ||
        url.contains('.heic');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'Your submission',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF5B0202),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
        children: [
          Text(
            item.subject,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF7B0000),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            item.title,
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF111827),
              height: 1.2,
            ),
          ),
          const SizedBox(height: 18),
          if (item.submissionUrl != null && item.submissionUrl!.startsWith('http'))
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: _isImage
                  ? InteractiveViewer(
                      minScale: 1,
                      maxScale: 4,
                      child: Image.network(
                        item.submissionUrl!,
                        width: double.infinity,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => _fileFallback(),
                      ),
                    )
                  : _fileFallback(),
            )
          else
            _fileFallback(),
        ],
      ),
    );
  }

  Widget _fileFallback() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 48),
      color: const Color(0xFFF3F4F6),
      child: Column(
        children: [
          const Icon(Icons.insert_drive_file_rounded,
              size: 42, color: Color(0xFF9CA3AF)),
          const SizedBox(height: 10),
          Text(
            'Submission file',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF374151),
            ),
          ),
        ],
      ),
    );
  }
}
