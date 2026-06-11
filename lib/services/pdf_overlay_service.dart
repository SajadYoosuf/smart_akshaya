import 'dart:io';
import 'package:flutter/services.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';
import '../models/biodata_model.dart';

class PdfOverlayService {
  /// Generates a PDF by overlaying BiodataModel details onto a base PDF template.
  /// [templatePath] can be an asset path (e.g. 'assets/templates/resume.pdf')
  /// or a local file path uploaded by the user.
  static Future<Uint8List> generateOverlayPdf(BiodataModel data, String templatePath, {bool isAsset = true}) async {
    List<int> templateBytes;
    
    if (isAsset) {
      final ByteData byteData = await rootBundle.load(templatePath);
      templateBytes = byteData.buffer.asUint8List();
    } else {
      templateBytes = await File(templatePath).readAsBytes();
    }

    final PdfDocument document = PdfDocument(inputBytes: templateBytes);
    
    // Check if it's a Fillable PDF (AcroForm)
    if (document.form.fields.count > 0) {
      final PdfForm form = document.form;
      
      // Helper function to safely fill text fields
      void setField(String name, String value) {
        for (int i = 0; i < form.fields.count; i++) {
          final PdfField field = form.fields[i];
          if (field.name == name && field is PdfTextBoxField) {
            field.text = value;
          }
        }
      }

      setField('applicant_name', data.applicantName.toUpperCase());
      setField('profession', data.profession);
      setField('mobile_number', data.mobileNumber);
      setField('email_id', data.emailId);
      setField('address', data.address);
      setField('date_of_birth', data.dateOfBirth);
      setField('marital_status', data.maritalStatus);
      setField('nationality', data.nationality);
      setField('religion', data.religion);
      
      for (int i = 0; i < data.experiences.length; i++) {
         setField('experience_${i+1}', '${data.experiences[i].duration} - ${data.experiences[i].experience}');
      }
      for (int i = 0; i < data.educations.length; i++) {
         setField('education_${i+1}', '${data.educations[i].year} | ${data.educations[i].degree} - ${data.educations[i].institution}');
      }
      for (int i = 0; i < data.skills.length; i++) {
         setField('skill_${i+1}', data.skills[i]);
      }
      
      // Flatten fields so the text becomes part of the PDF permanently
      form.flattenAllFields();
    } else {
      // Fallback: If no form fields exist, draw manually using absolute coordinates
      final PdfPage page = document.pages[0];
    
    // Load font
    final PdfFont font = PdfStandardFont(PdfFontFamily.helvetica, 14);
    final PdfFont boldFont = PdfStandardFont(PdfFontFamily.helvetica, 16, style: PdfFontStyle.bold);
    final PdfFont smallFont = PdfStandardFont(PdfFontFamily.helvetica, 12);
    
    final PdfGraphics graphics = page.graphics;
    final PdfBrush brush = PdfSolidBrush(PdfColor(0, 0, 0)); // Black text
    
    // Example Coordinates for "Professional Modern CV Resume.pdf"
    // TODO: We need to calibrate these coordinates based on the actual Canva PDF design.
    // For now, these are placeholder coordinates for mapping out the architecture.
    
    // Header
    graphics.drawString(data.applicantName.toUpperCase(), boldFont, brush: brush, bounds: const Rect.fromLTWH(50, 50, 300, 30));
    graphics.drawString(data.profession, font, brush: PdfSolidBrush(PdfColor(100, 100, 100)), bounds: const Rect.fromLTWH(50, 80, 300, 20));
    
    // Contact Info
    graphics.drawString(data.mobileNumber, smallFont, brush: brush, bounds: const Rect.fromLTWH(50, 120, 200, 20));
    graphics.drawString(data.emailId, smallFont, brush: brush, bounds: const Rect.fromLTWH(50, 140, 200, 20));
    graphics.drawString(data.address, smallFont, brush: brush, bounds: const Rect.fromLTWH(50, 160, 200, 20));

    // Bio / Profile
    String profile = 'Date of Birth: ${data.dateOfBirth}\nMarital Status: ${data.maritalStatus}\nNationality: ${data.nationality}\nReligion: ${data.religion}';
    graphics.drawString(profile, smallFont, brush: brush, bounds: const Rect.fromLTWH(50, 200, 250, 100));

    // Experience
    int yOffset = 350;
    graphics.drawString('EXPERIENCE', boldFont, brush: brush, bounds: Rect.fromLTWH(50, yOffset.toDouble(), 300, 20));
    yOffset += 30;
    for (var exp in data.experiences) {
      graphics.drawString('${exp.duration} - ${exp.experience}', smallFont, brush: brush, bounds: Rect.fromLTWH(50, yOffset.toDouble(), 300, 20));
      yOffset += 20;
    }

    // Education
    yOffset += 20;
    graphics.drawString('EDUCATION', boldFont, brush: brush, bounds: Rect.fromLTWH(50, yOffset.toDouble(), 300, 20));
    yOffset += 30;
    for (var edu in data.educations) {
      graphics.drawString('${edu.year} | ${edu.degree} - ${edu.institution}', smallFont, brush: brush, bounds: Rect.fromLTWH(50, yOffset.toDouble(), 300, 20));
      yOffset += 20;
    }
    
    // Skills
    yOffset += 20;
    graphics.drawString('SKILLS', boldFont, brush: brush, bounds: Rect.fromLTWH(50, yOffset.toDouble(), 300, 20));
      yOffset += 30;
      for (var skill in data.skills) {
        graphics.drawString('• $skill', smallFont, brush: brush, bounds: Rect.fromLTWH(50, yOffset.toDouble(), 300, 20));
        yOffset += 20;
      }
    }

    final List<int> savedBytes = await document.save();
    document.dispose();
    
    return Uint8List.fromList(savedBytes);
  }
}
