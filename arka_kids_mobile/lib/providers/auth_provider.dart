import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isAuthenticated = false;
  bool _isLoading = false;

  UserModel? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;

  String get userRole => _user?.role ?? 'student';

  AuthProvider() {
    _loadSession();
  }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final savedRole = prefs.getString('saved_role');

    if (savedRole != null) {
      _user = await ApiService.login('', '', previewRole: savedRole);
      _isAuthenticated = true;
    } else {
      _user = null;
      _isAuthenticated = false;
    }

    notifyListeners();
  }

  Future<bool> loginWithPhone(String phone, String otp, {String? previewRole}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final userModel = await ApiService.loginWithPhone(phone, otp, previewRole: previewRole);
      _user = userModel;
      _isAuthenticated = true;
      _isLoading = false;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('saved_role', userModel.role);

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

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('saved_role', userModel.role);

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

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('saved_role', role);

    notifyListeners();
  }

  Future<void> logout() async {
    _user = null;
    _isAuthenticated = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('saved_role');

    notifyListeners();
  }
}
