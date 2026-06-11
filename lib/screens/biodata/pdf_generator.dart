import 'dart:io';
import 'package:flutter/material.dart' hide Theme;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import '../../../models/biodata_model.dart';

class PdfGenerator {
  static Future<void> generateAndSavePdf(BiodataModel biodata, BuildContext context) async {
    final doc = pw.Document();

    // Optionally load an image if provided
    pw.ImageProvider? profileImage;
    if (biodata.photoPath.isNotEmpty && File(biodata.photoPath).existsSync()) {
      final imageBytes = File(biodata.photoPath).readAsBytesSync();
      profileImage = pw.MemoryImage(imageBytes);
    }

    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return [
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        biodata.applicantName.isEmpty ? 'Your Name' : biodata.applicantName.toUpperCase(),
                        style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        biodata.profession.isEmpty ? 'Profession' : biodata.profession,
                        style: const pw.TextStyle(fontSize: 14, color: PdfColors.grey),
                      ),
                      pw.SizedBox(height: 12),
                      _buildPdfContactRow(biodata.mobileNumber),
                      _buildPdfContactRow(biodata.emailId),
                      _buildPdfContactRow(biodata.address),
                    ],
                  ),
                ),
                if (profileImage != null)
                  pw.Container(
                    width: 100,
                    height: 120,
                    margin: const pw.EdgeInsets.only(left: 16),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.grey300),
                      image: pw.DecorationImage(image: profileImage, fit: pw.BoxFit.cover),
                    ),
                  )
              ],
            ),
            pw.SizedBox(height: 24),
            pw.Divider(),

            _buildPdfSectionHeader('Personal Details'),
            _buildPdfDetailRow('Father\'s Name', biodata.fatherName),
            _buildPdfDetailRow('Date of Birth', biodata.dateOfBirth),
            _buildPdfDetailRow('Gender', biodata.gender),
            _buildPdfDetailRow('Marital Status', biodata.maritalStatus),
            _buildPdfDetailRow('Nationality', biodata.nationality),
            _buildPdfDetailRow('Religion', biodata.religion),
            _buildPdfDetailRow('Passport No', biodata.passportNumber),

            if (biodata.educations.isNotEmpty) ...[
              pw.SizedBox(height: 16),
              _buildPdfSectionHeader('Education'),
              ...biodata.educations.map((e) => pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 8.0),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.SizedBox(width: 80, child: pw.Text(e.year, style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(e.degree, style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                          pw.Text(e.institution, style: const pw.TextStyle(color: PdfColors.grey)),
                        ],
                      ),
                    )
                  ],
                ),
              )),
            ],

            if (biodata.experiences.isNotEmpty) ...[
              pw.SizedBox(height: 16),
              _buildPdfSectionHeader('Experience'),
              ...biodata.experiences.map((e) => pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 8.0),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.SizedBox(width: 80, child: pw.Text(e.duration, style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                    pw.Expanded(child: pw.Text(e.experience)),
                  ],
                ),
              )),
            ],

            if (biodata.projects.isNotEmpty) ...[
              pw.SizedBox(height: 16),
              _buildPdfSectionHeader('Projects'),
              ...biodata.projects.map((p) => pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 8.0),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(p.projectName, style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                    pw.Text(p.description),
                  ],
                ),
              )),
            ],

            if (biodata.skills.isNotEmpty) ...[
              pw.SizedBox(height: 16),
              _buildPdfSectionHeader('Skills'),
              pw.Wrap(
                spacing: 8,
                runSpacing: 8,
                children: biodata.skills.where((s) => s.isNotEmpty).map((s) => pw.Text('• $s')).toList(),
              )
            ],

            if (biodata.languages.isNotEmpty) ...[
              pw.SizedBox(height: 16),
              _buildPdfSectionHeader('Languages'),
              ...biodata.languages.map((l) => pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 4.0),
                child: pw.Row(
                  children: [
                    pw.SizedBox(width: 120, child: pw.Text(l.language, style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                    pw.Text(l.level),
                  ],
                ),
              ))
            ],
          ];
        },
      ),
    );

    try {
      final outputDir = await getDownloadsDirectory();
      final file = File('${outputDir?.path}/biodata_${biodata.applicantName.replaceAll(' ', '_')}.pdf');
      await file.writeAsBytes(await doc.save());

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Saved to ${file.path}'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save PDF: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  static pw.Widget _buildPdfContactRow(String text) {
    if (text.isEmpty) return pw.SizedBox.shrink();
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 4.0),
      child: pw.Text(text, style: const pw.TextStyle(fontSize: 12)),
    );
  }

  static pw.Widget _buildPdfSectionHeader(String title) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 8.0),
      child: pw.Text(
        title.toUpperCase(),
        style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo),
      ),
    );
  }

  static pw.Widget _buildPdfDetailRow(String label, String value) {
    if (value.isEmpty) return pw.SizedBox.shrink();
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 4.0),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(width: 120, child: pw.Text('$label:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12))),
          pw.Expanded(child: pw.Text(value, style: const pw.TextStyle(fontSize: 12))),
        ],
      ),
    );
  }
}
