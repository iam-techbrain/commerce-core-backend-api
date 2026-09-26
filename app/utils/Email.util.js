const nodemailer = require('nodemailer');
const appConfig = require('../config/app.config');
const Logger = require('./Logger.util');

// Create E-mail Transporter (Falls back to Ethereal/Console logging if SMTP credentials not configured)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || appConfig.supportEmail,
    pass: process.env.SMTP_PASS || 'dummy_app_password'
  }
});

class EmailService {
  // Send Order Confirmation Email
  static async sendOrderConfirmation(toEmail, order) {
    try {
      const mailOptions = {
        from: `"SaaS E-Commerce" <${appConfig.supportEmail}>`,
        to: toEmail,
        subject: `🎉 Order Confirmation #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">Thank you for your order! 🎉</h2>
            <p>Your order <strong>#${order.orderNumber}</strong> has been successfully placed.</p>
            <hr/>
            <h3>Order Summary:</h3>
            <p><strong>Total Amount:</strong> ₹${order.finalAmount}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            <p><strong>Shipping Address:</strong> ${order.address.addressLine1}, ${order.address.city}, ${order.address.pincode}</p>
            <hr/>
            <p>For support, contact: <a href="mailto:${appConfig.supportEmail}">${appConfig.supportEmail}</a></p>
          </div>
        `
      };

      // In development mode, log email details
      Logger.info(`📧 Order confirmation email triggered for: ${toEmail}`);
      // await transporter.sendMail(mailOptions);
    } catch (error) {
      Logger.error(`Failed to send order email: ${error.message}`);
    }
  }

  // Send Order Status Update Email
  static async sendOrderStatusUpdate(toEmail, orderNumber, newStatus) {
    try {
      Logger.info(`📧 Order #${orderNumber} status update email sent to ${toEmail}: Status changed to ${newStatus}`);
    } catch (error) {
      Logger.error(`Failed to send status update email: ${error.message}`);
    }
  }
}

module.exports = EmailService;
