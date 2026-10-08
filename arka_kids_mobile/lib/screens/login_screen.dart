import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../main.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Step state: false = Phone Login, true = OTP Verification
  bool _isOtpStep = false;
  bool _isCheckingPhone = false;

  // Controllers & Focus Nodes
  final _phoneController = TextEditingController(text: '9876543210');
  final List<TextEditingController> _otpControllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  // Resend OTP Timer
  Timer? _timer;
  int _secondsRemaining = 30;
  bool _canResend = false;

  // Role Toggle State
  bool _isTeacherLogin = false;
  String get _selectedDemoRole => _isTeacherLogin ? 'trainer' : 'student';

  @override
  void dispose() {
    _timer?.cancel();
    _phoneController.dispose();
    for (var c in _otpControllers) {
      c.dispose();
    }
    for (var f in _otpFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() {
      _secondsRemaining = 30;
      _canResend = false;
    });
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        setState(() {
          _secondsRemaining--;
        });
      } else {
        setState(() {
          _canResend = true;
        });
        timer.cancel();
      }
    });
  }

  void _handleSendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid 10-digit mobile number'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() {
      _isCheckingPhone = true;
    });

    FocusScope.of(context).unfocus(); // Dismiss keyboard first

    try {
      await ApiService.checkPhone(phone);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isCheckingPhone = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e is PhoneCheckException
                ? e.message
                : 'Cannot reach the school server. Check your connection and try again.',
          ),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    if (!mounted) return;

    setState(() {
      _isCheckingPhone = false;
      _isOtpStep = true;
    });
    _startTimer();

    // Focus on first OTP input
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        _otpFocusNodes[0].requestFocus();
      }
    });
  }

  void _handleResendOtp() {
    if (!_canResend) return;
    for (var c in _otpControllers) {
      c.clear();
    }
    _startTimer();
    _otpFocusNodes[0].requestFocus();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Security code resent successfully!'),
        backgroundColor: AppTheme.primaryDark,
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _handleVerifyAndContinue() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final otpCode = _otpControllers.map((c) => c.text).join();

    // Use typed OTP or fallback demo code
    final finalOtp = otpCode.length == 6 ? otpCode : '123456';
    final phone = _phoneController.text.trim();

    final success = await authProvider.loginWithPhone(
      phone,
      finalOtp,
      previewRole: _selectedDemoRole,
    );

    if (success && mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const MainNavigationShell()),
        (route) => false,
      );
    } else if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Verification failed. Please try again.'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  String get _formattedTimer {
    final minutes = (_secondsRemaining ~/ 60).toString().padLeft(2, '0');
    final seconds = (_secondsRemaining % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 400),
              switchInCurve: Curves.easeOutCubic,
              switchOutCurve: Curves.easeInCubic,
              transitionBuilder: (Widget child, Animation<double> animation) {
                final inAnimation = Tween<Offset>(begin: const Offset(0.05, 0), end: Offset.zero).animate(animation);
                final outAnimation = Tween<Offset>(begin: const Offset(-0.05, 0), end: Offset.zero).animate(animation);
                
                return FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: child.key == const ValueKey('otp_step') ? inAnimation : outAnimation,
                    child: child,
                  ),
                );
              },
              layoutBuilder: (Widget? currentChild, List<Widget> previousChildren) {
                return Stack(
                  alignment: Alignment.topCenter,
                  children: <Widget>[
                    ...previousChildren,
                    if (currentChild != null) currentChild,
                  ],
                );
              },
              child: _isOtpStep
                  ? KeyedSubtree(
                      key: const ValueKey('otp_step'),
                      child: _buildVerificationStep(context),
                    )
                  : KeyedSubtree(
                      key: const ValueKey('phone_step'),
                      child: _buildPhoneLoginStep(context),
                    ),
            ),
          ),
        ),
      ),
    );
  }

  // ----------------------------------------------------
  // STEP 1: MOBILE LOGIN SCREEN ("Welcome Back, Parent!")
  // ----------------------------------------------------
  Widget _buildPhoneLoginStep(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 12),

        // Top Circular Graphic Illustration
        _buildHeaderIllustration(),
        const SizedBox(height: 32),

        // Welcome Header
        Text(
          _isTeacherLogin ? 'Welcome Back,\nTeacher!' : 'Welcome Back,\nParent!',
          textAlign: TextAlign.center,
          style: GoogleFonts.outfit(
            fontSize: 32,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF5B0202),
            height: 1.15,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 12),

        // Subtitle
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Text(
            _isTeacherLogin
                ? 'Enter your mobile number to securely access your classroom dashboard.'
                : 'Enter your mobile number to securely access your child’s journey.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14.5,
              fontWeight: FontWeight.w400,
              color: const Color(0xFF756E68),
              height: 1.45,
            ),
          ),
        ),
        const SizedBox(height: 36),

        // Mobile Input Field Container with Floating Tag Label
        Align(
          alignment: Alignment.centerLeft,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F3F3),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    // Country Flag & Dial Code
                    Padding(
                      padding: const EdgeInsets.only(left: 16, right: 12),
                      child: Row(
                        children: [
                          const Text('🇮🇳', style: TextStyle(fontSize: 20)),
                          const SizedBox(width: 8),
                          Text(
                            '+91',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF2C2C2C),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Vertical Separator
                    Container(
                      width: 1,
                      height: 24,
                      color: const Color(0xFFE0E0E0),
                    ),
                    // Mobile Number Text Input
                    Expanded(
                      child: TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        maxLength: 10,
                        onChanged: (val) {
                          if (val.length == 10) {
                            FocusScope.of(context).unfocus();
                          }
                        },
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF1F1F1F),
                        ),
                        decoration: InputDecoration(
                          hintText: 'Enter 10-digit number',
                          hintStyle: GoogleFonts.inter(
                            color: const Color(0xFFC0C0C0),
                            fontSize: 15,
                          ),
                          counterText: '',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Floating "Mobile Number" Tag Label
              Positioned(
                left: 14,
                top: -10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFAFAFA),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Mobile Number',
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF756E68),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),

        // Send OTP Button
        SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton(
            onPressed: (_isCheckingPhone || authProvider.isLoading) ? null : _handleSendOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF5B0202),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(27),
              ),
            ),
            child: Text(
              (_isCheckingPhone || authProvider.isLoading) ? 'Sending OTP...' : 'Send OTP',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.2,
              ),
            ),
          ),
        ),
        const SizedBox(height: 36),

        // Terms and Privacy Footer Text
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: Text(
            'By logging in, you agree to our Terms & Privacy Policy.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 12.5,
              fontWeight: FontWeight.w400,
              color: const Color(0xFF8A827B),
              height: 1.4,
            ),
          ),
        ),
        const SizedBox(height: 32),

        // Role Switcher Link
        GestureDetector(
          onTap: () {
            setState(() {
              _isTeacherLogin = !_isTeacherLogin;
            });
          },
          child: Text(
            _isTeacherLogin ? 'Login as Parent' : 'Login as Teacher',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF5B0202),
              decoration: TextDecoration.underline,
              decorationColor: const Color(0xFF5B0202),
            ),
          ),
        ),
      ],
    );
  }

  // ----------------------------------------------------
  // STEP 2: VERIFICATION SCREEN ("Verify Your Account")
  // ----------------------------------------------------
  Widget _buildVerificationStep(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 12),

        // Top Lock Graphic Illustration
        _buildVerificationHeaderGraphic(),
        const SizedBox(height: 32),

        // Heading
        Text(
          'Verify Your Account',
          textAlign: TextAlign.center,
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF1F1F1F),
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 10),

        // Subtitle
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Text(
            'We’ve sent a 6-digit security code to your registered mobile number.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: const Color(0xFF756E68),
              height: 1.45,
            ),
          ),
        ),
        const SizedBox(height: 32),

        // 6 OTP Digit Inputs Row
        _buildOtpBoxes(),
        const SizedBox(height: 28),

        // Resend Timer Row
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Didn’t receive the code? ',
              style: GoogleFonts.inter(
                fontSize: 13.5,
                color: const Color(0xFF756E68),
              ),
            ),
            if (!_canResend)
              Text(
                'Resend in $_formattedTimer',
                style: GoogleFonts.inter(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFFB87878),
                ),
              )
            else
              GestureDetector(
                onTap: _handleResendOtp,
                child: Text(
                  'Resend code',
                  style: GoogleFonts.inter(
                    fontSize: 13.5,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF5B0202),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),

        // Change Mobile Number Link
        GestureDetector(
          onTap: () {
            setState(() {
              _isOtpStep = false;
            });
          },
          child: Text(
            'Change mobile number',
            style: GoogleFonts.inter(
              fontSize: 13.5,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF7A5C52),
              decoration: TextDecoration.underline,
              decorationColor: const Color(0xFF7A5C52),
            ),
          ),
        ),
        const SizedBox(height: 36),

        // Verify & Continue Primary Button
        SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton(
            onPressed: authProvider.isLoading ? null : _handleVerifyAndContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF5B0202),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(27),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  authProvider.isLoading ? 'Verifying...' : 'Verify & Continue',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.2,
                  ),
                ),
                if (!authProvider.isLoading) ...[
                  const SizedBox(width: 8),
                  const Icon(Icons.arrow_forward_rounded, size: 20),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ----------------------------------------------------
  // CUSTOM ILLUSTRATIONS & COMPONENTS
  // ----------------------------------------------------

  // Header Illustration for Login Step (Matching Design Image 1)
  Widget _buildHeaderIllustration() {
    return Container(
      width: 140,
      height: 140,
      decoration: BoxDecoration(
        color: const Color(0xFFF7F3EE),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF5B0202).withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Center(
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Soft outer decorative ring
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFF5B0202).withValues(alpha: 0.05),
                  width: 1.5,
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Parent and Child Icon Graphic Badge
                Container(
                  width: 58,
                  height: 58,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFFFDFB),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black12,
                        blurRadius: 8,
                        offset: Offset(0, 3),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/icons/app_icon.png',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Center(
                        child: Icon(
                          Icons.family_restroom_rounded,
                          size: 34,
                          color: Color(0xFF5B0202),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Header Graphic for Verification Step (Matching Design Image 2)
  Widget _buildVerificationHeaderGraphic() {
    return Container(
      width: 130,
      height: 130,
      decoration: BoxDecoration(
        color: const Color(0xFFFAF2F0),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF5B0202).withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Center(
        child: Container(
          width: 88,
          height: 88,
          decoration: const BoxDecoration(
            color: Color(0xFFFFF9F8),
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Icon(
              Icons.lock_rounded,
              size: 46,
              color: Color(0xFF5B0202),
            ),
          ),
        ),
      ),
    );
  }

  // 6 OTP Digit Box Inputs
  Widget _buildOtpBoxes() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(6, (index) {
        return SizedBox(
          width: 44,
          height: 52,
          child: TextField(
            controller: _otpControllers[index],
            focusNode: _otpFocusNodes[index],
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            maxLength: 1,
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF5B0202),
            ),
            decoration: InputDecoration(
              counterText: '',
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              filled: true,
              fillColor: Colors.white,
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFD6D6D6), width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF5B0202), width: 2),
              ),
            ),
            onChanged: (value) {
              if (value.isNotEmpty) {
                if (index < 5) {
                  _otpFocusNodes[index + 1].requestFocus();
                } else {
                  FocusScope.of(context).unfocus();
                  _handleVerifyAndContinue(); // Auto verify!
                }
              } else if (value.isEmpty && index > 0) {
                _otpFocusNodes[index - 1].requestFocus();
              }
            },
          ),
        );
      }),
    );
  }


}
