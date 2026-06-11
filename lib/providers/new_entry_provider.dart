import 'package:flutter/material.dart';
import '../services/google_sheets_service.dart';
import '../services/auth_service.dart';
import '../services/local_excel_service.dart';
import '../config/google_sheets_config.dart';

class ServiceModel {
  final String id;
  final String name;
  final double departmentFee;
  final double serviceCharge;

  ServiceModel(this.id, this.name, this.departmentFee, this.serviceCharge);
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

  // Added Services
  List<ServiceItem> addedServices = [];

  // Available Services from Sheet
  List<ServiceModel> availableServices = [];
  bool isLoadingServices = true;

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

  NewEntryProvider() {
    gpayUpiController.addListener(notifyListeners);
    cashController.addListener(notifyListeners);
    _loadAvailableServices();
  }

  Future<void> _loadAvailableServices() async {
    isLoadingServices = true;
    notifyListeners();
    try {
      final rows = await LocalExcelService().getRows(
        GoogleSheetsConfig.serviceSheetName,
      );
      if (rows.length > 1) {
        // Skip headers
        availableServices = rows
            .skip(1)
            .where((row) => row.length > 0 && row[0].toString().trim().isNotEmpty) // service_name is at index 0
            .map((row) {
              return ServiceModel(
                row.length > 0 ? row[0].toString() : '', // using service_name as ID
                row.length > 0 ? row[0].toString() : '', // service_name
                row.length > 2 ? double.tryParse(row[2].toString().replaceAll(',', '')) ?? 0.0 : 0.0, // department_fee
                row.length > 3 ? double.tryParse(row[3].toString().replaceAll(',', '')) ?? 0.0 : 0.0, // service_charge
              );
            })
            .toList();
        print("Loaded ${availableServices.length} services from Google Sheets.");
      } else {
        print("Sheet has 1 or fewer rows, no services loaded.");
      }
    } catch (e) {
      print("Error loading services: $e");
    }
    isLoadingServices = false;
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

    addedServices.add(
      ServiceItem(
        serviceName: selectedService!,
        serviceCharge: sCharge,
        walletCharge: wCharge,
        quantity: qty,
        departmentFee: dFee,
      ),
    );

    // Reset current input
    selectedServiceModel = null;
    selectedService = null;
    serviceSearchController.clear();
    serviceChargeController.text = '0';
    walletChargeController.text = '0';
    quantityController.text = '1';
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
  double get previousBalance => 0.0; // Mock for now
  double get totalAmount => billTotal + previousBalance;

  double get gpayUpi => double.tryParse(gpayUpiController.text) ?? 0;
  double get cash => double.tryParse(cashController.text) ?? 0;
  double get totalPaid => gpayUpi + cash;
  double get balance => totalPaid - totalAmount;

  Future<void> saveEntry(BuildContext context) async {
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

      final sheetsService = GoogleSheetsService();
      final spreadsheetId = await AuthService().getSpreadsheetId();

      if (spreadsheetId.isEmpty) throw Exception("Spreadsheet ID not found.");

      // Combine services into a string
      String servicesStr = addedServices
          .map((e) => '${e.quantity}x ${e.serviceName}')
          .join(', ');

      // Prepare Main Entry Row
      // Format: Date, Time, Staff Name, Mobile, Customer Name, Service, Quantity, Total Amount, GPay, Cash, Balance
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
      ];

      // Prepare Customer Details Row
      // Format: ID (Timestamp), Name, Mobile, Email, Address, Remarks
      List<dynamic> customerRow = [
        now.millisecondsSinceEpoch.toString(),
        nameController.text,
        mobileController.text,
        emailController.text,
        addressController.text,
        'Auto-added via Service Entry',
      ];

      // Save to Google Sheets
      await sheetsService.appendRow(
        spreadsheetId,
        GoogleSheetsConfig.serviceEntrySheetName,
        entryRow,
      );
      await sheetsService.appendRow(
        spreadsheetId,
        GoogleSheetsConfig.customerSheetName,
        customerRow,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Entry saved successfully!'),
          backgroundColor: Colors.green,
        ),
      );

      // Clear Form
      _clearForm();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error saving entry: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _clearForm() {
    mobileController.clear();
    nameController.clear();
    addressController.clear();
    emailController.clear();
    gpayUpiController.text = '0';
    cashController.text = '0';
    addedServices.clear();
    notifyListeners();
  }
}
