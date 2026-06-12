class ExpenseItem {
  final String id;
  final String date;
  final String category;
  final String amount;
  final String description;
  final int rowIndex;

  ExpenseItem({
    required this.id,
    required this.date,
    required this.category,
    required this.amount,
    required this.description,
    this.rowIndex = -1,
  });

  factory ExpenseItem.fromRow(List<dynamic> row, {required int rowIndex}) {
    return ExpenseItem(
      id: row.isNotEmpty ? row[0].toString() : '',
      date: row.length > 1 ? row[1].toString() : '',
      category: row.length > 2 ? row[2].toString() : '',
      amount: row.length > 3 ? row[3].toString() : '',
      description: row.length > 4 ? row[4].toString() : '',
      rowIndex: rowIndex,
    );
  }

  List<dynamic> toRow() {
    return [
      id,
      date,
      category,
      amount,
      description,
    ];
  }

  ExpenseItem copyWith({
    String? id,
    String? date,
    String? category,
    String? amount,
    String? description,
    int? rowIndex,
  }) {
    return ExpenseItem(
      id: id ?? this.id,
      date: date ?? this.date,
      category: category ?? this.category,
      amount: amount ?? this.amount,
      description: description ?? this.description,
      rowIndex: rowIndex ?? this.rowIndex,
    );
  }
}
