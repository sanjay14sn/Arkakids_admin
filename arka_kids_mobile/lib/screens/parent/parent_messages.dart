import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class ParentMessagesScreen extends StatefulWidget {
  const ParentMessagesScreen({super.key});

  @override
  State<ParentMessagesScreen> createState() => _ParentMessagesScreenState();
}

class _ParentMessagesScreenState extends State<ParentMessagesScreen> {
  final List<Map<String, dynamic>> _messages = [
    {
      'sender': 'Ms. Clara Vance (Teacher)',
      'text': 'Good morning! Please remember to bring water bottle for gymnastics activity tomorrow.',
      'time': '09:15 AM',
      'isMe': false,
    },
    {
      'sender': 'You',
      'text': 'Thank you Ms. Clara! Will pack it in Emily’s bag.',
      'time': '09:20 AM',
      'isMe': true,
    },
    {
      'sender': 'Arka Kids Admin',
      'text': 'Annual Day costume measurements will be taken this Thursday.',
      'time': 'Yesterday',
      'isMe': false,
    },
  ];

  final _textController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Center Communication'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Switch Role / Logout',
            onPressed: () {
              Provider.of<AuthProvider>(context, listen: false).logout();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Profile Header Card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: AppTheme.primaryLight,
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.primary,
                  child: Text(
                    user?.avatar ?? 'SP',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? 'Parent Profile',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text(
                        'Role: ${user?.role.toUpperCase()} • ${user?.centerName ?? "Arka Kids"}',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Message Stream
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = _messages[index];
                final isMe = item['isMe'] == true;

                return Align(
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.75,
                    ),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isMe ? AppTheme.primary : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: isMe ? null : Border.all(color: AppTheme.cardBorderLight),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 6,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                      children: [
                        if (!isMe)
                          Text(
                            item['sender'],
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary,
                            ),
                          ),
                        if (!isMe) const SizedBox(height: 4),
                        Text(
                          item['text'],
                          style: TextStyle(
                            fontSize: 14,
                            color: isMe ? Colors.white : AppTheme.textPrimaryLight,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item['time'],
                          style: TextStyle(
                            fontSize: 10,
                            color: isMe ? Colors.white70 : AppTheme.textSecondaryLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Text Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppTheme.cardBorderLight)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: 'Type message to educator...',
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: () {
                    if (_textController.text.trim().isNotEmpty) {
                      setState(() {
                        _messages.add({
                          'sender': 'You',
                          'text': _textController.text.trim(),
                          'time': 'Just now',
                          'isMe': true,
                        });
                        _textController.clear();
                      });
                    }
                  },
                  icon: const Icon(Icons.send_rounded, color: Colors.white),
                  style: IconButton.styleFrom(backgroundColor: AppTheme.primary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
