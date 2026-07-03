class StaffMember {
  final int rowIndex; // Google Sheets row index
  final String id;
  final String name;
  final String address;
  final String mobile;
  final String email;
  final String userType; // 'admin' or 'staff'
  final String status;   // 'Active' or 'Inactive'
  final String password;
  final bool synced;

  StaffMember({
    this.rowIndex = 0,
    required this.id,
    required this.name,
    required this.address,
    required this.mobile,
    required this.email,
    required this.userType,
    required this.status,
    required this.password,
    this.synced = false,
  });

  factory StaffMember.fromRow(List<dynamic> row, {int rowIndex = 0}) {
    // Expected order: ID, Name, Address, Mobile, Email, User Type, Status, Password, Synced
    return StaffMember(
      rowIndex: rowIndex,
      id: row.length > 0 ? row[0].toString() : '',
      name: row.length > 1 ? row[1].toString() : '',
      address: row.length > 2 ? row[2].toString() : '',
      mobile: row.length > 3 ? row[3].toString() : '',
      email: row.length > 4 ? row[4].toString() : '',
      userType: row.length > 5 ? row[5].toString().toLowerCase() : 'staff',
      status: row.length > 6 ? row[6].toString() : 'Inactive',
      password: row.length > 7 ? row[7].toString() : '',
      synced: row.length > 8 ? row[8].toString().toLowerCase() == 'true' : false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'mobile': mobile,
      'email': email,
      'userType': userType,
      'status': status,
      'password': password,
      'synced': synced,
    };
  }

  factory StaffMember.fromJson(Map<String, dynamic> json) {
    return StaffMember(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      mobile: json['mobile'] ?? '',
      email: json['email'] ?? '',
      userType: json['userType'] ?? 'staff',
      status: json['status'] ?? 'Inactive',
      password: json['password'] ?? '',
      synced: json['synced'] ?? false,
    );
  }

  List<dynamic> toRow(bool isSynced) {
    return [id, name, address, mobile, email, userType, status, password, isSynced];
  }
}
