import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';

class ParentFeesScreen extends StatefulWidget {
  const ParentFeesScreen({super.key});

  @override
  State<ParentFeesScreen> createState() => _ParentFeesScreenState();
}

class _ParentFeesScreenState extends State<ParentFeesScreen> {
  bool _isPaid = false;

  void _showUpiPaymentSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Bottom Sheet Grabber
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              Text(
                'Select Payment Method',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1F1F1F),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Paying ₹12,500 for September 2026 Fees',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: const Color(0xFF756E68),
                ),
              ),
              const SizedBox(height: 20),

              // UPI Apps Options
              _buildUpiOption('Google Pay', '⚡ Fast Instant UPI', '💳', Colors.blue.shade50),
              const SizedBox(height: 10),
              _buildUpiOption('PhonePe', '⚡ Instant Payment', '🟣', Colors.purple.shade50),
              const SizedBox(height: 10),
              _buildUpiOption('Paytm / BHIM UPI', '⚡ Direct Bank Transfer', '📲', Colors.cyan.shade50),
              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    setState(() {
                      _isPaid = true;
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('🎉 Payment of ₹12,500 successful! Receipt generated.'),
                        backgroundColor: Color(0xFF10B981),
                        duration: Duration(seconds: 3),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B0000),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    'Proceed to Pay ₹12,500',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildUpiOption(String title, String subtitle, String emoji, Color bg) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1F1F1F),
                  ),
                ),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 1. Red Header Banner
            _buildHeader(context),

            // Overlapping Cards Section
            Transform.translate(
              offset: const Offset(0, -30),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 2. Current Month Fee Card (Matching Screenshot)
                    _buildCurrentFeeCard(),
                    const SizedBox(height: 24),

                    // 3. Annual Overview Section
                    _buildSectionHeader('Annual Overview', showAll: false),
                    const SizedBox(height: 12),
                    _buildAnnualOverviewCard(),
                    const SizedBox(height: 24),

                    // 4. Payment History Section
                    _buildSectionHeader('Payment History', showAll: true),
                    const SizedBox(height: 12),
                    _buildPaymentHistoryList(),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ----------------------------------------------------
  // 1. RED HEADER BANNER
  // ----------------------------------------------------
  Widget _buildHeader(BuildContext context) {
    return Container(
      width: double.infinity,
      color: const Color(0xFF6B0000), // Deep Maroon Red
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 20,
        right: 20,
        bottom: 50,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Fees & Payments',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Sunrise Play School · Academic Year 2026–27',
            style: GoogleFonts.inter(
              color: Colors.white.withValues(alpha: 0.8),
              fontSize: 13,
              fontWeight: FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------
  // 2. CURRENT MONTH FEE CARD (MATCHING SCREENSHOT)
  // ----------------------------------------------------
  Widget _buildCurrentFeeCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Amount & Due By Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'September 2026 Fees',
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF756E68),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹12,500',
                    style: GoogleFonts.outfit(
                      fontSize: 34,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF111111),
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),

              // "DUE BY Sep 5" Amber Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Text(
                      'DUE BY',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFFB45309),
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      _isPaid ? 'PAID ✓' : 'Sep 5',
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: _isPaid ? const Color(0xFF10B981) : const Color(0xFFB45309),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Fee Breakdown Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF8F9FA),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'FEE BREAKDOWN',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF888888),
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 12),
                _buildBreakdownRow('Tuition Fee', '₹8,000'),
                const SizedBox(height: 8),
                _buildBreakdownRow('Transport Fee', '₹2,000'),
                const SizedBox(height: 8),
                _buildBreakdownRow('Meal Plan', '₹1,500'),
                const SizedBox(height: 8),
                _buildBreakdownRow('Activity Fee', '₹700'),
                const SizedBox(height: 8),
                _buildBreakdownRow('Building Fund', '₹300'),
                const SizedBox(height: 12),
                Divider(color: Colors.grey.shade300, height: 1),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Total',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF111111),
                      ),
                    ),
                    Text(
                      '₹12,500',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFFB91C1C),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Pay Button (Bright Red Pill Button matching screenshot)
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isPaid ? null : _showUpiPaymentSheet,
              style: ElevatedButton.styleFrom(
                backgroundColor: _isPaid ? const Color(0xFF10B981) : const Color(0xFF8B0000),
                disabledBackgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _isPaid ? Icons.check_circle_rounded : Icons.smartphone_rounded,
                    size: 20,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _isPaid ? 'Paid Successfully ✓' : 'Pay ₹12,500 via UPI',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Bottom SSL Security Note
          Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('🔒', style: TextStyle(fontSize: 12)),
                const SizedBox(width: 4),
                Text(
                  'Secured by RazorPay · 256-bit SSL',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF888888),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBreakdownRow(String label, String amount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13.5,
            color: const Color(0xFF555555),
          ),
        ),
        Text(
          amount,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1F1F1F),
          ),
        ),
      ],
    );
  }

  // ----------------------------------------------------
  // 3. ANNUAL OVERVIEW SECTION
  // ----------------------------------------------------
  Widget _buildAnnualOverviewCard() {
    final paidAmount = _isPaid ? 100000.0 : 87500.0;
    final totalAmount = 150000.0;
    final remainingAmount = totalAmount - paidAmount;
    final monthsPaid = _isPaid ? 8 : 7;
    final progress = paidAmount / totalAmount;

    return Container(
      padding: const EdgeInsets.all(18),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total Annual Fees',
                style: GoogleFonts.inter(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF6B7280),
                ),
              ),
              Text(
                '₹1,50,000',
                style: GoogleFonts.outfit(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF111827),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Green Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: const Color(0xFFE5E7EB),
              color: const Color(0xFF10B981), // Emerald Green
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 10),

          // Sub-row: Paid vs Remaining
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '✓ ₹${paidAmount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} Paid ($monthsPaid months)',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF10B981),
                ),
              ),
              Text(
                '₹${remainingAmount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} Remaining',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFD97706),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------
  // 4. PAYMENT HISTORY LIST
  // ----------------------------------------------------
  Widget _buildPaymentHistoryList() {
    final historyItems = [
      if (_isPaid)
        {
          'title': 'September 2026 Fees',
          'date': 'Paid Today',
          'amount': '₹12,500',
          'receipt': 'REC-9912',
          'status': 'PAID',
        },
      {
        'title': 'August 2026 Fees',
        'date': 'Paid on Aug 3, 2026',
        'amount': '₹12,500',
        'receipt': 'REC-8842',
        'status': 'PAID',
      },
      {
        'title': 'July 2026 Fees',
        'date': 'Paid on Jul 2, 2026',
        'amount': '₹12,500',
        'receipt': 'REC-7731',
        'status': 'PAID',
      },
      {
        'title': 'June 2026 Fees',
        'date': 'Paid on Jun 4, 2026',
        'amount': '₹12,500',
        'receipt': 'REC-6619',
        'status': 'PAID',
      },
    ];

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: historyItems.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final item = historyItems[index];
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFEFEFEF)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.receipt_long_rounded,
                  color: Color(0xFF10B981),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['title']!,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${item['date']} · ${item['receipt']}',
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    item['amount']!,
                    style: GoogleFonts.outfit(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF111827),
                    ),
                  ),
                  const SizedBox(height: 4),
                  GestureDetector(
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Downloading receipt ${item['receipt']} PDF...'),
                          backgroundColor: AppTheme.primary,
                        ),
                      );
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.file_download_outlined, size: 14, color: Color(0xFF8B0000)),
                        const SizedBox(width: 2),
                        Text(
                          'PDF',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF8B0000),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // Section Header Helper
  Widget _buildSectionHeader(String title, {required bool showAll}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF111827),
          ),
        ),
        if (showAll)
          GestureDetector(
            onTap: () {},
            child: Text(
              'All',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF8B0000),
              ),
            ),
          ),
      ],
    );
  }
}
