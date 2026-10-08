import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import '../models/journal_model.dart';
import '../models/attendance_model.dart';
import '../models/homework_model.dart';
import '../models/fee_model.dart';
import 'dart:async';
import 'dart:convert';

class PhoneCheckException implements Exception {
  final String message;
  PhoneCheckException(this.message);

  @override
  String toString() => message;
}

class TokenInvalidException implements Exception {
  const TokenInvalidException();
}

class ApiService {
  static Function()? onTokenExpired;

  static const _publicPaths = {
    '/auth/mobile/check',
    '/auth/verify-otp',
    '/auth/login',
    '/auth/register',
  };

  static String? _authToken;
  static bool _handlingExpiry = false;

  /// Call this immediately after login / session restore so every API
  /// request includes `Authorization: Bearer <token>`.
  static void setAuthToken(String? token) {
    _authToken = (token != null && token.isNotEmpty) ? token : null;
    _handlingExpiry = false;
  }

  static void clearAuthToken() {
    _authToken = null;
    _handlingExpiry = false;
  }

  static String? get authToken => _authToken;

  static bool _isPublicPath(String path) {
    final clean = path.split('?').first;
    return _publicPaths.contains(clean);
  }

  static Map<String, String> _headersFor(String path, {String? token}) {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (_isPublicPath(path)) return headers;
    final resolved = (token != null && token.isNotEmpty) ? token : _authToken;
    if (resolved != null && resolved.isNotEmpty) {
      headers['Authorization'] = 'Bearer $resolved';
    }
    return headers;
  }

  static void _interceptResponse(http.Response response, String path) {
    if (_isPublicPath(path)) return;
    if (response.statusCode != 401) return;
    if (_handlingExpiry) return;
    _handlingExpiry = true;
    _authToken = null;
    onTokenExpired?.call();
  }

  // USB (adb reverse) → Android emulator → LAN IP of the machine running `npm run dev`.
  static const List<String> _candidateBaseUrls = [
    'http://13.205.189.169:4000/api',
    'http://127.0.0.1:4000/api',
    'http://10.0.2.2:4000/api',
    'http://192.168.1.2:4000/api',
    'http://192.168.1.6:4000/api',
  ];

  static const _requestTimeout = Duration(seconds: 15);
  static const _unreachableMessage =
      'Cannot reach the school server. Join the same Wi‑Fi as the computer, or keep the phone connected over USB.';

  static String? _resolvedBaseUrl;

  static String get baseUrl => _resolvedBaseUrl ?? _candidateBaseUrls.first;

  static Future<http.Response> _sendOnce(
    String url,
    String method,
    String path, {
    Map<String, dynamic>? body,
    String? token,
  }) {
    final uri = Uri.parse('$url$path');
    final headers = _headersFor(path, token: token);
    final Future<http.Response> request;
    if (method == 'POST') {
      request = http.post(uri, headers: headers, body: jsonEncode(body ?? {}));
    } else if (method == 'PUT') {
      request = http.put(uri, headers: headers, body: jsonEncode(body ?? {}));
    } else if (method == 'DELETE') {
      request = http.delete(uri, headers: headers);
    } else {
      request = http.get(uri, headers: headers);
    }
    return request.timeout(_requestTimeout);
  }

