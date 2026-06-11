import 'dart:io';
import 'package:flutter/material.dart';
import '../../models/biodata_model.dart';
import '../../services/biodata_service.dart';
import 'biodata_workspace_screen.dart';

class BiodataDashboardScreen extends StatefulWidget {
  const BiodataDashboardScreen({super.key});

  @override
  State<BiodataDashboardScreen> createState() => _BiodataDashboardScreenState();
}

class _BiodataDashboardScreenState extends State<BiodataDashboardScreen> {
  final BiodataService _biodataService = BiodataService();
  List<BiodataModel> _biodatas = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBiodatas();
  }

  Future<void> _loadBiodatas() async {
    setState(() => _isLoading = true);
    final data = await _biodataService.getSavedBiodatas();
    setState(() {
      _biodatas = data;
      _isLoading = false;
    });
  }

  void _createNewBiodata() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BiodataWorkspaceScreen(
          biodata: BiodataModel.empty(),
        ),
      ),
    ).then((_) => _loadBiodatas());
  }

  void _editBiodata(BiodataModel biodata) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BiodataWorkspaceScreen(
          biodata: biodata,
        ),
      ),
    ).then((_) => _loadBiodatas());
  }

  Future<void> _deleteBiodata(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Biodata?'),
        content: const Text('Are you sure you want to delete this profile?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _biodataService.deleteBiodata(id);
      _loadBiodatas();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: const [
                  Text(
                    'Biodata Templates',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : GridView.builder(
                      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 200,
                        childAspectRatio: 0.8,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: _biodatas.length + 1,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          return _buildCreateNewCard();
                        }
                        final biodata = _biodatas[index - 1];
                        return _buildBiodataCard(biodata);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCreateNewCard() {
    return InkWell(
      onTap: _createNewBiodata,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: Container(
            width: 80,
            height: 80,
            decoration: const BoxDecoration(
              color: Color(0xFF4CAF50),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.add,
              color: Colors.white,
              size: 48,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBiodataCard(BiodataModel biodata) {
    return Stack(
      children: [
        InkWell(
          onTap: () => _editBiodata(biodata),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                    child: biodata.photoPath.isNotEmpty && File(biodata.photoPath).existsSync()
                        ? Image.file(
                            File(biodata.photoPath),
                            fit: BoxFit.cover,
                          )
                        : Container(
                            color: const Color(0xFFE2E8F0),
                            child: const Icon(
                              Icons.person,
                              size: 80,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(12.0),
                  color: Colors.white,
                  child: Text(
                    biodata.applicantName.isEmpty ? 'No Name' : biodata.applicantName.toUpperCase(),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          bottom: 4,
          right: 4,
          child: InkWell(
            onTap: () => _deleteBiodata(biodata.id),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.delete,
                color: Colors.white,
                size: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
