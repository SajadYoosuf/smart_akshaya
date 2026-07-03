class ServiceItem {
  final int rowIndex;
  final String serviceName;
  final String website;
  final String departmentFee;
  final String serviceCharge;
  final String commission;
  final bool allowEdit;
  final String followupDays;
  final String defaultWallet;

  ServiceItem({
    required this.rowIndex,
    required this.serviceName,
    required this.website,
    required this.departmentFee,
    required this.serviceCharge,
    required this.commission,
    required this.allowEdit,
    required this.followupDays,
    required this.defaultWallet,
  });

  factory ServiceItem.fromRow(List<dynamic> row, int rowIndex) {
    return ServiceItem(
      rowIndex: rowIndex,
      serviceName: row.length > 1 ? row[1].toString() : '',
      website: row.length > 2 ? row[2].toString() : '',
      departmentFee: row.length > 3 ? row[3].toString() : '0.00',
      serviceCharge: row.length > 4 ? row[4].toString() : '0.00',
      commission: row.length > 5 ? row[5].toString() : '0.00',
      allowEdit: row.length > 6
          ? row[6].toString().toLowerCase() == 'true'
          : false,
      followupDays: row.length > 7 ? row[7].toString() : '0',
      defaultWallet: row.length > 8 ? row[8].toString() : 'CASH',
    );
  }

  List<dynamic> toRow() {
    return [
      serviceName,
      website,
      departmentFee,
      serviceCharge,
      commission,
      allowEdit.toString(),
      followupDays,
      defaultWallet,
    ];
  }
}
