import 'package:flutter/material.dart';
import 'package:smart_akshaya/models/entry_status.dart';
import 'package:smart_akshaya/models/saved_bill.dart';
import '../services/google_sheets_service.dart';
import '../services/auth_service.dart';
import '../services/local_excel_service.dart';
import '../config/google_sheets_config.dart';

class CustomerModel {
  final String id;
  final String name;
  final String mobile;
  final String email;
  final String address;
  final double totalPaid;
  final double gpayUpi;
  final double cash;
  final double balance;
  final int rowIndex;

  CustomerModel(
    this.id,
    this.name,
    this.mobile,
    this.email,
    this.address, {
    this.totalPaid = 0.0,
    this.gpayUpi = 0.0,
    this.cash = 0.0,
    this.balance = 0.0,
    this.rowIndex = -1,
  });
}

class ServiceModel {
  final String name;
  final double departmentFee;
  final double serviceCharge;

  ServiceModel(this.name, this.departmentFee, this.serviceCharge);
}

class ServiceItem {
  String serviceName;
  double departmentFee;
  double serviceCharge;
  double walletCharge;
  int quantity;

  ServiceItem({
    required this.serviceName,
    this.departmentFee = 0.0,
    this.serviceCharge = 0.0,
    this.walletCharge = 0.0,
    this.quantity = 1,
  });

  double get total =>
      departmentFee + ((serviceCharge + walletCharge) * quantity);
}

class NewEntryProvider extends ChangeNotifier {
  // Customer Details
  final TextEditingController mobileController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  final TextEditingController addressController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  bool enableNameSearch = false;

  // Customers Data
  List<CustomerModel> customers = [];
  bool isLoadingCustomers = false;
  CustomerModel? selectedCustomer;

  // Added Services
  List<ServiceItem> addedServices = [];
  int? editingServiceIndex;
  int? editingRowIndex;

  // Current Service Input
  ServiceModel? selectedServiceModel;
  String? selectedService;
  final TextEditingController serviceSearchController = TextEditingController();
  final TextEditingController serviceChargeController = TextEditingController(
    text: '0',
  );
  final TextEditingController walletChargeController = TextEditingController(
    text: '0',
  );
  final TextEditingController quantityController = TextEditingController(
    text: '1',
  );

  // Payment
  final TextEditingController gpayUpiController = TextEditingController(
    text: '0',
  );
  final TextEditingController cashController = TextEditingController(text: '0');

  NewEntryProvider({bool loadCustomers = true}) {
    gpayUpiController.addListener(notifyListeners);
    cashController.addListener(notifyListeners);
    serviceChargeController.addListener(notifyListeners);
    quantityController.addListener(notifyListeners);
    if (loadCustomers) {
      _loadCustomers();
    }
  }

  Future<void> _loadCustomers() async {
    isLoadingCustomers = true;
    notifyListeners();
    try {
      final sheetsService = AuthService().sheetsService;
      final spreadsheetId = await AuthService().getSpreadsheetId();
      await AuthService().ensureSheetsServiceInitialized();

      final rows = await sheetsService.getRows(
        spreadsheetId,
        GoogleSheetsConfig.customerSheetName,
      );

      if (rows.length > 1) {
        final List<CustomerModel> parsedCustomers = [];
        for (int i = 1; i < rows.length; i++) {
          final row = rows[i];
          if (row.length > 1 && row[1].toString().trim().isNotEmpty) {
            parsedCustomers.add(
              CustomerModel(
                row.length > 0 ? row[0].toString() : '',
                row.length > 1 ? row[1].toString() : '',
                row.length > 2 ? row[2].toString() : '',
                row.length > 3 ? row[3].toString() : '',
                row.length > 4 ? row[4].toString() : '',
                totalPaid: row.length > 6
                    ? double.tryParse(row[6].toString()) ?? 0.0
                    : 0.0,
                gpayUpi: row.length > 7
                    ? double.tryParse(row[7].toString()) ?? 0.0
                    : 0.0,
                cash: row.length > 8
                    ? double.tryParse(row[8].toString()) ?? 0.0
                    : 0.0,
                balance: row.length > 9
                    ? double.tryParse(row[9].toString()) ?? 0.0
                    : 0.0,
                rowIndex: i + 1,
              ),
            );
          }
        }
        customers = parsedCustomers;
        print("Loaded ${customers.length} customers.");
      }
    } catch (e) {
      print("Error loading customers: $e");
    }
    isLoadingCustomers = false;
    notifyListeners();
  }

