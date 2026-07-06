import { readFileSync, writeFileSync } from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';

async function runTest() {
  try {
    const templateBytes = readFileSync('./public/invoice_template.pdf');
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    const drawText = (text, x, y, size = 11) => {
      if (text === null || text === undefined) return;
      firstPage.drawText(String(text), {
        x,
        y, 
        size,
        color: rgb(0, 0, 0),
      });
    };

    drawText('Test Date', 450, 750);
    
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated successfully, length:", pdfBytes.length);
  } catch (e) {
    console.error("Error generating PDF:", e.message);
    console.error(e.stack);
  }
}

runTest();
