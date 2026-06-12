import 'entry_status.dart';

class SavedBill {
  final String date;
  final String time;
  final String staffName;
  final String mobile;
  final String customerName;
  final String services;
  final int quantity;
  final double totalAmount;
  final double gpayUpi;
  final double cash;
  final double balance;
  final EntryStatus status;
  final int rowIndex;

  SavedBill({
    required this.date,
    required this.time,
    required this.staffName,
    required this.mobile,
    required this.customerName,
    required this.services,
    required this.quantity,
    required this.totalAmount,
    required this.gpayUpi,
    required this.cash,
    required this.balance,
    required this.status,
    this.rowIndex = -1,
  });

  factory SavedBill.fromRow(List<dynamic> row, {int rowIndex = -1}) {
    String statusStr = row.length > 11
        ? row[11].toString().trim().toLowerCase()
        : 'billed';
    EntryStatus status = EntryStatus.values.firstWhere(
      (e) => e.name.toLowerCase() == statusStr,
      orElse: () => EntryStatus.billed,
    );

    return SavedBill(
      date: row.isNotEmpty ? row[0].toString() : '',
      time: row.length > 1 ? row[1].toString() : '',
      staffName: row.length > 2 ? row[2].toString() : '',
      mobile: row.length > 3 ? row[3].toString() : '',
      customerName: row.length > 4 ? row[4].toString() : '',
      services: row.length > 5 ? row[5].toString() : '',
      quantity: row.length > 6 ? int.tryParse(row[6].toString()) ?? 0 : 0,
      totalAmount: row.length > 7
          ? double.tryParse(row[7].toString()) ?? 0.0
          : 0.0,
      gpayUpi: row.length > 8 ? double.tryParse(row[8].toString()) ?? 0.0 : 0.0,
      cash: row.length > 9 ? double.tryParse(row[9].toString()) ?? 0.0 : 0.0,
      balance: row.length > 10
          ? double.tryParse(row[10].toString()) ?? 0.0
          : 0.0,
      status: status,
      rowIndex: rowIndex,
    );
  }
}
