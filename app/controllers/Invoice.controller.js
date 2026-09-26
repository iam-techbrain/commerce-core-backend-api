const PDFDocument = require('pdfkit');
const { prisma } = require('../database/Prisma.database');
const appConfig = require('../config/app.config');

class InvoiceController {
  // Generate & Stream Downloadable PDF Invoice for Order
  static async downloadInvoice(req, res, next) {
    try {
      const orderId = parseInt(req.params.orderId);
      const userId = parseInt(req.user.id);

      const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { user: true, address: true, items: { include: { product: true } } }
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order invoice nahi mila!' });
      }

      // Create PDF Document
      const doc = new PDFDocument({ margin: 50 });

      // Set Response Headers for PDF Download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderNumber}.pdf`);

      doc.pipe(res);

      // PDF Header
      doc.fontSize(20).fillColor('#4F46E5').text('SaaS E-Commerce Store', { align: 'left' });
      doc.fontSize(10).fillColor('#666').text(`Support Email: ${appConfig.supportEmail}`, { align: 'left' });
      doc.moveDown();

      doc.fontSize(16).fillColor('#000').text('INVOICE / RECEIPT', { align: 'right' });
      doc.fontSize(10).fillColor('#666').text(`Order #: ${order.orderNumber}`, { align: 'right' });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      // Shipping Details
      doc.fontSize(12).fillColor('#000').text('Billed To:');
      doc.fontSize(10).fillColor('#333').text(`${order.address.fullName}`);
      doc.text(`${order.address.addressLine1}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`);
      doc.text(`Phone: ${order.address.phone}`);
      doc.moveDown();

      // Items Table Header
      doc.fontSize(12).fillColor('#4F46E5').text('Order Items:', { underline: true });
      doc.moveDown(0.5);

      order.items.forEach((item, index) => {
        doc.fontSize(10).fillColor('#333').text(`${index + 1}. ${item.product.name} x ${item.quantity}  ---  ₹${item.totalPrice}`);
      });

      doc.moveDown();
      doc.fontSize(10).fillColor('#000').text(`Subtotal: ₹${order.totalAmount}`);
      doc.text(`Discount: -₹${order.discountAmount}`);
      doc.text(`Shipping: ₹${order.shippingFee}`);
      doc.text(`GST Tax (18%): ₹${Math.round(order.taxAmount * 100) / 100}`);
      doc.fontSize(12).fillColor('#4F46E5').text(`Total Paid: ₹${order.finalAmount}`, { bold: true });

      doc.end();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InvoiceController;
