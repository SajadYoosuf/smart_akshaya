import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:excel/excel.dart';
import 'package:intl/intl.dart';
import '../models/saved_bill.dart';
import 'dart:io';

class ExportUtils {
  static Future<void> generatePdfReport(List<SavedBill> reports, String title) async {
    final pdf = pw.Document();

    final headers = [
      '#', 'Date', 'Customer', 'Contact', 'Services', 'Wallet charge', 'Charge', 'Total', 'Entry staff'
    ];

    final data = reports.asMap().entries.map((entry) {
      int idx = entry.key + 1;
      SavedBill report = entry.value;
      return [
        idx.toString(),
        report.date,
        report.customerName,
        report.mobile,
        report.services,
        'Rs ${report.gpayUpi.toStringAsFixed(2)}',
        'Rs ${report.cash.toStringAsFixed(2)}',
        'Rs ${report.totalAmount.toStringAsFixed(2)}',
        report.staffName,
      ];
    }).toList();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4.landscape,
        build: (context) {
          return [
            pw.Header(level: 0, child: pw.Text(title, style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold))),
            pw.SizedBox(height: 20),
            pw.TableHelper.fromTextArray(
              headers: headers,
              data: data,
              border: pw.TableBorder.all(color: PdfColors.grey300),
              headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.white),
              headerDecoration: const pw.BoxDecoration(color: PdfColors.blue900),
              cellHeight: 30,
              cellAlignments: {
                0: pw.Alignment.center,
                1: pw.Alignment.centerLeft,
                2: pw.Alignment.centerLeft,
                3: pw.Alignment.centerLeft,
                4: pw.Alignment.centerLeft,
                5: pw.Alignment.centerRight,
                6: pw.Alignment.centerRight,
                7: pw.Alignment.centerRight,
                8: pw.Alignment.centerLeft,
              },
            ),
          ];
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Service_Report_${DateFormat('yyyyMMdd').format(DateTime.now())}.pdf',
    );
  }

  static Future<void> generateExcelReport(List<SavedBill> reports, String title) async {
    var excel = Excel.createExcel();
    Sheet sheetObject = excel['Reports'];
    excel.setDefaultSheet('Reports');

    // Headers
    List<String> headers = [
      '#', 'Date', 'Customer Name', 'Contact', 'Services', 'Wallet charge', 'Charge', 'Total', 'Entry staff'
    ];
    
    sheetObject.appendRow(headers.map((h) => TextCellValue(h)).toList());

    // Data
    for (int i = 0; i < reports.length; i++) {
      SavedBill report = reports[i];
      sheetObject.appendRow([
        TextCellValue('${i + 1}'),
        TextCellValue(report.date),
        TextCellValue(report.customerName),
        TextCellValue(report.mobile),
        TextCellValue(report.services),
        DoubleCellValue(report.gpayUpi),
        DoubleCellValue(report.cash),
        DoubleCellValue(report.totalAmount),
        TextCellValue(report.staffName),
      ]);
    }

    // Save
    var fileBytes = excel.save();
    if (fileBytes != null) {
      // Create a temporary file and save
      final directory = Directory.systemTemp;
      final file = File('${directory.path}/Service_Report_${DateFormat('yyyyMMdd_HHmmss').format(DateTime.now())}.xlsx');
      
      file
        ..createSync(recursive: true)
        ..writeAsBytesSync(fileBytes);
        
      // Try to open the file via Printing share (which might work on desktop)
      // Since `printing` is a dependency we can use `Printing.sharePdf` but it works best for PDFs.
      // Instead, for windows, we might use url_launcher or just show the path.
      // For now, let's print the path
      print("Saved Excel at ${file.path}");
      
      // On Windows/Desktop we can just run the file to open it if excel is installed
      try {
        if (Platform.isWindows) {
          Process.run('explorer', [file.path]);
        } else if (Platform.isMacOS) {
          Process.run('open', [file.path]);
        }
      } catch (e) {
        print("Could not automatically open excel file");
      }
    }
  }
}
