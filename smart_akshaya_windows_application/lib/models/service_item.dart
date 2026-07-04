class ServiceItem {
  final int rowIndex;
  final String id;
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
    this.id = '',
    required this.serviceName,
    required this.website,
    required this.departmentFee,
    required this.serviceCharge,
    required this.commission,
    required this.allowEdit,
    required this.followupDays,
    required this.defaultWallet,
  });

  factory ServiceItem.fromRow(List<dynamic> row, int rowIndex, [List<dynamic>? headers]) {
    if (headers == null || headers.isEmpty) {
      return ServiceItem(
        rowIndex: rowIndex,
        id: row.isNotEmpty ? row[0].toString() : '',
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

    String clean(dynamic h) => h.toString().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
    final headerList = headers.map(clean).toList();

    int getIdx(List<String> keys, int defaultVal) {
      for (final key in keys) {
        final idx = headerList.indexOf(key);
        if (idx != -1) return idx;
      }
      return defaultVal;
    }

    final idIdx = getIdx(['id', 'serviceid', 'srvid'], -1);
    final nameIdx = getIdx(['servicename', 'name', 'service'], idIdx == -1 ? 0 : 1);
    final websiteIdx = getIdx(['website', 'url', 'link'], idIdx == -1 ? 1 : 2);
    final deptFeeIdx = getIdx(['departmentfee', 'deptfee'], idIdx == -1 ? 2 : 3);
    final serviceChargeIdx = getIdx(['servicecharge', 'srvcharge'], idIdx == -1 ? 3 : 4);
    final commissionIdx = getIdx(['commission'], idIdx == -1 ? 4 : 5);
    final allowEditIdx = getIdx(['allowedit', 'allowediting'], idIdx == -1 ? 5 : 6);
    final followupIdx = getIdx(['followupdays', 'followup'], idIdx == -1 ? 6 : 7);
    final walletIdx = getIdx(['defaultwallet', 'wallet'], idIdx == -1 ? 7 : 8);

    return ServiceItem(
      rowIndex: rowIndex,
      id: idIdx != -1 && row.length > idIdx ? row[idIdx].toString() : '',
      serviceName: row.length > nameIdx ? row[nameIdx].toString() : '',
      website: row.length > websiteIdx ? row[websiteIdx].toString() : '',
      departmentFee: row.length > deptFeeIdx ? row[deptFeeIdx].toString() : '0.00',
      serviceCharge: row.length > serviceChargeIdx ? row[serviceChargeIdx].toString() : '0.00',
      commission: row.length > commissionIdx ? row[commissionIdx].toString() : '0.00',
      allowEdit: row.length > allowEditIdx
          ? row[allowEditIdx].toString().toLowerCase() == 'true'
          : false,
      followupDays: row.length > followupIdx ? row[followupIdx].toString() : '0',
      defaultWallet: row.length > walletIdx ? row[walletIdx].toString() : 'CASH',
    );
  }

  List<dynamic> toRow({bool hasIdColumn = false}) {
    if (hasIdColumn) {
      return [
        id.isEmpty ? 'SRV-${DateTime.now().millisecondsSinceEpoch}' : id,
        serviceName,
        website,
        departmentFee,
        serviceCharge,
        commission,
        allowEdit.toString(),
        followupDays,
        defaultWallet,
      ];
    } else {
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
}
