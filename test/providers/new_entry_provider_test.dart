import 'package:flutter_test/flutter_test.dart';
import 'package:smart_akshaya/providers/new_entry_provider.dart';

void main() {
  group('NewEntryProvider', () {
    late NewEntryProvider provider;

    setUp(() {
      provider = NewEntryProvider(loadCustomers: false);
    });

    test('selectService updates selected service and charge', () {
      final service = ServiceModel('Test Service', 20.0, 150.0);
      provider.selectService(service);

      expect(provider.selectedService, 'Test Service');
      expect(provider.selectedServiceModel, isNull);
      expect(provider.serviceChargeController.text, '150.00');
      expect(provider.quantityController.text, '1');
    });

    test('addService appends a new service to addedServices and resets input', () {
      provider.selectedService = 'Test Service';
      provider.selectedServiceModel = ServiceModel('Test Service', 20.0, 150.0);
      provider.serviceChargeController.text = '150.00';
      provider.walletChargeController.text = '10.00';
      provider.quantityController.text = '2';

      provider.addService();

      expect(provider.addedServices, hasLength(1));
      final added = provider.addedServices.first;
      expect(added.serviceName, 'Test Service');
      expect(added.serviceCharge, 150.0);
      expect(added.walletCharge, 10.0);
      expect(added.quantity, 2);
      expect(provider.selectedService, isNull);
      expect(provider.serviceChargeController.text, '0');
      expect(provider.quantityController.text, '1');
    });

    test('removeService deletes existing service', () {
      provider.addedServices.add(ServiceItem(
        serviceName: 'To Remove',
        departmentFee: 10.0,
        serviceCharge: 100.0,
        walletCharge: 0.0,
        quantity: 1,
      ));
      provider.removeService(0);
      expect(provider.addedServices, isEmpty);
    });
  });
}
