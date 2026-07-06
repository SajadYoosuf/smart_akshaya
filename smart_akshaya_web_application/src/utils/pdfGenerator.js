import { PDFDocument, rgb } from 'pdf-lib';

export async function generateInvoicePdf(entryData) {
  try {
    // 1. Fetch the template PDF from the public directory
    const res = await fetch(import.meta.env.BASE_URL + 'invoice_template.pdf');
    if (!res.ok) throw new Error(`Could not load invoice_template.pdf (Status: ${res.status})`);
    
    const arrayBuffer = await res.arrayBuffer();
    const templateBytes = new Uint8Array(arrayBuffer);
    
    // 2. Load the PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // 3. Define text drawing helper
    // Note: PDF coordinates start from the bottom-left corner!
    const drawText = (text, x, y, size = 11) => {
      if (text === null || text === undefined) return;
      firstPage.drawText(String(text), {
        x,
        y, // Y is measured from the bottom of the page upwards
        size,
        color: rgb(0, 0, 0),
      });
    };

    // 4. Fill in data (Placeholder coordinates)
    // ========================================================
    // TODO: These coordinates MUST be adjusted to align with the actual template.
    // A4 dimensions are roughly 595 x 842 points.
    
    const dateStr = new Date().toLocaleDateString('en-IN');
    
    // Top section
    drawText(dateStr, 450, 750); // Date 
    drawText(entryData.customerName || '', 120, 720); // Customer Name
    drawText(entryData.mobileNumber || '', 120, 700); // Mobile Number
    drawText(entryData.staffName || '', 120, 680); // Staff Name
    
    // Services List table (Assuming it starts around Y=600 and goes down)
    let currentY = 600;
    if (entryData.billItems && entryData.billItems.length > 0) {
      entryData.billItems.forEach((item, index) => {
        drawText(String(index + 1), 50, currentY); // S.No
        drawText(item.serviceName, 100, currentY); // Service Name
        drawText(String(item.walletCharge), 300, currentY); // Wallet Charge / Dept Fee
        drawText(String(item.serviceCharge), 380, currentY); // Service Charge
        drawText(String(item.quantity), 460, currentY); // Quantity
        drawText(String(item.total), 520, currentY); // Total
        currentY -= 20; // Move downwards (decrease Y)
      });
    }

    // Totals section (Assuming it's near the bottom)
    const grandTotal = entryData.billItems ? entryData.billItems.reduce((sum, item) => sum + (item.total || 0), 0) : 0;
    drawText(String(grandTotal), 520, 300, 12); // Grand Total
    
    // ========================================================

    // 5. Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    // 6. Create a Blob and return URL
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
