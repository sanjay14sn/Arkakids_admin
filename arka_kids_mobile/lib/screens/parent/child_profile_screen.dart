import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';

class ChildProfileScreen extends StatefulWidget {
  const ChildProfileScreen({super.key});

  @override
  State<ChildProfileScreen> createState() => _ChildProfileScreenState();
}

class _ChildProfileScreenState extends State<ChildProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final token = Provider.of<AuthProvider>(context, listen: false).token ?? '';
    final profile = await ApiService.getChildProfile(token);
    if (mounted) {
      setState(() {
        _profile = profile;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F7F6),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF6B0000)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Profile',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF6B0000),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: Color(0xFF6B0000)),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Edit profile feature enabled for guardians.'),
                  backgroundColor: Color(0xFF6B0000),
                ),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? _buildShimmerProfile()
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
        child: Column(
          children: [
            // 1. Top Child Avatar & Basic Info
            _buildChildHeader(),
            const SizedBox(height: 24),

            // 2. Personal Information Card
            _buildPersonalInformationCard(),
            const SizedBox(height: 20),

            // 3. Medical Info Card
            _buildMedicalInfoCard(),
            const SizedBox(height: 20),

            // 4. Emergency Contacts Card
            _buildEmergencyContactsCard(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  // ----------------------------------------------------
  // 1. CHILD HEADER (AVATAR, NAME, TAG & LOCATION)
  // ----------------------------------------------------
  Widget _buildChildHeader() {
    final name = _profile?['name'] ?? 'Student';
    final className = _profile?['className'] ?? '';
    final location = _profile?['location'] ?? '';

    return Column(
      children: [
        // Circular Avatar Image
        Container(
          width: 110,
          height: 110,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white,
            border: Border.all(color: Colors.white, width: 4),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: ClipOval(
            child: Image.network(
              'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const Center(
                child: Text('👦', style: TextStyle(fontSize: 54)),
              ),
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Child Name
        Text(
          name,
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1F1F1F),
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 6),

        // Tag Pills: KG-1 · Indiranagar
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // KG-1 Badge Pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFFDE6D2), // Soft peach badge
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                className,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFC2410C),
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Location Pin
            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  size: 15,
                  color: Color(0xFF756E68),
                ),
                const SizedBox(width: 2),
                Text(
                  location,
                  style: GoogleFonts.inter(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF756E68),
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  // ----------------------------------------------------
  // 2. PERSONAL INFORMATION CARD
  // ----------------------------------------------------
  Widget _buildPersonalInformationCard() {
    final dob = _profile?['dob'] ?? '';
    final age = _profile?['age'] ?? '';
    final bg = _profile?['bloodGroup'] ?? '';
    final sid = _profile?['studentId'] ?? '';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          Row(
            children: [
              const Icon(
                Icons.person_rounded,
                color: Color(0xFF991B1B), // Dark Red
                size: 22,
              ),
              const SizedBox(width: 10),
              Text(
                'Personal Information',
                style: GoogleFonts.outfit(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF111827),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Divider(color: Colors.grey.shade200, height: 1),
          const SizedBox(height: 16),

          // Data Grid
          Row(
            children: [
              Expanded(
                child: _buildInfoItem('DATE OF BIRTH', dob),
              ),
              Expanded(
                child: _buildInfoItem('AGE', age),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildInfoItemWithIcon('BLOOD GROUP', bg, '🩸'),
              ),
              Expanded(
                child: _buildInfoItem('STUDENT ID', sid),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF888888),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 14.5,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1F2937),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoItemWithIcon(String label, String value, String emoji) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF888888),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 4),
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 14.5,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1F2937),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ----------------------------------------------------
  // 3. MEDICAL INFO CARD
  // ----------------------------------------------------
  Widget _buildMedicalInfoCard() {
    final allergies = (_profile?['allergies'] as List<dynamic>?) ?? [];
    final meds = (_profile?['medications'] as List<dynamic>?) ?? [];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: const Color(0xFF991B1B),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.add,
                  color: Colors.white,
                  size: 14,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Medical Info',
                style: GoogleFonts.outfit(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF111827),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Divider(color: Colors.grey.shade200, height: 1),
          const SizedBox(height: 16),

          // ALLERGIES Section
          Text(
            'ALLERGIES',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF888888),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: allergies.map((allergy) {
              final isWarning = allergy.toString().toLowerCase().contains('peanut');
              return Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isWarning ? const Color(0xFFFEE2E2) : const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isWarning)
                      const Icon(Icons.warning_amber_rounded, size: 15, color: Color(0xFF991B1B)),
                    if (isWarning) const SizedBox(width: 4),
                    Text(
                      allergy.toString(),
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isWarning ? const Color(0xFF991B1B) : const Color(0xFF374151),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),

          // CURRENT MEDICATIONS Section
          Text(
            'CURRENT MEDICATIONS',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF888888),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),

          ...meds.map((med) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.medical_services_outlined,
                  size: 20,
                  color: Color(0xFF8B4513),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        med['name'].toString(),
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1F2937),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        med['desc'].toString(),
                        style: GoogleFonts.inter(
                          fontSize: 12.5,
                          color: const Color(0xFF6B7280),
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )).toList(),
        ],
      ),
    );
  }

  // ----------------------------------------------------
  // 4. EMERGENCY CONTACTS CARD
  // ----------------------------------------------------
  Widget _buildEmergencyContactsCard() {
    final contacts = (_profile?['contacts'] as List<dynamic>?) ?? [];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          Row(
            children: [
              const Icon(
                Icons.emergency_rounded,
                color: Color(0xFF991B1B), // Dark Red Asterisk
                size: 22,
              ),
              const SizedBox(width: 10),
              Text(
                'Emergency Contacts',
                style: GoogleFonts.outfit(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF111827),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Divider(color: Colors.grey.shade200, height: 1),
          const SizedBox(height: 16),

          ...contacts.map((contact) {
            return Column(
              children: [
                _buildEmergencyContactTile(
                  initial: contact['initial'].toString(),
                  initialBg: Color(contact['initialBg'] as int),
                  name: contact['name'].toString(),
                  relation: contact['relation'].toString(),
                  phone: contact['phone'].toString(),
                ),
                const SizedBox(height: 12),
              ],
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildEmergencyContactTile({
    required String initial,
    required Color initialBg,
    required String name,
    required String relation,
    required String phone,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          // Initial Avatar Circle
          CircleAvatar(
            radius: 20,
            backgroundColor: initialBg,
            child: Text(
              initial,
              style: GoogleFonts.inter(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Name and Relationship
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.inter(
                    fontSize: 14.5,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  relation,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),

          // Call Phone Button Icon
          GestureDetector(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Calling $name ($phone)...'),
                  backgroundColor: const Color(0xFF991B1B),
                ),
              );
            },
            child: Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 6,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: const Center(
                child: Icon(
                  Icons.phone_rounded,
                  color: Color(0xFF991B1B),
                  size: 18,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerProfile() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
        child: Column(
          children: [
            Container(
              width: 110,
              height: 110,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(height: 14),
            Container(width: 150, height: 28, color: Colors.white),
            const SizedBox(height: 24),
            Container(
              height: 180,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              height: 180,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
