import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:arka_kids_mobile/main.dart';
import 'package:arka_kids_mobile/providers/auth_provider.dart';

void main() {
  testWidgets('App renders login or main shell without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const ArkaKidsApp(),
      ),
    );

    expect(find.byType(ArkaKidsApp), findsOneWidget);
  });
}
