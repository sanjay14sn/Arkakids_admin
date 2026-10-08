import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../models/homework_model.dart';
import '../../models/journal_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import 'homework_submission_screen.dart';
import 'submit_document_screen.dart';

class ParentActivitiesScreen extends StatefulWidget {
  const ParentActivitiesScreen({super.key});

  @override
  State<ParentActivitiesScreen> createState() => _ParentActivitiesScreenState();
}

class _ParentActivitiesScreenState extends State<ParentActivitiesScreen> {
  int _selectedTabIndex = 0;
  bool _loading = true;
  bool _wasVisible = false;
  String? _submittingId;
  List<HomeworkModel> _homeworks = [];
  List<JournalModel> _journals = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
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

    final top = MediaQuery.of(context).padding.top;
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          Container(
            color: const Color(0xFF5B0202),
            padding: EdgeInsets.only(top: top + 12, left: 18, right: 18, bottom: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Activities',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF520000),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Expanded(child: _buildTabBtn(0, Icons.assignment_rounded, 'Homework')),
                      Expanded(child: _buildTabBtn(1, Icons.star_outline_rounded, 'Activities')),
                      Expanded(child: _buildTabBtn(2, Icons.workspace_premium_outlined, 'Certificates')),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: RefreshIndicator(
                onRefresh: _load,
                color: const Color(0xFF8B0000),
                child: _loading
                    ? const Center(
                        child: CircularProgressIndicator(color: Color(0xFF8B0000)),
                      )
                    : ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(16, 20, 16, 36),
                        children: [
                          if (_selectedTabIndex == 0)
                            _buildHomeworkTab()
                          else if (_selectedTabIndex == 1)
                            _buildActivitiesTab()
                          else
                            _buildCertificatesTab(),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final token = auth.token;
    final user = auth.user;
    if (token == null || token.isEmpty) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    final results = await Future.wait([
      ApiService.getHomework(
        token,
        className: user?.className,
        studentId: user?.id,
      ),
      ApiService.getJournalFeed(token, className: user?.className),
    ]);
    if (!mounted) return;
    setState(() {
      _homeworks = results[0] as List<HomeworkModel>;
      _journals = results[1] as List<JournalModel>;
      _loading = false;
    });
  }

  Future<void> _submitHomeworkPhoto(HomeworkModel item, ImageSource source) async {
    final auth = context.read<AuthProvider>();
    final token = auth.token;
    final user = auth.user;
    if (token == null || user == null) return;

    final picker = ImagePicker();
    final photo = await picker.pickImage(source: source, imageQuality: 85);
    if (photo == null || !mounted) return;

    setState(() => _submittingId = item.id);
    try {
      final url = await ApiService.uploadFile(token, photo.path);
      final ok = await ApiService.submitHomework(
        token,
        homeworkId: item.id,
        studentId: user.id,
        studentName: user.childName ?? user.name,
        fileUrl: url,
      );
      if (!mounted) return;
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Submitted ${item.title}'),
            backgroundColor: const Color(0xFF6B0000),
            behavior: SnackBarBehavior.floating,
          ),
        );
        await _load();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not submit homework. Try again.'),
            backgroundColor: Color(0xFFB45309),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not upload the photo. Try again.'),
          backgroundColor: Color(0xFFB45309),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _submittingId = null);
    }
  }