  double get currentServiceTotal {
    double sCharge = double.tryParse(serviceChargeController.text) ?? 0.0;
    int qty = int.tryParse(quantityController.text) ?? 1;
    return sCharge * qty;
  }

  void selectCustomer(CustomerModel customer) {
    selectedCustomer = customer;
    nameController.text = customer.name;
    mobileController.text = customer.mobile;
    emailController.text = customer.email;
    addressController.text = customer.address;
    notifyListeners();
  }

  void selectService(ServiceModel service) {
    selectedService = service.name;
    serviceChargeController.text = service.serviceCharge.toStringAsFixed(2);
    quantityController.text = '1';
    notifyListeners();
  }

  @override
  void dispose() {
    mobileController.dispose();
    nameController.dispose();
    addressController.dispose();
    emailController.dispose();
    serviceSearchController.dispose();
    serviceChargeController.dispose();
    walletChargeController.dispose();
    quantityController.dispose();
    gpayUpiController.dispose();
    cashController.dispose();
    super.dispose();
  }

  void toggleNameSearch(bool value) {
    enableNameSearch = value;
    notifyListeners();
  }

  void addService() {
    if (selectedService == null || selectedService!.isEmpty) return;

    double sCharge = double.tryParse(serviceChargeController.text) ?? 0;
    double wCharge = double.tryParse(walletChargeController.text) ?? 0;
    int qty = int.tryParse(quantityController.text) ?? 1;
    double dFee = selectedServiceModel?.departmentFee ?? 0;

    final newItem = ServiceItem(
      serviceName: selectedService!,
      serviceCharge: sCharge,
      walletCharge: wCharge,
      quantity: qty,
      departmentFee: dFee,
    );

    if (editingServiceIndex != null) {
      addedServices[editingServiceIndex!] = newItem;
      editingServiceIndex = null;
    } else {
      addedServices.add(newItem);
    }

    // Reset current input
    selectedServiceModel = null;
    selectedService = null;
    serviceSearchController.clear();
    serviceChargeController.text = '0';
    walletChargeController.text = '0';
    quantityController.text = '1';
    editingServiceIndex = null;
    notifyListeners();
  }

  void editService(int index) {
    if (index < 0 || index >= addedServices.length) return;

    final item = addedServices[index];

    selectedService = item.serviceName;
    serviceSearchController.text = item.serviceName;
    serviceChargeController.text = item.serviceCharge.toStringAsFixed(2);
    walletChargeController.text = item.walletCharge.toStringAsFixed(2);
    quantityController.text = item.quantity.toString();

    selectedServiceModel = ServiceModel(
      item.serviceName,
      item.departmentFee,
      item.serviceCharge,
    );

    editingServiceIndex = index;
    notifyListeners();
  }

  void removeService(int index) {
    addedServices.removeAt(index);
    notifyListeners();
  }

  // Calculations
  double get departmentFeeTotal =>
      addedServices.fold(0, (sum, item) => sum + item.departmentFee);
  double get serviceChargeTotal => addedServices.fold(
    0,
    (sum, item) => sum + (item.serviceCharge * item.quantity),
  );
  double get billTotal => departmentFeeTotal + serviceChargeTotal;
  double get previousBalance {
    if (selectedCustomer != null && selectedCustomer!.balance < 0) {
      return selectedCustomer!.balance.abs();
    }
    return 0.0;
  }

  double get totalAmount => billTotal + previousBalance;

  double get gpayUpi => double.tryParse(gpayUpiController.text) ?? 0;
  double get cash => double.tryParse(cashController.text) ?? 0;
  double get totalPaid => gpayUpi + cash;
  double get balance => totalPaid - totalAmount;

  void loadFromSavedBill(SavedBill bill) {
    editingRowIndex = bill.rowIndex;
    mobileController.text = bill.mobile;
    nameController.text = bill.customerName;

    final cIdx = customers.indexWhere(
      (c) => c.mobile == bill.mobile && c.name == bill.customerName,
    );
    if (cIdx != -1) {
      selectedCustomer = customers[cIdx];
    } else {
      selectedCustomer = null;
    }

    addedServices.clear();
    if (bill.services.isNotEmpty) {
      final parts = bill.services.split(', ');
      for (var part in parts) {
        final xIdx = part.indexOf('x ');
        if (xIdx != -1) {
          final qtyStr = part.substring(0, xIdx);
          final nameStr = part.substring(xIdx + 2);
          final qty = int.tryParse(qtyStr) ?? 1;

          addedServices.add(
            ServiceItem(
              serviceName: nameStr,
              quantity: qty,
              serviceCharge: parts.length == 1 && qty > 0
                  ? bill.totalAmount / qty
                  : 0,
            ),
          );
        }
      }
    }

    gpayUpiController.text = bill.gpayUpi.toStringAsFixed(2);
    cashController.text = bill.cash.toStringAsFixed(2);

    notifyListeners();
  }

