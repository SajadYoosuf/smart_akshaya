import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'services/google_sheets_service.dart';
import 'services/auth_service.dart';

/// Wallet Management Screen for the Desktop app.
/// Mirrors the web WalletManagement component.
class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  List<Map<String, dynamic>> _wallets = [];
  List<Map<String, dynamic>> _filtered = [];
  final TextEditingController _search = TextEditingController();
  bool _loading = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadWallets();
    _search.addListener(_filter);
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _filter() {
    final q = _search.text.toLowerCase();
    setState(() {
      _filtered = q.isEmpty
          ? List.from(_wallets)
          : _wallets
                .where((w) => (w['name'] as String).toLowerCase().contains(q))
                .toList();
    });
  }

  String _fmt(dynamic n) {
    final num = double.tryParse(n?.toString() ?? '0') ?? 0;
    final f = NumberFormat('#,##,##0.00', 'en_IN');
    return '₹${f.format(num.abs())}';
  }

  String _nowStr() {
    return DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now());
  }

  Future<void> _loadWallets() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final spreadsheetId = await AuthService().getSpreadsheetId();
      final rows = await GoogleSheetsService().getRows(
        spreadsheetId,
        'Wallets',
      );
      if (rows == null || rows.isEmpty || rows.length <= 1) {
        setState(() {
          _wallets = [];
          _filtered = [];
        });
        return;
      }
      final headers = rows[0]
          .map((e) => (e as String).trim().toLowerCase())
          .toList();
      gi(String k) => headers.indexOf(k);

      final list = <Map<String, dynamic>>[];
      for (int i = 1; i < rows.length; i++) {
        final r = rows[i] as List;
        list.add({
          'rowIndex': i + 1,
          'id': (gi('id') >= 0 ? r[gi('id')] : null) ?? '${i + 1}',
          'name':
              (gi('wallet name') >= 0 ? r[gi('wallet name')] : null) ??
              'Wallet $i',
          'opening':
              double.tryParse(
                (gi('opening balance') >= 0 ? r[gi('opening balance')] : null)
                        ?.toString() ??
                    '',
              ) ??
              0,
          'current':
              double.tryParse(
                (gi('current balance') >= 0 ? r[gi('current balance')] : null)
                        ?.toString() ??
                    '',
              ) ??
              0,
          'updated':
              (gi('last updated') >= 0 ? r[gi('last updated')] : null) ?? '—',
          'status': (gi('status') >= 0 ? r[gi('status')] : null) ?? 'Updated',
        });
      }
      setState(() {
        _wallets = list;
        _filtered = List.from(list);
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  // ── Add Wallet Dialog ─────────────────────────────────────────────────────
  void _showAddWalletDialog() {
    final nameCtrl = TextEditingController();
    final balCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(
          'Add New Wallet',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        content: SizedBox(
          width: 320,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Wallet Name *',
                  hintText: 'e.g. BANK, Cash, CSC…',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: balCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Opening Balance',
                  hintText: '0.00',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              final id = DateTime.now().millisecondsSinceEpoch;
              final opening = double.tryParse(balCtrl.text) ?? 0;
              final spreadsheetId = await AuthService().getSpreadsheetId();
              await GoogleSheetsService().appendRow(spreadsheetId, 'Wallets', [
                id,
                nameCtrl.text.trim(),
                opening,
                opening,
                _nowStr(),
                'Updated',
              ]);
              _loadWallets();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Wallet "${nameCtrl.text.trim()}" added.'),
                    backgroundColor: const Color(0xFF10B981),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
            ),
            child: const Text(
              'Create Wallet',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  // ── Add Funds Dialog ──────────────────────────────────────────────────────
  void _showAddFundsDialog(Map<String, dynamic> wallet) {
    final amtCtrl = TextEditingController();
    final noteCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Add Funds — ${wallet['name']}',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        content: SizedBox(
          width: 320,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Current Balance:',
                      style: TextStyle(fontSize: 13),
                    ),
                    Text(
                      _fmt(wallet['current']),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF10B981),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amtCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Amount (use negative to debit)',
                  hintText: '+500 or -200',
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: noteCtrl,
                decoration: const InputDecoration(
                  labelText: 'Note',
                  hintText: 'Reason for adjustment',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final amt = double.tryParse(amtCtrl.text);
              if (amt == null) return;
              Navigator.pop(ctx);
              final newBal = (wallet['current'] as double) + amt;
              final spreadsheetId = await AuthService().getSpreadsheetId();
              await GoogleSheetsService().updateRowColumns(
                spreadsheetId,
                'Wallets',
                wallet['rowIndex'] as int,
                {'current balance': newBal, 'last updated': _nowStr()},
              );
              _loadWallets();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Balance updated for ${wallet['name']}.'),
                    backgroundColor: const Color(0xFF10B981),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
            ),
            child: const Text(
              'Update Balance',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  // ── Transfer Dialog ───────────────────────────────────────────────────────
  void _showTransferDialog() {
    String? fromName;
    String? toName;
    final amtCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx2, setDlgState) => AlertDialog(
          title: const Text(
            'Transfer Funds',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          content: SizedBox(
            width: 340,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: fromName,
                  decoration: const InputDecoration(labelText: 'From Wallet *'),
                  items: _wallets
                      .map(
                        (w) => DropdownMenuItem(
                          value: w['name'] as String,
                          child: Text('${w['name']} (${_fmt(w['current'])})'),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setDlgState(() => fromName = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: toName,
                  decoration: const InputDecoration(labelText: 'To Wallet *'),
                  items: _wallets
                      .where((w) => w['name'] != fromName)
                      .map(
                        (w) => DropdownMenuItem(
                          value: w['name'] as String,
                          child: Text('${w['name']} (${_fmt(w['current'])})'),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setDlgState(() => toName = v),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amtCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Amount *',
                    hintText: '0.00',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final amt = double.tryParse(amtCtrl.text);
                if (amt == null ||
                    fromName == null ||
                    toName == null ||
                    fromName == toName)
                  return;
                Navigator.pop(ctx);
                final from = _wallets.firstWhere((w) => w['name'] == fromName);
                final to = _wallets.firstWhere((w) => w['name'] == toName);
                final spreadsheetId = await AuthService().getSpreadsheetId();
                await GoogleSheetsService().updateRowColumns(
                  spreadsheetId,
                  'Wallets',
                  from['rowIndex'] as int,
                  {
                    'current balance': (from['current'] as double) - amt,
                    'last updated': _nowStr(),
                  },
                );
                await GoogleSheetsService().updateRowColumns(
                  spreadsheetId,
                  'Wallets',
                  to['rowIndex'] as int,
                  {
                    'current balance': (to['current'] as double) + amt,
                    'last updated': _nowStr(),
                  },
                );
                _loadWallets();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'Transferred ${_fmt(amt)} from $fromName to $toName.',
                      ),
                      backgroundColor: const Color(0xFF10B981),
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
              ),
              child: const Text(
                'Confirm Transfer',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Action bar ───────────────────────────────────────────────
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
          child: Row(
            children: [
              SizedBox(
                width: 280,
                height: 42,
                child: TextField(
                  controller: _search,
                  decoration: InputDecoration(
                    hintText: 'Search by wallet name…',
                    hintStyle: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF94A3B8),
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      color: Color(0xFF94A3B8),
                      size: 18,
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF1F5F9),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              _actionBtn(
                '+ Add Wallet',
                const Color(0xFF10B981),
                _showAddWalletDialog,
              ),
              const SizedBox(width: 8),
              _actionBtn(
                '⇄ Transfer',
                const Color(0xFF3B82F6),
                _showTransferDialog,
              ),
              const SizedBox(width: 8),
              _actionBtn('↺ Refresh', const Color(0xFF64748B), _loadWallets),
            ],
          ),
        ),

        // ── Error ────────────────────────────────────────────────────
        if (_error.isNotEmpty)
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFFECACA)),
            ),
            child: Text(
              _error,
              style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13),
            ),
          ),

        // ── Table ────────────────────────────────────────────────────
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _filtered.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.account_balance_wallet_outlined,
                        size: 48,
                        color: Colors.grey.shade300,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'No wallets found. Add one.',
                        style: TextStyle(color: Colors.grey.shade400),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Table(
                    columnWidths: const {
                      0: FixedColumnWidth(40),
                      1: FlexColumnWidth(2),
                      2: FlexColumnWidth(1.5),
                      3: FlexColumnWidth(1.5),
                      4: FlexColumnWidth(2),
                      5: FixedColumnWidth(100),
                      6: FixedColumnWidth(80),
                    },
                    border: TableBorder(
                      horizontalInside: BorderSide(color: Colors.grey.shade200),
                      bottom: BorderSide(color: Colors.grey.shade200),
                    ),
                    children: [
                      // Header
                      TableRow(
                        decoration: const BoxDecoration(
                          color: Color(0xFFF8FAFC),
                        ),
                        children:
                            [
                                  '#',
                                  'Wallet Name',
                                  'Opening Balance',
                                  'Current Balance',
                                  'Last Updated',
                                  'Status',
                                  'Actions',
                                ]
                                .map(
                                  (h) => TableCell(
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 12,
                                      ),
                                      child: Text(
                                        h,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF94A3B8),
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                      ),
                      // Data rows
                      ..._filtered.asMap().entries.map((e) {
                        final i = e.key;
                        final w = e.value;
                        final curr = w['current'] as double;
                        return TableRow(
                          decoration: BoxDecoration(
                            color: i.isOdd
                                ? const Color(0xFFF8FAFC)
                                : Colors.white,
                          ),
                          children: [
                            _cell('${i + 1}', muted: true),
                            _cell(w['name'] as String, bold: true),
                            _cell(
                              _fmt(w['opening']),
                              color: const Color(0xFF475569),
                            ),
                            _cell(
                              _fmt(curr),
                              color: curr < 0
                                  ? const Color(0xFFDC2626)
                                  : const Color(0xFF10B981),
                              bold: true,
                            ),
                            _cell(
                              w['updated'] as String,
                              muted: true,
                              small: true,
                            ),
                            TableCell(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 10,
                                ),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFECFDF5),
                                    borderRadius: BorderRadius.circular(30),
                                  ),
                                  child: const Text(
                                    'Updated',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Color(0xFF10B981),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            TableCell(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                child: OutlinedButton(
                                  onPressed: () => _showAddFundsDialog(w),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 6,
                                    ),
                                    minimumSize: Size.zero,
                                    tapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                    side: const BorderSide(
                                      color: Color(0xFF10B981),
                                    ),
                                  ),
                                  child: const Text(
                                    'Add',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF10B981),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      }),
                    ],
                  ),
                ),
        ),
      ],
    );
  }

  Widget _cell(
    String v, {
    bool muted = false,
    bool bold = false,
    bool small = false,
    Color? color,
  }) {
    return TableCell(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Text(
          v,
          style: TextStyle(
            fontSize: small ? 11 : 13,
            color:
                color ??
                (muted ? const Color(0xFF94A3B8) : const Color(0xFF1E293B)),
            fontWeight: bold ? FontWeight.w700 : FontWeight.normal,
          ),
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }

  Widget _actionBtn(String label, Color bg, VoidCallback onTap) {
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: bg,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        elevation: 0,
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