  Future<void> _chooseHomeworkUpload(HomeworkModel item) async {
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
                  'Upload homework',
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
                    _submitHomeworkPhoto(item, ImageSource.gallery);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.photo_camera_rounded, color: Color(0xFF8B0000)),
                  title: const Text('Take a photo'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _submitHomeworkPhoto(item, ImageSource.camera);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatDay(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${d.day} ${months[d.month - 1]} ${d.year}';
  }

  void _openHomeworkDetails(HomeworkModel item) {
    final style = _subjectStyle(item.subject);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(ctx).size.height * 0.88,
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: IconButton(
                          onPressed: () => Navigator.pop(ctx),
                          tooltip: 'Close',
                          icon: const Icon(Icons.close_rounded, color: Color(0xFF111827)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: style.iconBg,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(style.icon, color: style.iconColor, size: 28),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
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
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF111827),
                                height: 1.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (item.submittable) ...[
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _detailChip(
                          'Upload required',
                          const Color(0xFFFFF1F2),
                          const Color(0xFF8B0000),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 18),
                  _detailRow('Assigned', _formatDay(item.assignedDate ?? item.dueDate)),
                  _detailRow('Due date', _formatDay(item.dueDate)),
                  if (item.createdBy.isNotEmpty)
                    _detailRow('Posted by', item.createdBy),
                  const SizedBox(height: 14),
                  Text(
                    'Instructions',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.description.isNotEmpty
                        ? item.description
                        : 'No extra instructions.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: const Color(0xFF374151),
                      height: 1.45,
                    ),
                  ),
                  if (item.attachmentUrl != null &&
                      item.attachmentUrl!.startsWith('http')) ...[
                    const SizedBox(height: 16),
                    Text(
                      item.attachmentName?.isNotEmpty == true
                          ? item.attachmentName!
                          : 'Attachment',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        item.attachmentUrl!,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          height: 120,
                          color: const Color(0xFFF3F4F6),
                          child: const Icon(Icons.insert_drive_file_rounded,
                              color: Color(0xFF9CA3AF)),
                        ),
                      ),
                    ),
                  ],
                  if (item.submitted &&
                      item.submissionUrl != null &&
                      item.submissionUrl!.startsWith('http')) ...[
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(ctx);
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => HomeworkSubmissionScreen(item: item),
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF8B0000),
                          side: const BorderSide(color: Color(0xFF8B0000), width: 1.4),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        icon: const Icon(Icons.visibility_rounded, size: 18),
                        label: Text(
                          'View submission',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  ],
                  if (item.submittable && !item.submitted) ...[
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _submittingId == item.id
                            ? null
                            : () {
                                Navigator.pop(ctx);
                                _chooseHomeworkUpload(item);
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF8B0000),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        icon: const Icon(Icons.upload_rounded, size: 18),
                        label: Text(
                          'Upload homework',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _homeworkActionChip({
    required String label,
    required VoidCallback? onTap,
    bool filled = false,
  }) {
    return Material(
      color: filled ? const Color(0xFF8B0000) : const Color(0xFFFFF1F2),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
              color: filled ? Colors.white : const Color(0xFF8B0000),
            ),
          ),
        ),
      ),
    );
  }

  Widget _detailChip(String label, Color bg, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 11.5,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 88,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF9CA3AF),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF111827),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBtn(int index, IconData icon, String label) {
    final active = _selectedTabIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTabIndex = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.10),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  )
                ]
              : [],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                size: 15,
                color: active
                    ? const Color(0xFF6B0000)
                    : Colors.white.withValues(alpha: 0.75)),
            const SizedBox(width: 5),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12.5,
                fontWeight: active ? FontWeight.bold : FontWeight.w500,
                color: active
                    ? const Color(0xFF6B0000)
                    : Colors.white.withValues(alpha: 0.85),
              ),
            ),
          ],
        ),
      ),
    );
  }

  DateTime _dateOnly(DateTime d) => DateTime(d.year, d.month, d.day);

  Widget _buildEmpty(String title, String subtitle, IconData icon) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF0D48A), width: 1.2),
      ),
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFFD6B56A), size: 34),
          const SizedBox(height: 10),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF9CA3AF)),
          ),
        ],
      ),
    );
  }

  Widget _buildHomeworkTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Pending Homework',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF111827),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 14),
        if (_homeworks.isEmpty)
          _buildEmpty(
            'No homework yet',
            'Class homework posted in admin will appear here',
            Icons.assignment_outlined,
          )
        else
          ..._homeworks.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildHomeworkCard(item),
              )),
      ],
    );
  }

  _SubjectStyle _subjectStyle(String subject) {
    final s = subject.toLowerCase();
    if (s.contains('math')) {
      return const _SubjectStyle(
        imagePath: 'assets/icons/maths_icon.png',
        iconBg: Color(0xFFDBEAFE),
        icon: Icons.calculate_rounded,
        iconColor: Color(0xFF0284C7),
      );
    }
    if (s.contains('english') || s.contains('rhyme') || s.contains('phon')) {
      return const _SubjectStyle(
        imagePath: 'assets/icons/english_icon.png',
        iconBg: Color(0xFFFEE2E2),
        icon: Icons.edit_note_rounded,
        iconColor: Color(0xFFDC2626),
      );
    }
    if (s.contains('draw') || s.contains('art')) {
      return const _SubjectStyle(
        imagePath: 'assets/icons/art_icon.png',
        iconBg: Color(0xFFFFEDD5),
        icon: Icons.palette_rounded,
        iconColor: Color(0xFFC2410C),
      );
    }
    return const _SubjectStyle(
      imagePath: 'assets/icons/evs_icon.png',
      iconBg: Color(0xFFDCFCE7),
      icon: Icons.eco_rounded,
      iconColor: Color(0xFF16A34A),
    );
  }

  Widget _buildHomeworkCard(HomeworkModel item) {
    final style = _subjectStyle(item.subject);
    final now = _dateOnly(DateTime.now());
    final due = _dateOnly(item.dueDate);
    final diff = due.difference(now).inDays;
    final high = diff <= 0;
    final dueBg = high ? const Color(0xFFFDE8E8) : const Color(0xFFFEF3C7);
    final dueColor = high ? const Color(0xFFDC2626) : const Color(0xFFB45309);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final dueText = 'Due: ${item.dueDate.day} ${months[item.dueDate.month - 1]}';

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: () => _openHomeworkDetails(item),
        borderRadius: BorderRadius.circular(20),
        child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: style.iconBg,
                  borderRadius: BorderRadius.circular(16),
                ),
                clipBehavior: Clip.antiAlias,
                child: item.attachmentUrl != null &&
                        item.attachmentUrl!.startsWith('http')
                    ? Image.network(
                        item.attachmentUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Icon(style.icon,
                            size: 28, color: style.iconColor),
                      )
                    : Image.asset(
                        style.imagePath,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Icon(style.icon,
                            size: 28, color: style.iconColor),
                      ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.subject,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF7B0000),
                        letterSpacing: -0.1,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.title,
                      style: GoogleFonts.inter(
                        fontSize: 13.5,
                        color: const Color(0xFF374151),
                        height: 1.4,
                      ),
                    ),
                    if (item.description.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        item.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: const Color(0xFF6B7280),
                          height: 1.35,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                    decoration: BoxDecoration(
                      color: dueBg,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.calendar_today_rounded, size: 11, color: dueColor),
                        const SizedBox(width: 4),
                        Text(
                          dueText,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: dueColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (item.submittable) ...[
                    const SizedBox(height: 6),
                    _homeworkActionChip(
                      label: _submittingId == item.id
                          ? 'Uploading…'
                          : item.submitted
                              ? 'Resubmit'
                              : 'Submit',
                      filled: !item.submitted,
                      onTap: _submittingId == item.id
                          ? null
                          : () => _chooseHomeworkUpload(item),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ],
      ),
        ),
      ),
    );
  }

  Widget _buildActivitiesTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Classroom Activities',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF111827),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 14),
        if (_journals.isEmpty)
          _buildEmpty(
            'No class activities yet',
            'Daily journal posts from school will appear here',
            Icons.camera_alt_outlined,
          )
        else
          ..._journals.map((j) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            final local = j.createdAt.toLocal();
            final time =
                '${local.day} ${months[local.month - 1]} · ${ApiService.timeAgo(j.createdAt)}';
            final tag = j.tags.isNotEmpty ? j.tags.first : (j.category.isNotEmpty ? j.category : 'Class update');
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
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
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: SizedBox(
                        width: 56,
                        height: 56,
                        child: j.imageUrl.startsWith('http')
                            ? Image.network(
                                j.imageUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  color: const Color(0xFFFFF6E5),
                                  child: const Icon(Icons.photo_rounded,
                                      color: AppTheme.goldDark),
                                ),
                              )
                            : Container(
                                color: const Color(0xFFFFF6E5),
                                child: const Icon(Icons.photo_rounded,
                                    color: AppTheme.goldDark),
                              ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            j.title.isNotEmpty ? j.title : 'Classroom update',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF1F2937),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            time,
                            style: GoogleFonts.inter(
                                fontSize: 12, color: const Color(0xFF9CA3AF)),
                          ),
                          if (j.description.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              j.description,
                              style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: const Color(0xFF4B5563),
                                  height: 1.4),
                            ),
                          ],
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.goldLight,
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Text(
                              tag,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.goldDark,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildCertificatesTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const SubmitDocumentScreen(
                  initialCategory: 'Certificates & Awards',
                  initialTitle: 'External Competition Certificate',
                ),
              ),
            );
          },
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
                    Icons.workspace_premium_rounded,
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
                        'Upload External Certificate',
                        style: GoogleFonts.inter(
                          fontSize: 14.5,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF4A0A0A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Submit extracurricular awards & certificates',
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
        Text(
          'Achievements & Badges',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF111827),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 14),
        _buildEmpty(
          'No certificates yet',
          'Awards from school will show up here',
          Icons.workspace_premium_outlined,
        ),
      ],
    );
  }
}

class _SubjectStyle {
  final String imagePath;
  final Color iconBg;
  final IconData icon;
  final Color iconColor;
  const _SubjectStyle({
    required this.imagePath,
    required this.iconBg,
    required this.icon,
    required this.iconColor,
  });
}