  Future<void> saveEntry(
    BuildContext context, {
    EntryStatus status = EntryStatus.saved,
    VoidCallback? onSuccess,
  }) async {
    if (addedServices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one service.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    try {
      final session = await AuthService().getSessionDetails();
      final staffName = session['name'] ?? 'Unknown';
      final now = DateTime.now();
      final date =
          '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
      final time =
          '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

      final sheetsService = AuthService().sheetsService;
      final spreadsheetId = await AuthService().getSpreadsheetId();

      if (spreadsheetId.isEmpty) throw Exception("Spreadsheet ID not found.");

      // Combine services into a string
      String servicesStr = addedServices
          .map((e) => '${e.quantity}x ${e.serviceName}')
          .join(', ');

      // Prepare Main Entry Row
      // Format: Date, Time, Staff Name, Mobile, Customer Name, Service, Quantity, Total Amount, GPay, Cash, Balance, Status
      List<dynamic> entryRow = [
        date,
        time,
        staffName,
        mobileController.text,
        nameController.text,
        servicesStr,
        addedServices.fold(0, (sum, item) => sum + item.quantity),
        totalAmount,
        gpayUpi,
        cash,
        balance,
        status.name,
      ];

      // Find existing customer to prevent duplicates if not selected from dropdown
      CustomerModel? existingCustomer = selectedCustomer;
      if (existingCustomer == null) {
        final enteredMobile = mobileController.text.trim();
        final enteredName = nameController.text.trim().toLowerCase();
        
        if (enteredMobile.isNotEmpty || enteredName.isNotEmpty) {
           try {
             existingCustomer = customers.firstWhere((c) => 
               (enteredMobile.isNotEmpty && c.mobile == enteredMobile) ||
               (enteredName.isNotEmpty && c.name.toLowerCase() == enteredName)
             );
           } catch (e) {
             existingCustomer = null;
           }
        }
      }

      // Calculate Accumulated Customer Info
      double accumulatedTotalPaid =
          (existingCustomer?.totalPaid ?? 0.0) + totalPaid;
      double accumulatedGpay = (existingCustomer?.gpayUpi ?? 0.0) + gpayUpi;
      double accumulatedCash = (existingCustomer?.cash ?? 0.0) + cash;

      // Calculate overall new balance
      // We store balance exactly as calculated (totalPaid - totalAmount).
      double newCustomerBalance = balance;

      // Prepare Customer Details Row
      // Format: ID, Name, Mobile, Email, Address, Remarks, Total Paid, GPay/UPI, Cash, Balance
      List<dynamic> customerRow = [
        existingCustomer?.id ?? now.millisecondsSinceEpoch.toString(),
        nameController.text,
        mobileController.text,
        emailController.text,
        addressController.text,
        'Auto-added via Service Entry',
        accumulatedTotalPaid,
        accumulatedGpay,
        accumulatedCash,
        newCustomerBalance,
      ];

      // Save to Google Sheets
      if (editingRowIndex != null) {
        await sheetsService.updateRow(
          spreadsheetId,
          GoogleSheetsConfig.serviceEntrySheetName,
          editingRowIndex!,
          entryRow,
        );
      } else {
        await sheetsService.appendRow(
          spreadsheetId,
          GoogleSheetsConfig.serviceEntrySheetName,
          entryRow,
        );
      }

      if (existingCustomer != null && existingCustomer.rowIndex > 0) {
        await sheetsService.updateRow(
          spreadsheetId,
          GoogleSheetsConfig.customerSheetName,
          existingCustomer.rowIndex,
          customerRow,
        );
      } else {
        await sheetsService.appendRow(
          spreadsheetId,
          GoogleSheetsConfig.customerSheetName,
          customerRow,
        );
      }

      // ignore: use_build_context_synchronously
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Entry saved successfully!'),
          backgroundColor: Colors.green,
        ),
      );

      // Clear Form
      clearForm();

      if (onSuccess != null) {
        onSuccess();
      }
    } catch (e) {
      // ignore: use_build_context_synchronously
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error saving entry: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void clearForm() {
    selectedCustomer = null;
    mobileController.clear();
    nameController.clear();
    addressController.clear();
    emailController.clear();
    gpayUpiController.text = '0';
    cashController.text = '0';
    addedServices.clear();
    editingServiceIndex = null;
    editingRowIndex = null;
    notifyListeners();
  }
}
