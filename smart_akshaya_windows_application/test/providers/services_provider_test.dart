import 'package:flutter_test/flutter_test.dart';
import 'package:smart_akshaya/models/service_item.dart';
import 'package:smart_akshaya/providers/services_provider.dart';
import 'package:smart_akshaya/core/data_state.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  group('ServicesProvider', () {
    late FakeServicesRepository repository;
    late ServicesProvider provider;

    setUp(() {
      repository = FakeServicesRepository([
        ServiceItem(
          rowIndex: 1,
          serviceName: 'Service A',
          website: 'https://service-a.example',
          departmentFee: '10.00',
          serviceCharge: '100.00',
          commission: '5.00',
          allowEdit: true,
          followupDays: '3',
          defaultWallet: 'CASH',
        ),
      ]);
      provider = ServicesProvider(repository);
    });

    test('loadServices populates state with items', () async {
      await provider.loadServices();
      expect(provider.state, isA<DataSuccess<List<ServiceItem>>>());
      final successState = provider.state as DataSuccess<List<ServiceItem>>;
      expect(successState.data, hasLength(1));
      expect(successState.data.first.serviceName, 'Service A');
    });

    test('addService saves service and refreshes state', () async {
      await provider.loadServices();
      await provider.addService(ServiceItem(
        rowIndex: 0,
        serviceName: 'Service B',
        website: 'https://service-b.example',
        departmentFee: '5.00',
        serviceCharge: '50.00',
        commission: '2.00',
        allowEdit: false,
        followupDays: '1',
        defaultWallet: 'CASH',
      ));

      final successState = provider.state as DataSuccess<List<ServiceItem>>;
      expect(successState.data, hasLength(2));
      expect(successState.data.any((item) => item.serviceName == 'Service B'), isTrue);
    });

    test('updateService modifies existing service', () async {
      await provider.loadServices();
      final original = (provider.state as DataSuccess<List<ServiceItem>>).data.first;
      final updated = ServiceItem(
        rowIndex: original.rowIndex,
        serviceName: 'Service A Updated',
        website: original.website,
        departmentFee: original.departmentFee,
        serviceCharge: original.serviceCharge,
        commission: original.commission,
        allowEdit: original.allowEdit,
        followupDays: original.followupDays,
        defaultWallet: original.defaultWallet,
      );
      await provider.updateService(updated);
      final successState = provider.state as DataSuccess<List<ServiceItem>>;
      expect(successState.data.first.serviceName, 'Service A Updated');
    });

    test('deleteService removes item from list', () async {
      await provider.loadServices();
      final original = (provider.state as DataSuccess<List<ServiceItem>>).data.first;
      await provider.deleteService(original.rowIndex);
      final state = provider.state;
      if (state is DataSuccess<List<ServiceItem>>) {
        expect(state.data, isEmpty);
      } else {
        expect(state, isA<DataEmpty<List<ServiceItem>>>());
      }
    });
  });
}