  static Future<http.Response> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    String? token,
    bool interceptAuth = true,
  }) async {
    if (_resolvedBaseUrl != null) {
      try {
        final cached = await _sendOnce(
          _resolvedBaseUrl!,
          method,
          path,
          body: body,
          token: token,
        );
        if (interceptAuth) _interceptResponse(cached, path);
        return cached;
      } catch (_) {
        _resolvedBaseUrl = null;
      }
    }

    final completer = Completer<http.Response>();
    var pending = _candidateBaseUrls.length;

    for (final url in _candidateBaseUrls) {
      _sendOnce(url, method, path, body: body, token: token).then((response) {
        if (!completer.isCompleted) {
          _resolvedBaseUrl = url;
          completer.complete(response);
        }
      }, onError: (_) {
        pending--;
        if (pending == 0 && !completer.isCompleted) {
          completer.completeError(PhoneCheckException(_unreachableMessage));
        }
      });
    }

    final response = await completer.future;
    if (interceptAuth) _interceptResponse(response, path);
    return response;
  }

  static Future<http.Response> get(String path, {String? token}) =>
      _request('GET', path, token: token);

  static Future<http.Response> post(String path, {Map<String, dynamic>? body, String? token}) =>
      _request('POST', path, body: body, token: token);

  static Future<http.Response> put(String path, {Map<String, dynamic>? body, String? token}) =>
      _request('PUT', path, body: body, token: token);

  static List<dynamic> _asList(dynamic data) {
    if (data is List) return data;
    if (data is Map) {
      for (final key in ['data', 'items', 'students', 'notifications', 'events']) {
        final value = data[key];
        if (value is List) return value;
      }
    }
    return [];
  }

  static String timeAgo(DateTime? date) {
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 7) return '${date.day}/${date.month}';
    if (diff.inDays > 1) return '${diff.inDays}d ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }

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

  // Check if Mobile is Registered
  static Future<bool> checkPhone(String phone) async {
    final response = await _request('POST', '/auth/mobile/check', body: {'mobile': phone});
    if (response.statusCode == 200) return true;
    if (response.statusCode == 404) {
      throw PhoneCheckException('Number not registered. Please contact school.');
    }
    throw PhoneCheckException('Could not verify this number. Please try again.');
  }

  // Auth Phone & OTP Verification Login
  static Future<Map<String, dynamic>?> loginWithPhone(String phone, String otp, {String? previewRole}) async {
    try {
      final response = await _request('POST', '/auth/verify-otp', body: {
        'mobile': phone,
        'otp': otp,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['user'] != null && data['token'] != null) {
          final token = data['token'].toString();
          setAuthToken(token);
          return {
            'user': UserModel.fromJson(data['user']),
            'token': token,
          };
        }
      }
    } catch (_) {
      // Return null on failure
    }
    return null;
  }

  static UserModel? _userFromMeResponse(dynamic data) {
    final raw = data is Map ? (data['user'] ?? data) : null;
    if (raw is Map<String, dynamic>) return UserModel.fromJson(raw);
    if (raw is Map) return UserModel.fromJson(Map<String, dynamic>.from(raw));
    return null;
  }

  /// Validates a stored JWT against `/auth/me`.
  /// Returns the user when the token is valid.
  /// Throws [TokenInvalidException] on 401/403.
  /// Returns null when the server cannot be reached.
  static Future<UserModel?> validateToken(String token) async {
    if (token.isEmpty) throw const TokenInvalidException();
    setAuthToken(token);
    final response = await _request(
      'GET',
      '/auth/me',
      token: token,
      interceptAuth: false,
    );
    if (response.statusCode == 200) {
      return _userFromMeResponse(jsonDecode(response.body));
    }
    if (response.statusCode == 401 || response.statusCode == 403) {
      throw const TokenInvalidException();
    }
    return null;
  }

  static Future<UserModel?> fetchSessionUser() async {
    try {
      return await validateToken(_authToken ?? '');
    } on TokenInvalidException {
      return null;
    } catch (e) {
      print('Error fetching session user: $e');
      return null;
    }
  }

  // Fetch Daily Journal Feed
  static Future<List<JournalModel>> getJournalFeed(String token, {String? className}) async {
    try {
      final filter = className != null &&
              className.isNotEmpty &&
              className.toLowerCase() != 'class' &&
              className.toLowerCase() != 'unassigned'
          ? '?className=${Uri.encodeComponent(className)}'
          : '';
      final response = await _request('GET', '/journal$filter', token: token);
      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body))
            .whereType<Map<String, dynamic>>()
            .map(JournalModel.fromJson)
            .toList();
      }
    } catch (e) {
      print('Error fetching journal: $e');
    }
    return [];
  }

  // Fetch Care Logs (Meals, Naps, etc)
  static Future<List<dynamic>> getCareLogs(String token, String studentId, String type) async {
    try {
      final response = await _request(
        'GET',
        '/childcare?studentId=${Uri.encodeComponent(studentId)}&type=${Uri.encodeComponent(type)}',
        token: token,
      );
      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error fetching care logs: $e');
    }
    return [];
  }

  // Fetch Student Attendance
  static Future<List<AttendanceRecordModel>> getAttendance(
    String token,
    String studentId, {
    String? childName,
  }) async {
    try {
      final response = await _request(
        'GET',
        '/attendance?entityId=${Uri.encodeComponent(studentId)}&type=student',
        token: token,
      );

      if (response.statusCode == 200) {
        final ids = {studentId};
        final names = {
          if (childName != null && childName.trim().isNotEmpty)
            childName.trim().toLowerCase(),
        };
        final List<AttendanceRecordModel> allRecords = [];
        for (final doc in _asList(jsonDecode(response.body))) {
          if (doc is! Map) continue;
          final rawDate = doc['date']?.toString() ?? '';
          final date = rawDate.length >= 10 ? rawDate.substring(0, 10) : rawDate;
          final records = doc['records'] as List<dynamic>? ?? [];
          for (final r in records) {
            if (r is! Map) continue;
            final entityId = r['entityId']?.toString() ?? '';
            final name = r['name']?.toString().trim().toLowerCase() ?? '';
            final matchesId = ids.contains(entityId);
            final matchesName = name.isNotEmpty && names.contains(name);
            if (!matchesId && !matchesName) continue;
            allRecords.add(AttendanceRecordModel(
              id: '${doc['_id'] ?? doc['id'] ?? date}-$entityId',
              date: date,
              status: r['status']?.toString() ?? 'absent',
              checkInTime: (r['checkInTime'] ?? r['arrivalTime'])?.toString(),
              checkOutTime: r['checkOutTime']?.toString(),
              remarks: (r['remarks'] ?? r['note'] ?? r['absenceReason'])?.toString(),
            ));
          }
        }
        allRecords.sort((a, b) => b.date.compareTo(a.date));
        return allRecords;
      }
    } catch (e) {
      print('Error fetching attendance: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>?> getStudent(String token, String studentId) async {
    try {
      final response = await _request('GET', '/students/${Uri.encodeComponent(studentId)}', token: token);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map) {
          final nested = data['student'] ?? data['data'] ?? data;
          if (nested is Map) return Map<String, dynamic>.from(nested);
        }
      }
    } catch (e) {
      print('Error fetching student: $e');
    }
    return null;
  }

  // Fetch Homework Items
  static Future<List<HomeworkModel>> getHomework(
    String token, {
    String? className,
    String? studentId,
  }) async {
    try {
      final filter = className != null &&
              className.isNotEmpty &&
              className.toLowerCase() != 'class' &&
              className.toLowerCase() != 'unassigned'
          ? '?className=${Uri.encodeComponent(className)}'
          : '';
      final response = await _request('GET', '/homework$filter', token: token);
      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body))
            .whereType<Map<String, dynamic>>()
            .map((item) => HomeworkModel.fromJson(item, studentId: studentId))
            .toList();
      }
    } catch (e) {
      print('Error fetching homework: $e');
    }
    return [];
  }

  static Future<String> uploadFile(
    String token,
    String filePath, {
    String scope = 'homework',
  }) async {
    Future<http.StreamedResponse> send(String url) async {
      final request = http.MultipartRequest('POST', Uri.parse('$url/upload'));
      if (token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      request.fields['scope'] = scope;
      request.files.add(await http.MultipartFile.fromPath('file', filePath));
      return request.send().timeout(const Duration(seconds: 45));
    }

    final urls = _resolvedBaseUrl != null
        ? <String>[
            _resolvedBaseUrl!,
            ..._candidateBaseUrls.where((u) => u != _resolvedBaseUrl),
          ]
        : _candidateBaseUrls;

    Object? lastError;
    for (final url in urls) {
      try {
        final streamed = await send(url);
        final response = await http.Response.fromStream(streamed);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          _resolvedBaseUrl = url;
          final data = jsonDecode(response.body);
          final link = (data is Map ? (data['secure_url'] ?? data['url']) : null)
              ?.toString();
          if (link != null && link.isNotEmpty) return link;
          throw Exception('Upload did not return a file URL');
        }
        lastError = Exception('Upload failed (${response.statusCode})');
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError ?? Exception('Could not upload the photo');
  }

  static Future<bool> submitHomework(
    String token, {
    required String homeworkId,
    required String studentId,
    required String studentName,
    String? fileUrl,
  }) async {
    try {
      final response = await _request(
        'POST',
        '/homework/$homeworkId/submit',
        token: token,
        body: {
          'studentId': studentId,
          'studentName': studentName,
          if (fileUrl != null && fileUrl.isNotEmpty) 'fileUrl': fileUrl,
        },
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      print('Error submitting homework: $e');
      return false;
    }
  }

  // Fetch School Notices
  static Future<List<Map<String, dynamic>>> getNotices(String token) async {
    try {
      var response = await _request('GET', '/notices', token: token);
      if (response.statusCode != 200) {
        response = await _request('GET', '/notifications?school=1', token: token);
      }
      if (response.statusCode != 200) {
        response = await _request('GET', '/notifications', token: token);
      }
      if (response.statusCode == 200) {
        final mapped = _asList(jsonDecode(response.body)).whereType<Map<String, dynamic>>().map((n) {
          final rawType = (n['type'] ?? '').toString().toLowerCase();
          String type = 'info';
          if (rawType.contains('urgent') || rawType.contains('fee') || rawType.contains('alert')) {
            type = 'urgent';
          } else if (rawType.contains('event') || rawType.contains('admission')) {
            type = 'event';
          } else if (rawType.contains('holiday')) {
            type = 'holiday';
          }
          final created = DateTime.tryParse(n['createdAt']?.toString() ?? '');
          final noticeDateRaw = n['noticeDate']?.toString() ?? '';
          DateTime? noticeDay = DateTime.tryParse(noticeDateRaw);
          if (noticeDay == null && RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(noticeDateRaw)) {
            noticeDay = DateTime.tryParse('${noticeDateRaw}T00:00:00');
          }
          final shown = noticeDay ?? created;
          const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
          ];
          final date = shown == null
              ? ''
              : '${shown.day.toString().padLeft(2, '0')} ${months[shown.month - 1]} ${shown.year}';
          return {
            'id': n['_id']?.toString() ?? n['id']?.toString() ?? '',
            'title': n['title'] ?? '',
            'subtitle': n['description'] ?? n['subtitle'] ?? '',
            'type': type,
            'timeAgo': timeAgo(created),
            'date': date,
          };
        }).toList();
        print('Notices loaded: ${mapped.length}');
        return mapped;
      }
      print('Error fetching notices: HTTP ${response.statusCode}');
    } catch (e) {
      print('Error fetching notices: $e');
    }
    return [];
  }

  // Fetch Calendar Events
  static Future<Map<DateTime, List<dynamic>>> getCalendarEvents(String token) async {
    try {
      final response = await _request('GET', '/calendar', token: token);
      if (response.statusCode == 200) {
        final events = <DateTime, List<dynamic>>{};
        for (final item in _asList(jsonDecode(response.body))) {
          if (item is! Map) continue;
          final parsed = DateTime.tryParse(item['date']?.toString() ?? '');
          if (parsed == null) continue;
          final key = DateTime(parsed.year, parsed.month, parsed.day);
          events.putIfAbsent(key, () => []);
          events[key]!.add({
            'title': item['title'] ?? 'Event',
            'type': item['type'] ?? 'event',
            'time': item['description'] ?? '',
          });
        }
        return events;
      }
    } catch (e) {
      print('Error fetching calendar: $e');
    }
    return {};
  }

  // Fetch Child Profile
  static Future<Map<String, dynamic>> getChildProfile(String token) async {
    try {
      final response = await _request('GET', '/students', token: token);
      if (response.statusCode == 200) {
        final List<dynamic> data = _asList(jsonDecode(response.body));
        if (data.isNotEmpty) {
          // Find the student linked to this parent if possible, or just pick the first
          final s = data.first as Map<String, dynamic>;
          final List<String> allergiesList = s['allergies'] != null && s['allergies'].toString().isNotEmpty 
              ? s['allergies'].toString().split(',').map((e) => e.trim()).toList()
              : [];
          return {
            'name': s['name'] ?? 'Student',
            'className': s['className'] ?? '-',
            'location': s['tenantId']?.toString().toUpperCase() ?? '-',
            'dob': s['dateOfBirth'] ?? '-',
            'age': '-', 
            'bloodGroup': s['bloodGroup'] ?? '-',
            'studentId': s['rollNumber'] ?? '-',
            'allergies': allergiesList,
            'medications': s['medicalNotes'] != null && s['medicalNotes'].toString().isNotEmpty
                ? [{'name': 'Medical Note', 'desc': s['medicalNotes']}]
                : [],
            'contacts': [
              if (s['parentName'] != null)
                {
                  'initial': s['parentName'].toString().isNotEmpty ? s['parentName'].toString()[0].toUpperCase() : 'P',
                  'initialBg': 0xFF7A0000,
                  'name': s['parentName'],
                  'relation': s['parentRelation'] ?? 'Parent',
                  'phone': s['parentPhone'] ?? ''
                }
            ]
          };
        }
      }
    } catch (e) {
      print('Error fetching profile: $e');
    }
    
    // Fallback if no students found
    return {
      'name': 'No Student Found',
      'className': '-',
      'location': '-',
      'dob': '-',
      'age': '-',
      'bloodGroup': '-',
      'studentId': '-',
      'allergies': [],
      'medications': [],
      'contacts': []
    };
  }

  // Fetch Documents
  static Future<List<Map<String, dynamic>>> getDocuments(String token) async {
    try {
      final response = await _request('GET', '/child-documents', token: token);
      if (response.statusCode == 200) {
        return _asList(jsonDecode(response.body)).whereType<Map>().map((d) {
          final url = d['url']?.toString() ?? d['fileUrl']?.toString() ?? '';
          final status = d['status']?.toString().toLowerCase() ?? '';
          return {
            'id': d['_id']?.toString() ?? d['id']?.toString() ?? '',
            'studentId': d['studentId']?.toString() ?? '',
            'name': d['name']?.toString() ?? d['title']?.toString() ?? 'Document',
            'type': d['type']?.toString() ?? '',
            'url': url,
            'status': status.isNotEmpty
                ? status
                : (url.startsWith('http') ? 'uploaded' : 'missing'),
          };
        }).toList();
      }
    } catch (e) {
      print('Error fetching documents: $e');
    }
    return [];
  }

  static Future<bool> createChildDocument(
    String token, {
    required String studentId,
    required String studentName,
    required String name,
    required String type,
    required String url,
  }) async {
    try {
      final response = await _request(
        'POST',
        '/child-documents',
        token: token,
        body: {
          'studentId': studentId,
          'studentName': studentName,
          'name': name,
          'type': type,
          'url': url,
          'uploadedBy': studentName,
        },
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      print('Error creating child document: $e');
      return false;
    }
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
