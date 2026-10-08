import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class _DocSlot {
  final String key;
  final String label;
  final IconData icon;
  const _DocSlot(this.key, this.label, this.icon);
}

const _slots = [
  _DocSlot('birth_certificate', 'Birth certificate', Icons.description_outlined),
  _DocSlot('aadhaar', 'Aadhaar', Icons.badge_outlined),
  _DocSlot('parent_id', 'Parent ID', Icons.badge_outlined),
  _DocSlot('child_photo', 'Child photo', Icons.photo_outlined),
  _DocSlot('medical_form', 'Medical form', Icons.medical_information_outlined),
];

class ParentDocumentsScreen extends StatefulWidget {
  const ParentDocumentsScreen({super.key});

  @override
  State<ParentDocumentsScreen> createState() => _ParentDocumentsScreenState();
}

class _ParentDocumentsScreenState extends State<ParentDocumentsScreen> {
  List<Map<String, dynamic>> _documents = [];
  String? _uploadingKey;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDocuments();
  }

  Map<String, dynamic>? _match(_DocSlot slot) {
    for (final doc in _documents) {
      final type = (doc['type'] ?? '').toString().toLowerCase();
      final name = (doc['name'] ?? '').toString().toLowerCase();
      if (type == slot.key || name == slot.label.toLowerCase()) return doc;
    }
    return null;
  }

  Future<void> _fetchDocuments() async {
    final token = context.read<AuthProvider>().token ?? '';
    final docs = await ApiService.getDocuments(token);
    if (!mounted) return;
    setState(() {
      _documents = docs;
      _isLoading = false;
    });
  }

  Future<void> _upload(_DocSlot slot) async {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Upload ${slot.label}',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 12),
                ListTile(
                  leading: const Icon(Icons.photo_library_rounded, color: Color(0xFF8B0000)),
                  title: const Text('Choose from gallery'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickAndUpload(slot, ImageSource.gallery);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.photo_camera_rounded, color: Color(0xFF8B0000)),
                  title: const Text('Take a photo'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickAndUpload(slot, ImageSource.camera);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _pickAndUpload(_DocSlot slot, ImageSource source) async {
    final auth = context.read<AuthProvider>();
    final token = auth.token;
    final user = auth.user;
    if (token == null || user == null) return;

    final photo = await ImagePicker().pickImage(source: source, imageQuality: 85);
    if (photo == null || !mounted) return;

    setState(() => _uploadingKey = slot.key);
    try {
      final url = await ApiService.uploadFile(token, photo.path, scope: 'documents');
      final ok = await ApiService.createChildDocument(
        token,
        studentId: user.id,
        studentName: user.childName ?? user.name,
        name: slot.label,
        type: slot.key,
        url: url,
      );
      if (!mounted) return;
      if (ok) {
        await _fetchDocuments();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${slot.label} uploaded'),
            backgroundColor: const Color(0xFF6B0000),
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not save the document. Try again.'),
            backgroundColor: Color(0xFFB45309),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not upload the file. Try again.'),
          backgroundColor: Color(0xFFB45309),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _uploadingKey = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      appBar: AppBar(
        title: Text(
          'Documents & Certificates',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF6B0000),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? _buildShimmer()
          : ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        itemCount: _slots.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final slot = _slots[index];
          final doc = _match(slot);
          final url = (doc?['url'] ?? '').toString();
          final hasFile = url.startsWith('http');
          final rawStatus = (doc?['status'] ?? '').toString().toLowerCase();
          final verified = rawStatus == 'verified';
          final pending = hasFile && !verified;
          final uploading = _uploadingKey == slot.key;
          final statusLabel = verified
              ? 'Verified'
              : pending
                  ? 'Verification pending'
                  : 'Missing';
          final statusHint = verified
              ? 'Verified by school'
              : pending
                  ? 'Waiting for school to verify'
                  : 'No file uploaded yet';
          final statusColor = verified
              ? const Color(0xFF15803D)
              : pending
                  ? const Color(0xFFB45309)
                  : const Color(0xFF6B7280);
          final statusBg = verified
              ? const Color(0xFFDCFCE7)
              : pending
                  ? const Color(0xFFFEF3C7)
                  : const Color(0xFFF3F4F6);
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFF0E4E4)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.all(Radius.circular(14)),
                  ),
                  child: Icon(slot.icon, color: const Color(0xFF8B0000), size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              slot.label,
                              style: GoogleFonts.inter(
                                fontSize: 15.5,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF111827),
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusBg,
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Text(
                              statusLabel,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        statusHint,
                        style: GoogleFonts.inter(
                          fontSize: 12.5,
                          color: const Color(0xFF6B7280),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerRight,
                        child: ElevatedButton.icon(
                          onPressed: uploading ? null : () => _upload(slot),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF8B0000),
                            foregroundColor: Colors.white,
                            disabledBackgroundColor:
                                const Color(0xFF8B0000).withValues(alpha: 0.5),
                            elevation: 0,
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(100),
                            ),
                          ),
                          icon: Icon(
                            uploading
                                ? Icons.hourglass_top_rounded
                                : hasFile
                                    ? Icons.sync_rounded
                                    : Icons.upload_rounded,
                            size: 15,
                          ),
                          label: Text(
                            uploading
                                ? 'Uploading…'
                                : hasFile
                                    ? 'Replace'
                                    : 'Upload',
                            style: GoogleFonts.inter(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: const Color(0xFFE5E7EB),
      highlightColor: const Color(0xFFF9FAFB),
      child: ListView.separated(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        itemCount: _slots.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) {
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: 16,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            width: 72,
                            height: 22,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(100),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Container(
                        width: 160,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Container(
                          width: 88,
                          height: 30,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(100),
                          ),
                        ),
                      ),
                    ],
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
