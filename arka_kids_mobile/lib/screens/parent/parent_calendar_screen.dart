import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ParentCalendarScreen extends StatefulWidget {
  const ParentCalendarScreen({super.key});

  @override
  State<ParentCalendarScreen> createState() => _ParentCalendarScreenState();
}

class _ParentCalendarScreenState extends State<ParentCalendarScreen> {
  DateTime _focusedMonth = DateTime(2026, 9, 1);
  DateTime? _selectedDate;
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Holidays & Festivals',
    'PTM & Academics',
    'Sports & Events',
    'Excursions & Trips',
  ];

  final List<Map<String, dynamic>> _events = [
    {
      'title': 'Teachers\' Day Grand Celebration',
      'category': 'Sports & Events',
      'date': DateTime(2026, 9, 5),
      'dateString': 'Fri, 05 Sep 2026',
      'time': '9:00 AM - 12:30 PM',
      'venue': 'School Main Auditorium',
      'desc':
          'Students will present handmade cards, song performances, and flower bouquets for class teachers.',
      'note': 'Attire: Special Festive Outfit / Traditional Wear',
      'color': const Color(0xFF7C3AED),
      'bg': const Color(0xFFF3E8FF),
      'icon': Icons.card_giftcard_rounded,
      'isFavorite': true,
    },
    {
      'title': 'Mid-Term Harvest Festival Holiday',
      'category': 'Holidays & Festivals',
      'date': DateTime(2026, 9, 15),
      'dateString': 'Tue, 15 Sep 2026',
      'time': 'All Day',
      'venue': 'School Closed',
      'desc':
          'School will remain closed for students and staff on account of the Harvest Festival.',
      'note': 'Classes resume on Wednesday, 16th September',
      'color': const Color(0xFFDC2626),
      'bg': const Color(0xFFFEE2E2),
      'icon': Icons.beach_access_rounded,
      'isFavorite': false,
    },
    {
      'title': 'Parent-Teacher Meeting (PTM 2)',
      'category': 'PTM & Academics',
      'date': DateTime(2026, 9, 20),
      'dateString': 'Sun, 20 Sep 2026',
      'time': '10:00 AM - 2:00 PM',
      'venue': 'Classroom 2B (Playgroup A)',
      'desc':
          'One-on-one discussion with class teacher Ms. Anitha regarding Term 1 progress report and developmental milestones.',
      'note': 'Time Slot: 10:30 AM - 10:50 AM allocated for Arjun',
      'color': const Color(0xFF0284C7),
      'bg': const Color(0xFFE0F2FE),
      'icon': Icons.people_alt_rounded,
      'isFavorite': true,
    },
    {
      'title': 'Annual Sports & Rhymes Day',
      'category': 'Sports & Events',
      'date': DateTime(2026, 10, 2),
      'dateString': 'Fri, 02 Oct 2026',
      'time': '8:30 AM - 1:00 PM',
      'venue': 'Arka Kids Play Sports Ground',
      'desc':
          'Fun obstacle race, balloon pop race, and group rhymes performance for playgroup kids.',
      'note': 'Parents are invited to cheer! Snacks will be provided.',
      'color': const Color(0xFFD97706),
      'bg': const Color(0xFFFEF3C7),
      'icon': Icons.emoji_events_rounded,
      'isFavorite': false,
    },
    {
      'title': 'Botanical Garden Nature Walk & Field Trip',
      'category': 'Excursions & Trips',
      'date': DateTime(2026, 10, 12),
      'dateString': 'Mon, 12 Oct 2026',
      'time': '9:15 AM - 2:00 PM',
      'venue': 'Lalbagh Botanical Gardens',
      'desc':
          'Outdoor nature exploration, leaf collection, and picnic lunch with class teachers and support staff.',
      'note': 'Please send water bottle & extra pair of clothes',
      'color': const Color(0xFF16A34A),
      'bg': const Color(0xFFDCFCE7),
      'icon': Icons.directions_bus_rounded,
      'isFavorite': false,
    },
    {
      'title': 'Diwali Colors & Diya Decoration Activity',
      'category': 'Holidays & Festivals',
      'date': DateTime(2026, 10, 28),
      'dateString': 'Wed, 28 Oct 2026',
      'time': '10:00 AM - 12:00 PM',
      'venue': 'Art & Craft Room',
      'desc':
          'Children will paint eco-friendly clay diyas and take them home for celebration.',
      'note': 'Diya materials provided by school',
      'color': const Color(0xFFEA580C),
      'bg': const Color(0xFFFFEDD5),
      'icon': Icons.palette_rounded,
      'isFavorite': false,
    },
  ];

  List<Map<String, dynamic>> get _filteredEvents {
    return _events.where((e) {
      final matchesCategory =
          _selectedCategory == 'All' || e['category'] == _selectedCategory;
      final matchesDate = _selectedDate == null ||
          (e['date'] as DateTime).year == _selectedDate!.year &&
              (e['date'] as DateTime).month == _selectedDate!.month &&
              (e['date'] as DateTime).day == _selectedDate!.day;
      return matchesCategory && matchesDate;
    }).toList();
  }

  void _previousMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month - 1, 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month + 1, 1);
    });
  }

  String _monthYearString(DateTime dt) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    return '${months[dt.month - 1]} ${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredEvents;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(80),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6B0000), Color(0xFF8B0000)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Academic Calendar 2026',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 19,
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.2,
                          ),
                        ),
                        Text(
                          'Holidays, PTM meetings, events & excursions',
                          style: GoogleFonts.inter(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      setState(() {
                        _selectedDate = null;
                        _focusedMonth = DateTime(2026, 9, 1);
                      });
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Showing all events for current month.'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                    icon: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        'Reset',
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Calendar View Card
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                children: [
                  // Month Navigation Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        onPressed: _previousMonth,
                        icon: const Icon(Icons.chevron_left_rounded,
                            color: Color(0xFF6B0000)),
                      ),
                      Text(
                        _monthYearString(_focusedMonth),
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF111827),
                        ),
                      ),
                      IconButton(
                        onPressed: _nextMonth,
                        icon: const Icon(Icons.chevron_right_rounded,
                            color: Color(0xFF6B0000)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Day Names Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                        .map((day) => SizedBox(
                              width: 38,
                              child: Center(
                                child: Text(
                                  day,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: day == 'Sun'
                                        ? const Color(0xFFDC2626)
                                        : const Color(0xFF6B7280),
                                  ),
                                ),
                              ),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 8),

                  // Month Grid
                  _buildMonthGrid(),
                ],
              ),
            ),

            // Category Filter Pills
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Filter Events',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF111827),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 38,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final isSelected = cat == _selectedCategory;
                  return ChoiceChip(
                    label: Text(cat),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedCategory = cat;
                        });
                      }
                    },
                    selectedColor: const Color(0xFF8B0000),
                    backgroundColor: Colors.white,
                    labelStyle: GoogleFonts.inter(
                      color:
                          isSelected ? Colors.white : const Color(0xFF374151),
                      fontSize: 12.5,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.w500,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(100),
                      side: BorderSide(
                        color: isSelected
                            ? const Color(0xFF8B0000)
                            : const Color(0xFFE5E7EB),
                      ),
                    ),
                    showCheckmark: false,
                  );
                },
              ),
            ),
            const SizedBox(height: 20),

            // Events Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _selectedDate != null
                        ? 'Events on ${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                        : 'Scheduled Events (${filtered.length})',
                    style: GoogleFonts.outfit(
                      fontSize: 16.5,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF111827),
                    ),
                  ),
                  if (_selectedDate != null)
                    InkWell(
                      onTap: () {
                        setState(() {
                          _selectedDate = null;
                        });
                      },
                      child: Text(
                        'Show All',
                        style: GoogleFonts.inter(
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF8B0000),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Events List
            if (filtered.isEmpty)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(Icons.event_busy_rounded,
                          size: 40, color: Color(0xFF9CA3AF)),
                      const SizedBox(height: 10),
                      Text(
                        'No scheduled events for this filter',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF4B5563),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Try selecting another category or resetting date filter.',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: const Color(0xFF9CA3AF),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: filtered.length,
                separatorBuilder: (_, __) => const SizedBox(height: 14),
                itemBuilder: (context, index) {
                  final event = filtered[index];
                  return _buildEventCard(event);
                },
              ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildMonthGrid() {
    final firstDayOfMonth =
        DateTime(_focusedMonth.year, _focusedMonth.month, 1);
    final daysInMonth =
        DateTime(_focusedMonth.year, _focusedMonth.month + 1, 0).day;
    final startingWeekday = firstDayOfMonth.weekday % 7; // Sunday = 0

    final List<Widget> dayWidgets = [];

    // Empty lead cells
    for (int i = 0; i < startingWeekday; i++) {
      dayWidgets.add(const SizedBox(width: 38, height: 38));
    }

    // Days of month
    for (int day = 1; day <= daysInMonth; day++) {
      final current = DateTime(_focusedMonth.year, _focusedMonth.month, day);
      final isSelected = _selectedDate != null &&
          _selectedDate!.year == current.year &&
          _selectedDate!.month == current.month &&
          _selectedDate!.day == current.day;

      // Check if event exists on this date
      final hasEvent = _events.any((e) {
        final ed = e['date'] as DateTime;
        return ed.year == current.year &&
            ed.month == current.month &&
            ed.day == current.day;
      });

      Color? dotColor;
      if (hasEvent) {
        final ev = _events.firstWhere((e) {
          final ed = e['date'] as DateTime;
          return ed.year == current.year &&
              ed.month == current.month &&
              ed.day == current.day;
        });
        dotColor = ev['color'] as Color;
      }

      dayWidgets.add(
        GestureDetector(
          onTap: () {
            setState(() {
              if (isSelected) {
                _selectedDate = null;
              } else {
                _selectedDate = current;
              }
            });
          },
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: isSelected
                  ? const Color(0xFF8B0000)
                  : (hasEvent
                      ? dotColor?.withValues(alpha: 0.12)
                      : Colors.transparent),
              borderRadius: BorderRadius.circular(10),
              border: isSelected
                  ? null
                  : Border.all(
                      color: hasEvent
                          ? dotColor!.withValues(alpha: 0.4)
                          : Colors.transparent),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$day',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight:
                        isSelected || hasEvent ? FontWeight.bold : FontWeight.w500,
                    color: isSelected
                        ? Colors.white
                        : (hasEvent ? dotColor : const Color(0xFF1F2937)),
                  ),
                ),
                if (hasEvent && !isSelected)
                  Container(
                    margin: const EdgeInsets.only(top: 2),
                    width: 4,
                    height: 4,
                    decoration: BoxDecoration(
                      color: dotColor,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    }

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      alignment: WrapAlignment.start,
      children: dayWidgets,
    );
  }

  Widget _buildEventCard(Map<String, dynamic> event) {
    final color = event['color'] as Color;
    final bg = event['bg'] as Color;
    final isFav = event['isFavorite'] as bool;

    return Container(
      padding: const EdgeInsets.all(16),
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  event['icon'] as IconData,
                  color: color,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: bg,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            event['category'].toString(),
                            style: GoogleFonts.inter(
                              fontSize: 10.5,
                              fontWeight: FontWeight.bold,
                              color: color,
                            ),
                          ),
                        ),
                        InkWell(
                          onTap: () {
                            setState(() {
                              event['isFavorite'] = !isFav;
                            });
                          },
                          child: Icon(
                            isFav
                                ? Icons.bookmark_rounded
                                : Icons.bookmark_border_rounded,
                            color: isFav ? color : const Color(0xFF9CA3AF),
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      event['title'].toString(),
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF111827),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Date, Time & Location Row
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFAFAFA),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.calendar_today_rounded,
                        size: 14, color: Color(0xFF8B0000)),
                    const SizedBox(width: 8),
                    Text(
                      '${event['dateString']} • ${event['time']}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF374151),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined,
                        size: 14, color: Color(0xFF6B7280)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        event['venue'].toString(),
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: const Color(0xFF6B7280),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          Text(
            event['desc'].toString(),
            style: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF4B5563),
              height: 1.4,
            ),
          ),

          if (event['note'] != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded,
                      size: 14, color: Color(0xFFD97706)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      event['note'].toString(),
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF92400E),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),

          // Action CTA
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                          '📅 Added "${event['title']}" to your phone calendar!'),
                      backgroundColor: const Color(0xFF10B981),
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF8B0000),
                  side: const BorderSide(color: Color(0xFF8B0000)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                icon: const Icon(Icons.add_alert_rounded, size: 15),
                label: Text(
                  'Set Reminder',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
