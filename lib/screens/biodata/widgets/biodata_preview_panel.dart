import 'dart:io';
import 'package:flutter/material.dart';
import '../../../models/biodata_model.dart';

class BiodataPreviewPanel extends StatelessWidget {
  final BiodataModel biodata;

  const BiodataPreviewPanel({super.key, required this.biodata});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        biodata.applicantName.isEmpty ? 'Your Name' : biodata.applicantName.toUpperCase(),
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.indigo),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        biodata.profession.isEmpty ? 'Profession' : biodata.profession,
                        style: const TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 12),
                      _buildContactRow(Icons.phone, biodata.mobileNumber),
                      _buildContactRow(Icons.email, biodata.emailId),
                      _buildContactRow(Icons.location_on, biodata.address),
                    ],
                  ),
                ),
                if (biodata.photoPath.isNotEmpty && File(biodata.photoPath).existsSync())
                  Container(
                    width: 100,
                    height: 120,
                    margin: const EdgeInsets.only(left: 16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(4),
                      image: DecorationImage(
                        image: FileImage(File(biodata.photoPath)),
                        fit: BoxFit.cover,
                      ),
                    ),
                  )
              ],
            ),
            const SizedBox(height: 24),
            const Divider(),

            // Basic Details
            _buildSectionHeader('Personal Details'),
            _buildDetailRow('Father\'s Name', biodata.fatherName),
            _buildDetailRow('Date of Birth', biodata.dateOfBirth),
            _buildDetailRow('Gender', biodata.gender),
            _buildDetailRow('Marital Status', biodata.maritalStatus),
            _buildDetailRow('Nationality', biodata.nationality),
            _buildDetailRow('Religion', biodata.religion),
            _buildDetailRow('Passport No', biodata.passportNumber),

            if (biodata.educations.isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildSectionHeader('Education'),
              ...biodata.educations.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(width: 80, child: Text(e.year, style: const TextStyle(fontWeight: FontWeight.bold))),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(e.degree, style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text(e.institution, style: const TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  ],
                ),
              )),
            ],

            if (biodata.experiences.isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildSectionHeader('Experience'),
              ...biodata.experiences.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(width: 80, child: Text(e.duration, style: const TextStyle(fontWeight: FontWeight.bold))),
                    Expanded(child: Text(e.experience)),
                  ],
                ),
              )),
            ],

            if (biodata.projects.isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildSectionHeader('Projects'),
              ...biodata.projects.map((p) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.projectName, style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(p.description),
                  ],
                ),
              )),
            ],

            if (biodata.skills.isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildSectionHeader('Skills'),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: biodata.skills.where((s) => s.isNotEmpty).map((s) => Chip(
                  label: Text(s),
                  backgroundColor: Colors.indigo.shade50,
                  side: BorderSide.none,
                )).toList(),
              )
            ],

            if (biodata.languages.isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildSectionHeader('Languages'),
              ...biodata.languages.map((l) => Padding(
                padding: const EdgeInsets.only(bottom: 4.0),
                child: Row(
                  children: [
                    SizedBox(width: 120, child: Text(l.language, style: const TextStyle(fontWeight: FontWeight.w600))),
                    Text(l.level),
                  ],
                ),
              ))
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String text) {
    if (text.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        children: [
          Icon(icon, size: 14, color: Colors.grey),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 12))),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.indigo),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text('$label:', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
