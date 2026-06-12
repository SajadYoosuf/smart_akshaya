import 'package:flutter_test/flutter_test.dart';
import 'package:smart_akshaya/models/staff_member.dart';
import 'package:smart_akshaya/providers/staff_provider.dart';
import 'package:smart_akshaya/core/data_state.dart';

import '../test_helpers/test_helpers.dart';

void main() {
  group('StaffProvider', () {
    late FakeStaffRepository repository;
    late StaffProvider provider;

    setUp(() {
      repository = FakeStaffRepository([
        StaffMember(
          rowIndex: 1,
          id: '1',
          name: 'Alice',
          address: '123 Street',
          mobile: '9999999999',
          email: 'alice@example.com',
          userType: 'staff',
          status: 'Active',
          password: 'pass',
        ),
      ]);
      provider = StaffProvider(repository);
    });

    test('loadStaff populates list', () async {
      await provider.loadStaff();
      expect(provider.state, isA<DataSuccess<List<StaffMember>>>());
      final state = provider.state as DataSuccess<List<StaffMember>>;
      expect(state.data.first.name, 'Alice');
    });

    test('addStaff adds new staff and refreshes', () async {
      await provider.loadStaff();
      await provider.addStaff(StaffMember(
        id: '2',
        rowIndex: 2,
        name: 'Bob',
        address: '456 Avenue',
        mobile: '8888888888',
        email: 'bob@example.com',
        userType: 'admin',
        status: 'Active',
        password: 'pass',
      ));
      final state = provider.state as DataSuccess<List<StaffMember>>;
      expect(state.data.length, 2);
      expect(state.data.any((staff) => staff.name == 'Bob'), isTrue);
    });

    test('updateStaff updates existing staff', () async {
      await provider.loadStaff();
      final original = (provider.state as DataSuccess<List<StaffMember>>).data.first;
      await provider.updateStaff(StaffMember(
        rowIndex: original.rowIndex,
        id: original.id,
        name: 'Alice Updated',
        address: original.address,
        mobile: original.mobile,
        email: original.email,
        userType: original.userType,
        status: original.status,
        password: original.password,
      ));
      final state = provider.state as DataSuccess<List<StaffMember>>;
      expect(state.data.first.name, 'Alice Updated');
    });

    test('deleteStaff removes staff member', () async {
      await provider.loadStaff();
      final original = (provider.state as DataSuccess<List<StaffMember>>).data.first;
      await provider.deleteStaff(original.rowIndex);
      final state = provider.state;
      if (state is DataSuccess<List<StaffMember>>) {
        expect(state.data, isEmpty);
      } else {
        expect(state, isA<DataEmpty<List<StaffMember>>>());
      }
    });
  });
}
