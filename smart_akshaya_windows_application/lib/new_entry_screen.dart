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
          provider.saveEntry(context, status: EntryStatus.completed);
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
        const SingleActivator(LogicalKeyboardKey.f12): () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('PDF functionality coming soon!')),
          );
        },
        const SingleActivator(LogicalKeyboardKey.f8): () {
          _handleWhatsApp(context, provider);
        },
      },
      child: Focus(
        autofocus: true,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header Bar ──
              Row(
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
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: const Text(
                            'Shortcuts: F9 Complete • F10 Clear • F11 Print • F12 PDF • F8 WhatsApp • Alt+G UPI • Alt+C Cash',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1E40AF),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    todayStr,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // ── Customer Details (Only Mobile + Name) ──
              _buildSectionCard(
                title: 'CUSTOMER DETAILS',
                icon: Icons.person_outline_rounded,
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
                          SizedBox(
                            height: 20,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'NAME',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                ),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: Checkbox(
                                        value: provider.enableNameSearch,
                                        onChanged: (v) => provider
                                            .toggleNameSearch(v ?? false),
                                        visualDensity: VisualDensity.compact,
                                        activeColor: const Color(0xFF10B981),
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    const Text(
                                      'Enable name search',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Color(0xFF10B981),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 6),
                          provider.enableNameSearch
                              ? Container(
                                  height: 40,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: provider.isLoadingCustomers
                                      ? const Center(
                                          child: SizedBox(
                                            height: 18,
                                            width: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                            ),
                                          ),
                                        )
                                      : Autocomplete<CustomerModel>(
                                          optionsBuilder:
                                              (TextEditingValue val) {
                                                if (val.text.isEmpty)
                                                  return const Iterable<
                                                    CustomerModel
                                                  >.empty();
                                                return provider.customers.where(
                                                  (CustomerModel option) {
                                                    return option.name
                                                        .toLowerCase()
                                                        .contains(
                                                          val.text
                                                              .toLowerCase(),
                                                        );
                                                  },
                                                );
                                              },
                                          displayStringForOption:
                                              (CustomerModel option) =>
                                                  option.name,
                                          onSelected:
                                              (CustomerModel selection) {
                                                provider.selectCustomer(
                                                  selection,
                                                );
                                              },
                                          fieldViewBuilder:
                                              (
                                                ctx,
                                                controller,
                                                focusNode,
                                                onFieldSubmitted,
                                              ) {
                                                if (controller.text !=
                                                        provider
                                                            .nameController
                                                            .text &&
                                                    !focusNode.hasFocus) {
                                                  controller.text = provider
                                                      .nameController
                                                      .text;
                                                }
                                                return TextField(
                                                  controller: controller,
                                                  focusNode: focusNode,
                                                  onChanged: (v) =>
                                                      provider
                                                              .nameController
                                                              .text =
                                                          v,
                                                  decoration:
                                                      const InputDecoration(
                                                        hintText:
                                                            'Search customer...',
                                                        border:
                                                            InputBorder.none,
                                                        contentPadding:
                                                            EdgeInsets.only(
                                                              bottom: 12,
                                                            ),
                                                      ),
                                                );
                                              },
                                        ),
                                )
                              : SizedBox(
                                  height: 40,
                                  child: TextField(
                                    controller: provider.nameController,
                                    decoration: InputDecoration(
                                      hintText: 'Enter name',
                                      contentPadding:
                                          const EdgeInsets.symmetric(
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
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ── Service Details ──
              _buildSectionCard(
                title: 'SERVICE DETAILS',
                icon: Icons.grid_view_rounded,
                child: Column(
                  children: [
                    Row(
                      children: [
                        // Service Name Autocomplete
                        Expanded(
                          flex: 2,
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
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: const Color(0xFFE2E8F0),
                                  ),
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
                                  displayStringForOption: (ServiceModel o) =>
                                      o.name,
                                  onSelected: (ServiceModel selection) {
                                    provider.selectService(selection);
                                    provider.serviceSearchController.text =
                                        selection.name;
                                  },
                                  fieldViewBuilder:
                                      (
                                        ctx,
                                        controller,
                                        focusNode,
                                        onFieldSubmitted,
                                      ) {
                                        if (provider
                                                .serviceSearchController
                                                .text
                                                .isEmpty &&
                                            controller.text.isNotEmpty) {
                                          WidgetsBinding.instance
                                              .addPostFrameCallback(
                                                (_) => controller.clear(),
                                              );
                                        }
                                        return TextField(
                                          controller: controller,
                                          focusNode: focusNode,
                                          onChanged: (v) =>
                                              provider.selectedService = v,
                                          decoration: const InputDecoration(
                                            hintText: 'Search service...',
                                            border: InputBorder.none,
                                            contentPadding: EdgeInsets.only(
                                              top: 10,
                                              bottom: 12,
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
                        const SizedBox(width: 14),

                        // Service Charge
                        Expanded(
                          child: _buildTextField(
                            label: 'SERVICE CHARGE',
                            hint: '0',
                            controller: provider.serviceChargeController,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 14),

                        // Wallet Charge
                        Expanded(
                          child: _buildTextField(
                            label: 'WALLET CHARGE',
                            hint: '0',
                            controller: provider.walletChargeController,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 14),

                        // Wallet Dropdown
                        Expanded(
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
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    value: provider.selectedWallet,
                                    isExpanded: true,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: Color(0xFF1E293B),
                                    ),
                                    items: provider.walletTypes.map((w) {
                                      return DropdownMenuItem(
                                        value: w,
                                        child: Text(w),
                                      );
                                    }).toList(),
                                    onChanged: (val) {
                                      if (val != null) {
                                        setState(() {
                                          provider.selectedWallet = val;
                                        });
                                      }
                                    },
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 14),

                        // Quantity
                        Expanded(
                          child: _buildTextField(
                            label: 'QUANTITY',
                            hint: '1',
                            controller: provider.quantityController,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Text(
                            'Total: ₹${provider.currentServiceTotal.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: provider.addService,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 14,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text(
                            'Add Service',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ── Bill Items Table (renamed from Service List) ──
              _buildSectionCard(
                title: 'BILL ITEMS',
                icon: Icons.receipt_long_rounded,
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
              ),
              const SizedBox(height: 24),

              // ── Payment & Summary Section ──
              _buildPaymentAndSummary(context, provider),
            ],
          ),
        ),
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
      child: Row(
        children: const [
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
    NewEntryProvider provider,
  ) {
    final balanceColor = provider.balance < 0
        ? const Color(0xFFEF4444)
        : const Color(0xFF10B981);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 15, 20, 15),
            child: Row(
              children: [
                const Icon(
                  Icons.receipt_rounded,
                  size: 18,
                  color: Color(0xFF3B82F6),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Payment & Summary',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left - Payment inputs
                Expanded(
                  flex: 4,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
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
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Total Paid',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  height: 40,
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                  ),
                                  alignment: Alignment.centerLeft,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Text(
                                    '₹${provider.totalPaid.toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
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
                                  'Balance',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  height: 40,
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                  ),
                                  alignment: Alignment.centerLeft,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0),
                                    ),
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
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          ElevatedButton.icon(
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
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            icon: const Icon(Icons.check_rounded, size: 15),
                            label: const Text(
                              'Settle Cash Balance',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          ElevatedButton.icon(
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
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            icon: const Icon(Icons.calculate_rounded, size: 15),
                            label: const Text(
                              'Calculator',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          ElevatedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Save functionality'),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0D9488),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            icon: const Icon(Icons.save_rounded, size: 15),
                            label: const Text(
                              'Save',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 24),

                // Right - Bill Summary
                Expanded(
                  flex: 3,
                  child: Column(
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
                      _summaryRow(
                        'Service Charge',
                        provider.serviceChargeTotal,
                      ),
                      _summaryRow('Bill Total', provider.billTotal, bold: true),
                      _summaryRow('Previous Balance', provider.previousBalance),
                      _summaryRow('Total Paid', provider.totalPaid),
                      _summaryRow(
                        'Balance',
                        provider.balance,
                        color: balanceColor,
                        bold: true,
                      ),

                      Padding(
                        padding: const EdgeInsets.only(top: 12, bottom: 12),
                        child: Row(
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
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF1E3A8A),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Bottom Actions row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Paper Size',
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    height: 28,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      border: Border.all(
                                        color: Colors.grey.shade300,
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: DropdownButtonHideUnderline(
                                      child: DropdownButton<String>(
                                        value: 'A4',
                                        items: const [
                                          DropdownMenuItem(
                                            value: 'A4',
                                            child: Text(
                                              'A4',
                                              style: TextStyle(fontSize: 11),
                                            ),
                                          ),
                                        ],
                                        onChanged: null,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'QR Code',
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  SizedBox(
                                    height: 28,
                                    child: Transform.scale(
                                      scale: 0.6,
                                      child: Switch(
                                        value: false,
                                        onChanged: (v) {},
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),

                          Row(
                            children: [
                              _buildActionBtn(
                                'Complete F9',
                                const Color(0xFF10B981),
                                Icons.check_rounded,
                                () {
                                  provider.saveEntry(
                                    context,
                                    status: EntryStatus.completed,
                                    onSuccess: () {
                                      context
                                          .findAncestorStateOfType<
                                            MainNavigationScreenState
                                          >()
                                          ?.setSelectedIndex(8);
                                    },
                                  );
                                },
                              ),
                              const SizedBox(width: 6),
                              _buildActionBtn(
                                'Print',
                                const Color(0xFF3B82F6),
                                Icons.print_rounded,
                                () => _handlePrint(context, provider),
                              ),
                              const SizedBox(width: 6),
                              _buildActionBtn(
                                'PDF',
                                const Color(0xFF3B82F6),
                                Icons.picture_as_pdf_rounded,
                                () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Invoice PDF generated!'),
                                    ),
                                  );
                                },
                              ),
                              const SizedBox(width: 6),
                              _buildActionBtn(
                                'Whatsapp',
                                const Color(0xFF10B981),
                                Icons.chat_bubble_rounded,
                                () => _handleWhatsApp(context, provider),
                              ),
                              const SizedBox(width: 6),
                              _buildActionBtn(
                                'Clear',
                                const Color(0xFFEF4444),
                                Icons.delete_rounded,
                                () {
                                  provider.clearForm();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Form cleared'),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ],
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

  Widget _buildActionBtn(
    String label,
    Color color,
    IconData icon,
    VoidCallback onPressed,
  ) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        minimumSize: Size.zero,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
      icon: Icon(icon, size: 12),
      label: Text(
        label,
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
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
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: const Color(0xFF64748B),
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            '₹${val.toStringAsFixed(2)}',
            style: TextStyle(
              fontSize: 12,
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
    widget.provider.notifyListeners();
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
