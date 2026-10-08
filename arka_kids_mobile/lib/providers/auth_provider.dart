import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../screens/login_screen.dart';
import '../main.dart';

class AuthProvider extends ChangeNotifier {
  static const _tokenKey = 'access_token';
  static const _userKey = 'saved_user';
  static const _roleKey = 'saved_role';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  UserModel? _user;
  String? _token;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  bool _isRestoring = false;
  Future<bool>? _restoreFuture;

  UserModel? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;

  String get userRole => _user?.role ?? 'student';

  AuthProvider() {
    ApiService.onTokenExpired = () async {
      await logout();
      if (_isRestoring) return;
      navigatorKey.currentState?.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    };
    restoreSession();
  }

  /// Reads the JWT from secure storage and checks it with `/auth/me`.
  /// Returns true only when a token exists and is accepted by the server
  /// (or the network is down but a cached user can still open home).
  Future<bool> restoreSession() {
    _restoreFuture ??= _restoreSession();
    return _restoreFuture!;
  }

  Future<bool> _restoreSession() async {
    _isRestoring = true;
    try {
      final savedToken = (await _secureStorage.read(key: _tokenKey))?.trim();
      if (savedToken == null || savedToken.isEmpty) {
        await _clearLocalSession();
        return false;
      }

      ApiService.setAuthToken(savedToken);

      try {
        final remoteUser = await ApiService.validateToken(savedToken);
        if (remoteUser != null) {
          await _applySession(remoteUser, savedToken);
          return true;
        }
      } on TokenInvalidException {
        await _clearLocalSession();
        return false;
      } catch (_) {
        // Network / server error — fall through to cached user.
      }

      final cached = await _readCachedUser();
      if (cached != null) {
        await _applySession(cached, savedToken, persistUser: false);
        return true;
      }

      await _clearLocalSession();
      return false;
    } finally {
      _isRestoring = false;
      notifyListeners();
    }
  }

  Future<UserModel?> _readCachedUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final json = prefs.getString(_userKey);
      if (json == null || json.isEmpty) return null;
      return UserModel.fromJson(jsonDecode(json) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> _applySession(
    UserModel user,
    String token, {
    bool persistUser = true,
  }) async {
    _user = user;
    _token = token;
    _isAuthenticated = true;
    ApiService.setAuthToken(token);
    await _secureStorage.write(key: _tokenKey, value: token);
    if (persistUser) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_roleKey, user.role);
      await prefs.setString(_userKey, jsonEncode(user.toJson()));
    }
  }

  Future<void> patchUser(UserModel user) async {
    if (_token == null || _token!.isEmpty) {
      _user = user;
      notifyListeners();
      return;
    }
    await _applySession(user, _token!);
    notifyListeners();
  }

  Future<void> _persistSession(UserModel user, String? token) async {
    if (token == null || token.isEmpty) return;
    await _applySession(user, token);
  }

  Future<void> _clearLocalSession() async {
    _user = null;
    _token = null;
    _isAuthenticated = false;
    ApiService.clearAuthToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_roleKey);
    await prefs.remove(_userKey);
    await _secureStorage.delete(key: _tokenKey);
  }

  Future<bool> loginWithPhone(String phone, String otp, {String? previewRole}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await ApiService.loginWithPhone(phone, otp, previewRole: previewRole);

      if (response == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final UserModel userModel = response['user'];
      final String token = response['token'].toString();

      await _persistSession(userModel, token);
      _restoreFuture = Future.value(true);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (_) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> login(String email, String password, {String? previewRole}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final userModel = await ApiService.login(email, password, previewRole: previewRole);
      _user = userModel;
      _isAuthenticated = true;
      _isLoading = false;

      await _persistSession(userModel, _token);

      notifyListeners();
      return true;
    } catch (_) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> switchRole(String role) async {
    _isLoading = true;
    notifyListeners();

    final userModel = await ApiService.login('', '', previewRole: role);
    _user = userModel;
    _isAuthenticated = true;
    _isLoading = false;

    await _persistSession(userModel, _token);

    notifyListeners();
  }

  Future<void> logout() async {
    await _clearLocalSession();
    _restoreFuture = Future.value(false);
    notifyListeners();
  }
}
