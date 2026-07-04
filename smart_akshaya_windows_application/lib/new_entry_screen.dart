import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';
import 'package:smart_akshaya/providers/new_entry_provider.dart';
import 'providers/services_provider.dart';
import 'core/data_state.dart';
import 'widgets/balance_calculator_dialog.dart';
import 'models/service_item.dart' as smodels;
import 'models/entry_status.dart';
import 'services/auth_service.dart';
import 'package:url_launcher/url_launcher.dart';
import 'main_navigation_screen.dart';

class NewEntryScreen extends StatefulWidget {
  const NewEntryScreen({super.key});

  @override
  State<NewEntryScreen> createState() => _NewEntryScreenState();
}

class _NewEntryScreenState extends State<NewEntryScreen> {
  String _staffName = 'Loading...';
  String _centreName = 'Smart Akshaya';

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  void _loadSession() async {
    final session = await AuthService().getSessionDetails();
    setState(() {
      _staffName = session['name'] ?? 'Staff User';
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<NewEntryProvider>(context);
    final servicesState = context.watch<ServicesProvider>().state;

    List<ServiceModel> liveServices = [];
    if (servicesState is DataSuccess<List<smodels.ServiceItem>>) {
      liveServices = servicesState.data.map((item) {
        return ServiceModel(
          item.serviceName,
          double.tryParse(item.departmentFee) ?? 0.0,
          double.tryParse(item.serviceCharge) ?? 0.0,
        );
      }).toList();
    }

    final todayStr = DateTime.now().toString().split(' ')[0];

    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.f9): () {
          final isBlocked =
              provider.balance < 0 &&
              (provider.mobileController.text.trim().isEmpty ||
                  provider.nameController.text.trim().isEmpty);
          if (!isBlocked) {
            provider.saveEntry(context, status: EntryStatus.completed);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Please enter both Mobile Number and Name for credit entries.',
                ),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        const SingleActivator(LogicalKeyboardKey.f8): () {
          final isBlocked =
              provider.balance < 0 &&
              (provider.mobileController.text.trim().isEmpty ||
                  provider.nameController.text.trim().isEmpty);
          if (!isBlocked) {
            provider.saveEntry(context, status: EntryStatus.pending);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Please enter both Mobile Number and Name for credit entries.',
                ),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        const SingleActivator(LogicalKeyboardKey.f7): () {
          if (provider.balance < 0) {
            provider.cashController.text =
                (provider.cash + provider.balance.abs()).toStringAsFixed(2);
          }
        },
        const SingleActivator(LogicalKeyboardKey.f6): () {
          showDialog(
            context: context,
            builder: (context) =>
                BalanceCalculatorDialog(totalAmount: provider.totalAmount),
          );
        },
        const SingleActivator(LogicalKeyboardKey.f5): () {
          _handleWhatsApp(context, provider);
        },
        const SingleActivator(LogicalKeyboardKey.f10): () {
          provider.clearForm();
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Form cleared')));
        },
        const SingleActivator(LogicalKeyboardKey.f11): () {
          _handlePrint(context, provider);
        },
      },
      child: Focus(
        autofocus: true,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(todayStr),
              const SizedBox(height: 24),
              _buildCustomerCard(provider),
              const SizedBox(height: 20),
              _buildAddServiceCard(provider, liveServices),
              const SizedBox(height: 20),
              _buildBillItemsCard(provider),
              const SizedBox(height: 20),
              _buildPaymentAndSummary(
                context,
                provider,
                isWideLayout: false, // We'll handle layout internally
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(String todayStr) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Billing $_centreName — Staff: $_staffName',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  const Icon(
                    Icons.keyboard_outlined,
                    size: 16,
                    color: Color(0xFF64748B),
                  ),
                  const Text(
                    'Shortcuts:',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF475569),
                    ),
                  ),
                  _buildShortcutBadge('F7', 'Settle'),
                  _buildShortcutBadge('F8', 'Save'),
                  _buildShortcutBadge('F9', 'Complete'),
                  _buildShortcutBadge('F10', 'Clear'),
                  _buildShortcutBadge('Alt+G', 'UPI'),
                  _buildShortcutBadge('Alt+C', 'Cash'),
                  _buildShortcutBadge('Alt+B', 'Calc'),
                  _buildShortcutBadge('Alt+W', 'Share'),
                  _buildShortcutBadge('Alt+P', 'Print'),
                ],
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.calendar_today_outlined,
                size: 16,
                color: Color(0xFF64748B),
              ),
              const SizedBox(width: 8),
              Text(
                todayStr,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF475569),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildShortcutBadge(String key, String action) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        border: Border.all(color: const Color(0xFFFDE68A)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            key,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: Color(0xFFB45309),
            ),
          ),
          const SizedBox(width: 4),
          Text(
            action,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Color(0xFF78350F),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomerCard(NewEntryProvider provider) {
    return _buildSectionCard(
      title: 'CUSTOMER DETAILS',
      icon: Icons.account_circle_outlined,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: _buildTextField(
              label: 'MOBILE NUMBER',
              hint: 'Enter mobile number',
              controller: provider.mobileController,
              keyboardType: TextInputType.phone,
              prefixText: '+91 ',
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(10),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'NAME',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  height: 40,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: provider.isLoadingCustomers
                      ? const Center(
                          child: SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : Row(
                          children: [
                            const Icon(
                              Icons.search,
                              size: 16,
                              color: Color(0xFF94A3B8),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Autocomplete<CustomerModel>(
                                optionsBuilder: (TextEditingValue val) {
                                  if (val.text.isEmpty)
                                    return const Iterable<
                                      CustomerModel
                                    >.empty();
                                  return provider.customers.where((
                                    CustomerModel option,
                                  ) {
                                    return option.name.toLowerCase().contains(
                                      val.text.toLowerCase(),
                                    );
                                  });
                                },
                                displayStringForOption:
                                    (CustomerModel option) => option.name,
                                onSelected: (CustomerModel selection) {
                                  provider.selectCustomer(selection);
                                },
                                fieldViewBuilder:
                                    (
                                      ctx,
                                      controller,
                                      focusNode,
                                      onFieldSubmitted,
                                    ) {
                                      if (controller.text !=
                                              provider.nameController.text &&
                                          !focusNode.hasFocus) {
                                        controller.text =
                                            provider.nameController.text;
                                      }
                                      return TextField(
                                        controller: controller,
                                        focusNode: focusNode,
                                        onChanged: (v) =>
                                            provider.nameController.text = v,
                                        decoration: const InputDecoration(
                                          hintText: 'Search customer...',
                                          border: InputBorder.none,
                                          contentPadding: EdgeInsets.only(
                                            bottom: 12,
                                          ),
                                        ),
                                        style: const TextStyle(fontSize: 13),
                                      );
                                    },
                              ),
                            ),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddServiceCard(
    NewEntryProvider provider,
    List<ServiceModel> liveServices,
  ) {
    return _buildSectionCard(
      title: 'ADD SERVICE',
      icon: Icons.add_shopping_cart_rounded,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Service Name Autocomplete
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(
                  height: 20,
                  child: Align(
                    alignment: Alignment.bottomLeft,
                    child: Text(
                      'SERVICES',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  height: 40,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Autocomplete<ServiceModel>(
                    optionsBuilder: (TextEditingValue val) {
                      if (val.text.isEmpty) return liveServices;
                      return liveServices.where(
                        (o) => o.name.toLowerCase().contains(
                          val.text.toLowerCase(),
                        ),
                      );
                    },
                    displayStringForOption: (ServiceModel o) => o.name,
                    onSelected: (ServiceModel selection) {
                      provider.selectService(selection);
                      provider.serviceSearchController.text = selection.name;
                    },
                    fieldViewBuilder:
                        (ctx, controller, focusNode, onFieldSubmitted) {
                          if (provider.serviceSearchController.text.isEmpty &&
                              controller.text.isNotEmpty) {
                            WidgetsBinding.instance.addPostFrameCallback(
                              (_) => controller.clear(),
                            );
                          }
                          return TextField(
                            controller: controller,
                            focusNode: focusNode,
                            onChanged: (v) => provider.selectedService = v,
                            style: const TextStyle(fontSize: 13),
                            decoration: const InputDecoration(
                              hintText: 'Search service...',
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.symmetric(
                                vertical: 10,
                              ),
                              suffixIcon: Icon(
                                Icons.arrow_drop_down_rounded,
                                color: Color(0xFF94A3B8),
                              ),
                            ),
                          );
                        },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Wallet Charge
          SizedBox(
            width: 90,
            child: _buildTextField(
              label: 'W.CHARGE',
              hint: '0',
              controller: provider.walletChargeController,
              keyboardType: TextInputType.number,
            ),
          ),
          const SizedBox(width: 12),

          // Wallet Dropdown
          SizedBox(
            width: 100,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(
                  height: 20,
                  child: Align(
                    alignment: Alignment.bottomLeft,
                    child: Text(
                      'WALLET',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  height: 40,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: provider.selectedWallet,
                      isExpanded: true,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF1E293B),
                      ),
                      items: provider.walletTypes.map((w) {
                        return DropdownMenuItem(
                          value: w,
                          child: Text(w, overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          provider.selectedWallet = val;
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Service Charge
          SizedBox(
            width: 90,
            child: _buildTextField(
              label: 'S.CHARGE',
              hint: '0',
              controller: provider.serviceChargeController,
              keyboardType: TextInputType.number,
            ),
          ),
          const SizedBox(width: 12),

          // Quantity
          SizedBox(
            width: 40,
            child: _buildTextField(
              label: 'QTY',
              hint: '1',
              controller: provider.quantityController,
              keyboardType: TextInputType.number,
            ),
          ),
          const SizedBox(width: 12),

          // Add Button
          Column(
            children: [
              SizedBox(
                height: 40,
                child: ElevatedButton.icon(
                  onPressed: provider.addService,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text(
                    'Add',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBillItemsCard(NewEntryProvider provider) {
    return _buildSectionCard(
      title: 'BILL ITEMS',
      icon: Icons.receipt_long_outlined,
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          _buildTableHeader(provider),
          if (provider.addedServices.isEmpty)
            Container(
              height: 100,
              alignment: Alignment.center,
              child: const Text(
                'No items added to bill yet',
                style: TextStyle(
                  color: Colors.grey,
                  fontStyle: FontStyle.italic,
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: provider.addedServices.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final item = provider.addedServices[index];
                return EditableBillItemRow(
                  index: index,
                  item: item,
                  provider: provider,
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData? icon,
    required Widget child,
    EdgeInsets? padding,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 15, 20, 15),
              child: Row(
                children: [
                  if (icon != null)
                    Icon(icon, size: 18, color: const Color(0xFF10B981)),
                  const SizedBox(width: 10),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                ],
              ),
            ),
          if (title.isNotEmpty)
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
          Padding(padding: padding ?? const EdgeInsets.all(20), child: child),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String hint,
    required TextEditingController controller,
    TextInputType keyboardType = TextInputType.text,
    String? prefixText,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 20,
          child: Align(
            alignment: Alignment.bottomLeft,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        SizedBox(
          height: 40,
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            inputFormatters: inputFormatters,
            decoration: InputDecoration(
              hintText: hint,
              prefixText: prefixText,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 10,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            style: const TextStyle(fontSize: 13),
          ),
        ),
      ],
    );
  }

  Widget _buildTableHeader(NewEntryProvider provider) {
    return Container(
      color: const Color(0xFFEFF6FF),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: const Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              '#',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              'SERVICE NAME',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'WALLET CHARGE',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'WALLET',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'SERVICE CHARGE',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'QUANTITY',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'TOTAL',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
              textAlign: TextAlign.right,
            ),
          ),
          SizedBox(width: 38),
        ],
      ),
    );
  }

  Widget _buildPaymentAndSummary(
    BuildContext context,
    NewEntryProvider provider, {
    bool isWideLayout = false,
  }) {
    final balanceColor = provider.balance < 0
        ? const Color(0xFFEF4444)
        : const Color(0xFF10B981);

    final isBlocked =
        provider.balance < 0 &&
        (provider.mobileController.text.trim().isEmpty ||
            provider.nameController.text.trim().isEmpty);

    final paymentInputs = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (isBlocked)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              border: Border.all(color: const Color(0xFFFDE68A)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFD97706),
                  size: 20,
                ),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Please enter Customer Name and Mobile Number for credit entries (negative balance).',
                    style: TextStyle(
                      color: Color(0xFFB45309),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                label: 'GPAY / UPI (Alt+G)',
                hint: '0.00',
                controller: provider.gpayUpiController,
                keyboardType: TextInputType.number,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: _buildTextField(
                label: 'CASH (Alt+C)',
                hint: '0.00',
                controller: provider.cashController,
                keyboardType: TextInputType.number,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'TOTAL PAID',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    height: 40,
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    alignment: Alignment.centerLeft,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Text(
                      '₹${provider.totalPaid.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'BALANCE',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    height: 40,
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    alignment: Alignment.centerLeft,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Text(
                      '₹${provider.balance.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: balanceColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  if (provider.balance < 0) {
                    provider.cashController.text =
                        (provider.cash + provider.balance.abs())
                            .toStringAsFixed(2);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B5CF6),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(0, 36),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                icon: const Icon(Icons.check_rounded, size: 15),
                label: const Text(
                  'Settle Cash Balance [F7]',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => BalanceCalculatorDialog(
                      totalAmount: provider.totalAmount,
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(0, 36),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                icon: const Icon(Icons.calculate_rounded, size: 15),
                label: const Text(
                  'Calculator [Alt+B]',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: isBlocked
                    ? null
                    : () {
                        provider.saveEntry(
                          context,
                          status: EntryStatus.pending,
                          onSuccess: () {
                            context
                                .findAncestorStateOfType<
                                  MainNavigationScreenState
                                >()
                                ?.setSelectedIndex(8);
                          },
                        );
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: isBlocked
                      ? const Color(0xFFCBD5E1)
                      : const Color(0xFF0D9488),
                  foregroundColor: isBlocked
                      ? const Color(0xFF94A3B8)
                      : Colors.white,
                  minimumSize: const Size(0, 36),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                icon: const Icon(Icons.save_rounded, size: 15),
                label: const Text(
                  'Save [F8]',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ),
      ],
    );

    final billSummary = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _summaryRow(
          'WALLET CHARGE',
          provider.addedServices.fold(
            0.0,
            (s, i) => s + (i.walletCharge * i.quantity),
          ),
          bold: true,
        ),
        _summaryRow('Service Charge', provider.serviceChargeTotal),
        _summaryRowWithTopBorder('Bill Total', provider.billTotal, bold: true),
        _summaryRow('Previous Balance', provider.previousBalance),
        const Divider(height: 20, color: Color(0xFFE2E8F0)),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Total Amount',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E3A8A),
              ),
            ),
            Text(
              '₹${provider.totalAmount.toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E3A8A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        _summaryRow('Total Paid', provider.totalPaid, bold: true),
        _summaryRow(
          'Balance',
          provider.balance,
          bold: true,
          color: balanceColor,
        ),
      ],
    );

    final actionButtonsRow = Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        ElevatedButton.icon(
          onPressed: isBlocked
              ? null
              : () {
                  provider.saveEntry(
                    context,
                    status: EntryStatus.completed,
                    onSuccess: () {
                      context
                          .findAncestorStateOfType<MainNavigationScreenState>()
                          ?.setSelectedIndex(8);
                    },
                  );
                },
          style: ElevatedButton.styleFrom(
            backgroundColor: isBlocked
                ? const Color(0xFFCBD5E1)
                : const Color(0xFF10B981),
            foregroundColor: isBlocked ? const Color(0xFF94A3B8) : Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            minimumSize: const Size(0, 48),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          icon: const Icon(Icons.check_rounded, size: 18),
          label: const Text(
            'Complete Bill [F9]',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
          ),
        ),
        _buildActionBtn(
          'Print [Alt+P]',
          const Color(0xFF3B82F6),
          Icons.print_rounded,
          () => _handlePrint(context, provider),
        ),
        _buildActionBtn(
          'PDF [F12]',
          const Color(0xFF3B82F6),
          Icons.picture_as_pdf_rounded,
          () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Invoice PDF generated!')),
            );
          },
        ),
        _buildActionBtn(
          'Whatsapp [F5]',
          const Color(0xFF10B981),
          Icons.chat_bubble_rounded,
          () => _handleWhatsApp(context, provider),
        ),
        _buildActionBtn(
          'Clear [F10]',
          const Color(0xFFEF4444),
          Icons.delete_rounded,
          () {
            provider.clearForm();
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Form cleared')));
          },
        ),
      ],
    );

    return _buildSectionCard(
      title: 'Payment & Summary',
      icon: Icons.payments_outlined,
      child: isWideLayout
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                paymentInputs,
                const SizedBox(height: 16),
                const Divider(height: 1, color: Color(0xFFE2E8F0)),
                const SizedBox(height: 16),
                billSummary,
                const SizedBox(height: 14),
                actionButtonsRow,
              ],
            )
          : Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 4, child: paymentInputs),
                const SizedBox(width: 24),
                Expanded(
                  flex: 3,
                  child: Column(
                    children: [
                      billSummary,
                      const SizedBox(height: 14),
                      actionButtonsRow,
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildActionBtn(
    String label,
    Color color,
    IconData icon,
    VoidCallback? onPressed,
  ) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: onPressed == null ? const Color(0xFFCBD5E1) : color,
        foregroundColor: onPressed == null
            ? const Color(0xFF94A3B8)
            : Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        minimumSize: const Size(0, 32),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      icon: Icon(icon, size: 12),
      label: Text(
        label,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _summaryRow(
    String label,
    double val, {
    bool bold = false,
    Color? color,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color:
                  color ??
                  (bold ? const Color(0xFF1E293B) : const Color(0xFF475569)),
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            '₹${val.toStringAsFixed(2)}',
            style: TextStyle(
              fontSize: 13,
              color:
                  color ??
                  (bold ? const Color(0xFF1E293B) : const Color(0xFF475569)),
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryRowWithTopBorder(
    String label,
    double val, {
    bool bold = false,
    Color? color,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6, top: 4),
      padding: const EdgeInsets.only(top: 8),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(
            style: BorderStyle.solid,
            color: Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: color ?? const Color(0xFF1E293B),
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            '₹${val.toStringAsFixed(2)}',
            style: TextStyle(
              fontSize: 13,
              color: color ?? const Color(0xFF1E293B),
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  void _handlePrint(BuildContext context, NewEntryProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'Receipt Print Preview',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
        content: Container(
          width: 300,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: SingleChildScrollView(
            child: Text(
              _generateBillText(provider),
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 12,
                color: Color(0xFF1E293B),
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Print sent to system default printer successfully!',
                  ),
                  backgroundColor: Color(0xFF10B981),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
            ),
            child: const Text('Print', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleWhatsApp(
    BuildContext context,
    NewEntryProvider provider,
  ) async {
    final mobile = provider.mobileController.text.trim();
    if (mobile.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a mobile number first')),
      );
      return;
    }
    final billText = _generateBillText(provider);
    final encodedText = Uri.encodeComponent(billText);
    final formattedMobile = mobile.length == 10 ? '91$mobile' : mobile;
    final url = Uri.parse('https://wa.me/$formattedMobile?text=$encodedText');

    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not launch WhatsApp')),
        );
      }
    }
  }

  String _generateBillText(NewEntryProvider provider) {
    StringBuffer buffer = StringBuffer();
    buffer.writeln('================================');
    buffer.writeln('         SMART AKSHAYA          ');
    buffer.writeln('    Akshaya E Center Pookiparamb ');
    buffer.writeln('================================');
    buffer.writeln('Date: ${DateTime.now().toString().split(' ')[0]}');
    buffer.writeln('Staff: $_staffName');
    buffer.writeln(
      'Customer: ${provider.nameController.text.isNotEmpty ? provider.nameController.text : "Walk-in"}',
    );
    buffer.writeln(
      'Mobile: ${provider.mobileController.text.isNotEmpty ? provider.mobileController.text : "N/A"}',
    );
    buffer.writeln('--------------------------------');
    for (var item in provider.addedServices) {
      buffer.writeln('${item.serviceName}');
      buffer.writeln(
        '  Qty: ${item.quantity}  W: ${item.walletName} (${item.walletCharge.toStringAsFixed(2)})',
      );
      buffer.writeln(
        '  S.Charge: ${item.serviceCharge.toStringAsFixed(2)}  Total: ₹${item.total.toStringAsFixed(2)}',
      );
    }
    buffer.writeln('--------------------------------');
    buffer.writeln('Bill Total:     ₹${provider.billTotal.toStringAsFixed(2)}');
    buffer.writeln(
      'Prev Balance:   ₹${provider.previousBalance.toStringAsFixed(2)}',
    );
    buffer.writeln('Total Paid:     ₹${provider.totalPaid.toStringAsFixed(2)}');
    buffer.writeln('Balance Due:    ₹${provider.balance.toStringAsFixed(2)}');
    buffer.writeln('================================');
    buffer.writeln('  THANK YOU - VISIT AGAIN!  ');
    buffer.writeln('================================');
    return buffer.toString();
  }
}

/// Custom Inline-Editable Row Widget for Bill Items
class EditableBillItemRow extends StatefulWidget {
  final int index;
  final ServiceItem item;
  final NewEntryProvider provider;

  const EditableBillItemRow({
    super.key,
    required this.index,
    required this.item,
    required this.provider,
  });

  @override
  State<EditableBillItemRow> createState() => _EditableBillItemRowState();
}

class _EditableBillItemRowState extends State<EditableBillItemRow> {
  late TextEditingController _serviceChargeController;
  late TextEditingController _walletChargeController;
  late TextEditingController _quantityController;

  @override
  void initState() {
    super.initState();
    _serviceChargeController = TextEditingController(
      text: widget.item.serviceCharge.toStringAsFixed(2),
    );
    _walletChargeController = TextEditingController(
      text: widget.item.walletCharge.toStringAsFixed(2),
    );
    _quantityController = TextEditingController(
      text: widget.item.quantity.toString(),
    );
  }

  @override
  void dispose() {
    _serviceChargeController.dispose();
    _walletChargeController.dispose();
    _quantityController.dispose();
    super.dispose();
  }

  void _updateValues() {
    widget.item.serviceCharge =
        double.tryParse(_serviceChargeController.text) ?? 0;
    widget.item.walletCharge =
        double.tryParse(_walletChargeController.text) ?? 0;
    widget.item.quantity = int.tryParse(_quantityController.text) ?? 1;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: Row(
        children: [
          // Index
          SizedBox(
            width: 30,
            child: Text(
              '${widget.index + 1}',
              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
          ),
          // Service Name
          Expanded(
            flex: 2,
            child: Text(
              widget.item.serviceName,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Wallet Charge (editable)
          Expanded(
            child: SizedBox(
              height: 32,
              child: TextField(
                controller: _walletChargeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 4,
                  ),
                  border: OutlineInputBorder(),
                ),
                style: const TextStyle(fontSize: 11),
                onChanged: (_) => _updateValues(),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Wallet Dropdown
          Expanded(
            child: SizedBox(
              height: 32,
              child: DropdownButtonHideUnderline(
                child: DropdownButtonFormField<String>(
                  value: widget.item.walletName,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 4,
                    ),
                    border: OutlineInputBorder(),
                  ),
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF1E293B),
                  ),
                  items: widget.provider.walletTypes.map((w) {
                    return DropdownMenuItem(
                      value: w,
                      child: Text(w, style: const TextStyle(fontSize: 11)),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() {
                        widget.item.walletName = val;
                      });
                      _updateValues();
                    }
                  },
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Service Charge (editable)
          Expanded(
            child: SizedBox(
              height: 32,
              child: TextField(
                controller: _serviceChargeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 4,
                  ),
                  border: OutlineInputBorder(),
                ),
                style: const TextStyle(fontSize: 11),
                onChanged: (_) => _updateValues(),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Quantity (editable)
          Expanded(
            child: SizedBox(
              height: 32,
              child: TextField(
                controller: _quantityController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 4,
                  ),
                  border: OutlineInputBorder(),
                ),
                style: const TextStyle(fontSize: 11),
                onChanged: (_) => _updateValues(),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Total
          Expanded(
            child: Text(
              '₹${widget.item.total.toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFF10B981),
              ),
              textAlign: TextAlign.right,
            ),
          ),
          const SizedBox(width: 14),

          // Delete button
          IconButton(
            icon: const Icon(Icons.close, color: Colors.red, size: 16),
            onPressed: () => widget.provider.removeService(widget.index),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}
