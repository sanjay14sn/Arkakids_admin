import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import '../models/journal_model.dart';
import '../models/attendance_model.dart';
import '../models/homework_model.dart';
import '../models/fee_model.dart';

class ApiService {
  static const String baseUrl = 'https://erpapi.erphubtechnologies.in/api';

  // Auth Login
  static Future<UserModel> login(String email, String password, {String? previewRole}) async {
    // Demo / Preview sessions support
    if (previewRole != null && previewRole.isNotEmpty) {
      return _getMockUserForRole(previewRole, email);
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: '{"email":"$email","password":"$password"}',
      );

      if (response.statusCode == 200) {
        // Parse response
        return _getMockUserForRole('student', email);
      }
    } catch (_) {
      // Offline / fallback to demo profile
    }

    return _getMockUserForRole('student', email);
  }

  // Auth Phone & OTP Verification Login
  static Future<UserModel> loginWithPhone(String phone, String otp, {String? previewRole}) async {
    // Demo / Preview sessions support
    if (previewRole != null && previewRole.isNotEmpty) {
      return _getMockUserForRole(previewRole, phone);
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: '{"mobile":"$phone","otp":"$otp"}',
      );

      if (response.statusCode == 200) {
        return _getMockUserForRole('student', phone);
      }
    } catch (_) {
      // Fallback offline mock profile
    }

    return _getMockUserForRole('student', phone);
  }

  // Fetch Daily Journal Feed
  static Future<List<JournalModel>> getJournalFeed() async {
    // Mock / backend data
    return [
      JournalModel(
        id: 'j-1',
        title: 'Morning Montessori Sensory Activity 🎨',
        description: 'The children explored tactile water beads and primary color mixing today! Emily demonstrated fantastic hand-eye coordination.',
        imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
        authorName: 'Ms. Clara Vance',
        authorAvatar: 'CV',
        category: 'activity',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        taggedStudents: ['Emily Parker', 'Leo Miller'],
      ),
      JournalModel(
        id: 'j-2',
        title: 'Outdoor Nature Walk & Leaf Collection 🍁',
        description: 'Our little explorers discovered 5 different shapes of autumn leaves in the school courtyard garden.',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
        authorName: 'Mr. Marcus Vance',
        authorAvatar: 'MV',
        category: 'learning',
        createdAt: DateTime.now().subtract(const Duration(hours: 5)),
        taggedStudents: ['Emily Parker', 'Sophia Rodriguez', 'Noah Chen'],
      ),
      JournalModel(
        id: 'j-3',
        title: 'Healthy Snack & Nap Time Update 🍎',
        description: 'Organic apple slices with almond butter. Emily ate full portion and rested comfortably for 45 minutes.',
        imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
        authorName: 'Ms. Clara Vance',
        authorAvatar: 'CV',
        category: 'meal',
        createdAt: DateTime.now().subtract(const Duration(hours: 8)),
        taggedStudents: ['Emily Parker'],
      ),
    ];
  }

  // Fetch Student Attendance
  static Future<List<AttendanceRecordModel>> getAttendance() async {
    final now = DateTime.now();
    final monthStr = now.month.toString().padLeft(2, '0');
    final yearStr = now.year.toString();
    return [
      AttendanceRecordModel(id: 'att-1', date: '27-$monthStr-$yearStr', status: 'present', checkInTime: '08:45 AM', checkOutTime: '03:15 PM'),
      AttendanceRecordModel(id: 'att-2', date: '26-$monthStr-$yearStr', status: 'present', checkInTime: '08:50 AM', checkOutTime: '03:30 PM'),
      AttendanceRecordModel(id: 'att-3', date: '25-$monthStr-$yearStr', status: 'present', checkInTime: '08:40 AM', checkOutTime: '03:15 PM'),
      AttendanceRecordModel(id: 'att-4', date: '22-$monthStr-$yearStr', status: 'late', checkInTime: '09:20 AM', checkOutTime: '03:15 PM', remarks: 'Doctor appointment'),
      AttendanceRecordModel(id: 'att-5', date: '21-$monthStr-$yearStr', status: 'present', checkInTime: '08:45 AM', checkOutTime: '03:00 PM'),
    ];
  }

  // Fetch Homework Items
  static Future<List<HomeworkModel>> getHomework() async {
    return [
      HomeworkModel(
        id: 'hw-1',
        title: 'Alphabet & Phonics Worksheet (Letter M)',
        subject: 'English & Literacy',
        description: 'Trace uppercase and lowercase M, cut out pictures starting with /m/ sound.',
        dueDate: DateTime.now().add(const Duration(days: 1)),
        status: 'assigned',
      ),
      HomeworkModel(
        id: 'hw-2',
        title: 'Counting & Sorting Shapes',
        subject: 'Early Mathematics',
        description: 'Count triangles and circles on page 14 of math workbook.',
        dueDate: DateTime.now().add(const Duration(days: 3)),
        status: 'assigned',
      ),
      HomeworkModel(
        id: 'hw-3',
        title: 'Family Tree Drawing Project',
        subject: 'Social Skills',
        description: 'Draw 3 family members or pets and color them nicely.',
        dueDate: DateTime.now().subtract(const Duration(days: 2)),
        status: 'graded',
        score: 'A+ Excellent!',
      ),
    ];
  }

  // Fetch Fee Invoices
  static Future<List<FeeInvoiceModel>> getFeeInvoices() async {
    return [
      FeeInvoiceModel(
        id: 'inv-101',
        title: 'Term 2 Tuition & Activity Fee',
        amountTotal: 1250.0,
        amountPaid: 1250.0,
        dueDate: DateTime.now().subtract(const Duration(days: 15)),
        status: 'paid',
      ),
      FeeInvoiceModel(
        id: 'inv-102',
        title: 'Term 3 Tuition & Child Care',
        amountTotal: 1350.0,
        amountPaid: 0.0,
        dueDate: DateTime.now().add(const Duration(days: 10)),
        status: 'pending',
      ),
      FeeInvoiceModel(
        id: 'inv-103',
        title: 'Annual Sports & Cultural Day Pass',
        amountTotal: 150.0,
        amountPaid: 150.0,
        dueDate: DateTime.now().subtract(const Duration(days: 40)),
        status: 'paid',
      ),
    ];
  }

  static UserModel _getMockUserForRole(String role, String email) {
    switch (role) {
      case 'super_admin':
        return UserModel(
          id: 'u-admin',
          name: 'Alex Rivera',
          email: email.isNotEmpty ? email : 'alex@arkakids.com',
          role: 'super_admin',
          avatar: 'AR',
          centerName: 'Super Admin Control Center',
        );
      case 'trainer':
      case 'teacher':
        return UserModel(
          id: 'u-teacher',
          name: 'Clara Vance',
          email: email.isNotEmpty ? email : 'clara@arkakids.com',
          role: 'trainer',
          avatar: 'CV',
          className: 'Toddlers - Sunflowers Batch',
          centerName: 'Arka Kids Downtown Hub',
        );
      case 'bde':
        return UserModel(
          id: 'u-bde',
          name: 'Emma Watson',
          email: email.isNotEmpty ? email : 'emma@arkakids.com',
          role: 'bde',
          avatar: 'EW',
          centerName: 'Admissions & Outreach Hub',
        );
      case 'student':
      default:
        return UserModel(
          id: 'u-student',
          name: 'Sarah Parker (Parent)',
          email: email.isNotEmpty ? email : 'sarah@arkakids.com',
          role: 'student',
          avatar: 'SP',
          childName: 'Emily Parker',
          className: 'Pre-K Sunflowers',
          centerName: 'Arka Kids Downtown Hub',
        );
    }
  }
}
