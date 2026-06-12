import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';
import 'providers/new_entry_provider.dart';
import 'providers/services_provider.dart';
import 'core/data_state.dart';
import 'widgets/calculator_dialog.dart';
import 'models/service_item.dart' as smodels;
import 'models/entry_status.dart';
import 'package:url_launcher/url_launcher.dart';
import 'main_navigation_screen.dart';

class NewEntryScreen extends StatelessWidget {
  const NewEntryScreen({super.key});

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

    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.f9): () {
          provider.saveEntry(context, status: EntryStatus.completed);
        },
        const SingleActivator(LogicalKeyboardKey.f10): () {
          provider.clearForm();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Form cleared')),
          );
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
              // Custom Page Header (Under Navbar)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Text(
                        'New entry',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFBFDBFE)),
                        ),
                        child: const Text(
                          'Shortcuts: F9 Complete • F10 Clear • F11 Print • F12 PDF • F8 WhatsApp',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF1E40AF),
                          ),
                        ),
                      ),
                    ],
                  ),
                  _buildCustomDatePicker(),
                ],
              ),
          const SizedBox(height: 24),

          // CUSTOMER DETAILS
          _buildSectionCard(
            title: 'CUSTOMER DETAILS',
            icon: Icons.person_outline_rounded,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildTextField(
                    label: 'MOBILE',
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
                                    onChanged: (v) =>
                                        provider.toggleNameSearch(v ?? false),
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
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      ),
                                    )
                                  : Autocomplete<CustomerModel>(
                                      optionsBuilder:
                                          (TextEditingValue textEditingValue) {
                                            if (textEditingValue.text.isEmpty) {
                                              return const Iterable<
                                                CustomerModel
                                              >.empty();
                                            }
                                            return provider.customers.where((
                                              CustomerModel option,
                                            ) {
                                              return option.name
                                                  .toLowerCase()
                                                  .contains(
                                                    textEditingValue.text
                                                        .toLowerCase(),
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
                                            context,
                                            controller,
                                            focusNode,
                                            onFieldSubmitted,
                                          ) {
                                            if (controller.text !=
                                                    provider
                                                        .nameController
                                                        .text &&
                                                !focusNode.hasFocus) {
                                              controller.text =
                                                  provider.nameController.text;
                                            }
                                            return TextField(
                                              controller: controller,
                                              focusNode: focusNode,
                                              onChanged: (val) =>
                                                  provider.nameController.text =
                                                      val,
                                              decoration: const InputDecoration(
                                                hintText: 'Search customer...',
                                                border: InputBorder.none,
                                                contentPadding: EdgeInsets.only(
                                                  bottom: 12,
                                                ),
                                              ),
                                            );
                                          },
                                      optionsViewBuilder: (context, onSelected, options) {
                                        return Align(
                                          alignment: Alignment.topLeft,
                                          child: Material(
                                            elevation: 4.0,
                                            child: ConstrainedBox(
                                              constraints: const BoxConstraints(
                                                maxHeight: 200,
                                                maxWidth: 300,
                                              ),
                                              child: ListView.builder(
                                                padding: EdgeInsets.zero,
                                                shrinkWrap: true,
                                                itemCount: options.length,
                                                itemBuilder: (BuildContext context, int index) {
                                                  final CustomerModel option =
                                                      options.elementAt(index);
                                                  return InkWell(
                                                    onTap: () =>
                                                        onSelected(option),
                                                    child: Padding(
                                                      padding:
                                                          const EdgeInsets.all(
                                                            12.0,
                                                          ),
                                                      child: Column(
                                                        crossAxisAlignment:
                                                            CrossAxisAlignment
                                                                .start,
                                                        children: [
                                                          Text(
                                                            option.name,
                                                            style:
                                                                const TextStyle(
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .bold,
                                                                  fontSize: 13,
                                                                ),
                                                          ),
                                                          Text(
                                                            '${option.mobile} | ${option.address}',
                                                            style:
                                                                const TextStyle(
                                                                  fontSize: 10,
                                                                  color: Colors
                                                                      .grey,
                                                                ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  );
                                                },
                                              ),
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                            )
                          : Container(
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
                              child: TextField(
                                controller: provider.nameController,
                                keyboardType: TextInputType.name,
                                decoration: const InputDecoration(
                                  hintText: '',
                                  border: InputBorder.none,
                                  contentPadding: EdgeInsets.only(bottom: 12),
                                ),
                              ),
                            ),
                    ],
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: _buildTextField(
                    label: 'ADDRESS',
                    hint: '',
                    controller: provider.addressController,
                    keyboardType: TextInputType.streetAddress,
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: _buildTextField(
                    label: 'EMAIL',
                    hint: '',
                    controller: provider.emailController,
                    keyboardType: TextInputType.emailAddress,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // SERVICE DETAILS
          _buildSectionCard(
            title: 'SERVICE DETAILS',
            icon: Icons.grid_view_rounded,
            child: Column(
              children: [
                Row(
                  children: [
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
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Autocomplete<ServiceModel>(
                              optionsBuilder:
                                  (TextEditingValue textEditingValue) {
                                    if (textEditingValue.text.isEmpty) {
                                      return liveServices;
                                    }
                                    return liveServices.where((
                                      ServiceModel option,
                                    ) {
                                      return option.name.toLowerCase().contains(
                                        textEditingValue.text.toLowerCase(),
                                      );
                                    });
                                  },
                              displayStringForOption: (ServiceModel option) =>
                                  option.name,
                              onSelected: (ServiceModel selection) {
                                provider.selectService(selection);
                                provider.serviceSearchController.text =
                                    selection.name;
                              },
                              fieldViewBuilder:
                                  (
                                    context,
                                    controller,
                                    focusNode,
                                    onFieldSubmitted,
                                  ) {
                                    // Sync the clear action safely
                                    if (provider
                                            .serviceSearchController
                                            .text
                                            .isEmpty &&
                                        controller.text.isNotEmpty) {
                                      WidgetsBinding.instance
                                          .addPostFrameCallback((_) {
                                            if (controller.text.isNotEmpty)
                                              controller.clear();
                                          });
                                    }
                                    return TextField(
                                      controller: controller,
                                      focusNode: focusNode,
                                      onChanged: (val) {
                                        provider.selectedService = val;
                                      },
                                      onTap: () {
                                        if (controller.text.isEmpty) {
                                          // Trigger a rebuild of options
                                          controller.text = ' ';
                                          controller.selection =
                                              TextSelection.collapsed(
                                                offset: 1,
                                              );
                                          Future.delayed(
                                            const Duration(milliseconds: 10),
                                            () {
                                              controller.clear();
                                            },
                                          );
                                        }
                                      },
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
                              optionsViewBuilder: (context, onSelected, options) {
                                return Align(
                                  alignment: Alignment.topLeft,
                                  child: Material(
                                    elevation: 4.0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      side: const BorderSide(
                                        color: Color(0xFFE2E8F0),
                                      ),
                                    ),
                                    child: ConstrainedBox(
                                      constraints: const BoxConstraints(
                                        maxHeight: 250,
                                        maxWidth: 300,
                                      ),
                                      child: Scrollbar(
                                        thumbVisibility: true,
                                        child: ListView.builder(
                                          padding: EdgeInsets.zero,
                                          shrinkWrap: true,
                                          itemCount: options.length,
                                          itemBuilder:
                                              (
                                                BuildContext context,
                                                int index,
                                              ) {
                                                final ServiceModel option =
                                                    options.elementAt(index);
                                                return InkWell(
                                                  onTap: () {
                                                    onSelected(option);
                                                  },
                                                  child: Container(
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                          horizontal: 16,
                                                          vertical: 10,
                                                        ),
                                                    decoration: BoxDecoration(
                                                      border:
                                                          index <
                                                              options.length - 1
                                                          ? const Border(
                                                              bottom: BorderSide(
                                                                color: Color(
                                                                  0xFFF1F5F9,
                                                                ),
                                                              ),
                                                            )
                                                          : null,
                                                    ),
                                                    child: Column(
                                                      crossAxisAlignment:
                                                          CrossAxisAlignment
                                                              .start,
                                                      children: [
                                                        Text(
                                                          option.name,
                                                          style:
                                                              const TextStyle(
                                                                fontSize: 13,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w500,
                                                              ),
                                                        ),
                                                        const SizedBox(
                                                          height: 2,
                                                        ),
                                                        Text(
                                                          'Dept: ₹${option.departmentFee} | S.Charge: ₹${option.serviceCharge}',
                                                          style:
                                                              const TextStyle(
                                                                fontSize: 10,
                                                                color: Colors
                                                                    .black54,
                                                              ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                );
                                              },
                                        ),
                                      ), // Closes Scrollbar
                                    ), // Closes ConstrainedBox
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildTextField(
                        label: 'SERVICE CHARGE',
                        hint: '0',
                        controller: provider.serviceChargeController,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildTextField(
                        label: 'WALLET CHARGE',
                        hint: '0',
                        controller: provider.walletChargeController,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 20),
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
                const SizedBox(height: 24),
                Align(
                  alignment: Alignment.centerRight,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
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
                            fontSize: 16,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton.icon(
                        onPressed: provider.addService,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: provider.editingServiceIndex != null
                              ? const Color(0xFF3B82F6) // Blue for update
                              : const Color(0xFF10B981), // Green for add
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 18,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 0,
                        ),
                        icon: Icon(
                          provider.editingServiceIndex != null
                              ? Icons.check_rounded
                              : Icons.add_rounded,
                        ),
                        label: Text(
                          provider.editingServiceIndex != null
                              ? 'Update service'
                              : 'Add service',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // SERVICE LIST
          _buildSectionCard(
            title: 'SERVICE LIST',
            icon: Icons.table_chart_outlined,
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _buildTableHeader(),
                if (provider.addedServices.isEmpty)
                  Container(
                    height: 100,
                    alignment: Alignment.center,
                    child: const Text(
                      'No services added yet',
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
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                          vertical: 12,
                          horizontal: 16,
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                item.serviceName,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                '₹${item.serviceCharge.toStringAsFixed(2)}',
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                '₹${item.walletCharge.toStringAsFixed(2)}',
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                '${item.quantity}',
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                '₹${item.total.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(
                                    Icons.edit_outlined,
                                    color: Colors.blue,
                                    size: 20,
                                  ),
                                  onPressed: () => provider.editService(index),
                                  padding: const EdgeInsets.only(right: 12),
                                  constraints: const BoxConstraints(),
                                ),
                                IconButton(
                                  icon: const Icon(
                                    Icons.delete_outline,
                                    color: Colors.red,
                                    size: 20,
                                  ),
                                  onPressed: () =>
                                      provider.removeService(index),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // PAYMENT & SUMMARY (Matches Screenshot)
          _buildPaymentAndSummary(context, provider),

          const SizedBox(height: 32),
        ],
      ),
    ),
    ));
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
                    Icon(icon, size: 20, color: const Color(0xFF10B981)),
                  const SizedBox(width: 12),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                ],
              ),
            ),
          if (title.isNotEmpty)
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
          Padding(padding: padding ?? const EdgeInsets.all(24), child: child),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String hint,
    TextEditingController? controller,
    TextInputType? keyboardType,
    bool readOnly = false,
    String? prefixText,
    List<TextInputFormatter>? inputFormatters,
    Color? textColor,
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
        Container(
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: readOnly ? const Color(0xFFF1F5F9) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            readOnly: readOnly,
            inputFormatters: inputFormatters,
            style: TextStyle(color: textColor ?? Colors.black87, fontSize: 13),
            decoration: InputDecoration(
              prefixText: prefixText,
              prefixStyle: const TextStyle(
                color: Colors.black87,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
              hintText: hint,
              hintStyle: TextStyle(
                color: textColor ?? Colors.black26,
                fontSize: 13,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.only(bottom: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTableHeader() {
    return Container(
      color: const Color(0xFFEFF6FF),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      child: Row(
        children: const [
          Expanded(
            child: Text(
              'SERVICE',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'SERVICE CHARGE',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'WALLET CHARGE',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'QUANTITY',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              'TOTAL',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          Text(
            'ACTION',
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomDatePicker() {
    final now = DateTime.now();
    final formattedDate =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.calendar_month_rounded,
            size: 16,
            color: Color(0xFF3B82F6),
          ),
          const SizedBox(width: 10),
          Text(
            formattedDate,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF1E293B),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  // --- NEW PAYMENT & SUMMARY SECTION ---
  Widget _buildPaymentAndSummary(
    BuildContext context,
    NewEntryProvider provider,
  ) {
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
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
            child: Row(
              children: const [
                Icon(
                  Icons.receipt_long_rounded,
                  size: 20,
                  color: Color(0xFF3B82F6),
                ),
                SizedBox(width: 12),
                Text(
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
            padding: const EdgeInsets.all(24),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // LEFT SIDE: Inputs and Buttons
                Expanded(
                  flex: 3,
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _buildTextField(
                              label: 'GPay/UPI Alt+G',
                              hint: '0.00',
                              controller: provider.gpayUpiController,
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildTextField(
                              label: 'Cash Alt+C',
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
                            child: _buildTextField(
                              label: 'Total Paid',
                              hint: '₹${provider.totalPaid.toStringAsFixed(2)}',
                              readOnly: true,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildTextField(
                              label: 'Balance',
                              hint: '₹${provider.balance.toStringAsFixed(2)}',
                              readOnly: true,
                              textColor: provider.balance < 0
                                  ? Colors.red
                                  : (provider.balance > 0
                                        ? Colors.green
                                        : Colors.black87),
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
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                            icon: const Icon(Icons.check_rounded, size: 16),
                            label: const Text('Settle Cash Balance'),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton.icon(
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder: (context) => const CalculatorDialog(),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF475569),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                            icon: const Icon(Icons.calculate_rounded, size: 16),
                            label: const Text('Calculator'),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton.icon(
                            onPressed: () {
                              provider.saveEntry(
                                context,
                                status: EntryStatus.saved,
                                onSuccess: () {
                                  Navigator.pushReplacement(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          MainNavigationScreen(
                                            initialIndex: 10,
                                          ),
                                    ),
                                  );
                                },
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0F766E),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                            icon: const Icon(Icons.save_rounded, size: 16),
                            label: const Text('Save'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 40),
                // RIGHT SIDE: Summary Details
                Expanded(
                  flex: 2,
                  child: Column(
                    children: [
                      _summaryRow(
                        'Department Fee',
                        provider.departmentFeeTotal,
                      ),
                      _summaryRow(
                        'Service Charge',
                        provider.serviceChargeTotal,
                      ),
                      const Divider(height: 24),
                      _summaryRow('Bill Total', provider.billTotal, bold: true),
                      _summaryRow('Previous Balance', provider.previousBalance),
                      _summaryRow('Total Paid', provider.totalPaid),
                      _summaryRow(
                        'Balance',
                        provider.balance,
                        color: provider.balance < 0 ? Colors.red : Colors.black,
                      ),
                      const Divider(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Amount',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E3A8A),
                            ),
                          ),
                          Text(
                            '₹${provider.totalAmount.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E3A8A),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(12),
                bottomRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                const Text(
                  'Paper Size: ',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: 'A4',
                  items: const [
                    DropdownMenuItem(
                      value: 'A4',
                      child: Text('A4', style: TextStyle(fontSize: 12)),
                    ),
                    DropdownMenuItem(
                      value: 'A5',
                      child: Text('A5', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                  onChanged: (v) {},
                  isDense: true,
                  underline: const SizedBox(),
                ),
                const Spacer(),
                ElevatedButton.icon(
                  onPressed: () => provider.saveEntry(
                    context,
                    status: EntryStatus.completed,
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  icon: const Icon(Icons.check_circle_rounded, size: 16),
                  label: const Text('Complete F9'),
                ),
                const SizedBox(width: 8),
                _actionButton(context, Icons.print_rounded, 'Print F11', Colors.blue, onPressed: () => _handlePrint(context, provider)),
                const SizedBox(width: 8),
                _actionButton(
                  context,
                  Icons.picture_as_pdf_rounded,
                  'PDF F12',
                  Colors.blueAccent,
                ),
                const SizedBox(width: 8),
                _actionButton(context, Icons.message_rounded, 'WhatsApp F8', Colors.green, onPressed: () => _handleWhatsApp(context, provider)),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: () {
                    provider.clearForm();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Form cleared')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEF4444),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  icon: const Icon(Icons.clear_all_rounded, size: 16),
                  label: const Text('Clear F10', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(
    String label,
    double value, {
    bool bold = false,
    Color? color,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: bold ? FontWeight.bold : FontWeight.w500,
              color: const Color(0xFF475569),
            ),
          ),
          Text(
            '₹${value.toStringAsFixed(2)}',
            style: TextStyle(
              fontSize: 12,
              fontWeight: bold ? FontWeight.bold : FontWeight.w600,
              color: color ?? const Color(0xFF1E293B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionButton(BuildContext context, IconData icon, String label, Color color, {VoidCallback? onPressed}) {
    return ElevatedButton.icon(
      onPressed: onPressed ?? () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$label functionality coming soon!')),
        );
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        padding: const EdgeInsets.symmetric(horizontal: 12),
      ),
      icon: Icon(icon, size: 16),
      label: Text(label, style: const TextStyle(fontSize: 12)),
    );
  }

  String _generateBillText(NewEntryProvider provider) {
    StringBuffer buffer = StringBuffer();
    buffer.writeln('*Smart Akshaya*');
    buffer.writeln('--------------------------------');
    buffer.writeln('Customer: ${provider.nameController.text.isNotEmpty ? provider.nameController.text : "N/A"}');
    buffer.writeln('Mobile: ${provider.mobileController.text.isNotEmpty ? provider.mobileController.text : "N/A"}');
    buffer.writeln('--------------------------------');
    for (var item in provider.addedServices) {
      buffer.writeln('${item.serviceName} x${item.quantity}');
      buffer.writeln('  Amount: ₹${item.total.toStringAsFixed(2)}');
    }
    buffer.writeln('--------------------------------');
    buffer.writeln('Total Amount: ₹${provider.totalAmount.toStringAsFixed(2)}');
    buffer.writeln('Paid: ₹${provider.totalPaid.toStringAsFixed(2)}');
    buffer.writeln('Balance: ₹${provider.balance.toStringAsFixed(2)}');
    buffer.writeln('--------------------------------');
    buffer.writeln('Thank you!');
    return buffer.toString();
  }

  Future<void> _handleWhatsApp(BuildContext context, NewEntryProvider provider) async {
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

  void _handlePrint(BuildContext context, NewEntryProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Dummy Print / Receipt Preview'),
        content: SingleChildScrollView(
          child: Text(
            _generateBillText(provider),
            style: const TextStyle(fontFamily: 'Courier', fontSize: 14),
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
                const SnackBar(content: Text('Dummy Print Sent!')),
              );
            },
            child: const Text('Print'),
          ),
        ],
      ),
    );
  }
}
