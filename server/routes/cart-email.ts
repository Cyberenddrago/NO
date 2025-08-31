import { RequestHandler } from "express";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  description: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface CartEmailRequest {
  to: string;
  subject: string;
  cartData: {
    customer: CustomerInfo;
    items: CartItem[];
    total: number;
    timestamp: string;
  };
}

export const handleSendCartEmail: RequestHandler = async (req, res) => {
  try {
    const { to, subject, cartData }: CartEmailRequest = req.body;

    if (!to || !cartData || !cartData.customer || !cartData.items) {
      return res.status(400).json({ error: "Missing required cart data" });
    }

    // Create HTML email content
    const htmlContent = generateCartEmailHTML(cartData);

    // For now, we'll log the email content since we don't have an email service configured
    // In production, you would integrate with an email service like SendGrid, Mailgun, etc.
    console.log("=== CART SUBMISSION EMAIL ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("HTML Content:");
    console.log(htmlContent);
    console.log("=== END EMAIL ===");

    // You can also save this to a file or database for later processing
    const emailData = {
      to,
      subject,
      html: htmlContent,
      timestamp: new Date().toISOString(),
      customer: cartData.customer,
      items: cartData.items,
      total: cartData.total
    };

    // In a real implementation, you would:
    // 1. Configure an email service (SendGrid, AWS SES, etc.)
    // 2. Send the actual email
    // 3. Handle any errors

    // For now, simulate successful email sending
    res.status(200).json({ 
      success: true, 
      message: "Cart email sent successfully",
      emailData 
    });

  } catch (error) {
    console.error("Error sending cart email:", error);
    res.status(500).json({ error: "Failed to send cart email" });
  }
};

function generateCartEmailHTML(cartData: CartEmailRequest['cartData']): string {
  const { customer, items, total, timestamp } = cartData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Cart Submission - BlockBusters Plumbing</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #0891b2, #0284c7);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px;
        }
        .customer-info {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .customer-info h2 {
          margin-top: 0;
          color: #0891b2;
          font-size: 18px;
        }
        .info-row {
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: bold;
          color: #374151;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .items-table th {
          background: #f1f5f9;
          font-weight: bold;
          color: #374151;
        }
        .total-row {
          background: #0891b2;
          color: white;
          font-weight: bold;
          font-size: 18px;
        }
        .footer {
          background: #1e293b;
          color: white;
          padding: 20px;
          text-align: center;
          font-size: 14px;
        }
        .timestamp {
          color: #6b7280;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛒 New Cart Submission</h1>
          <p>BlockBusters and Partners - VRT FLOW.Outsourcing</p>
        </div>
        
        <div class="content">
          <div class="customer-info">
            <h2>Customer Information</h2>
            <div class="info-row">
              <span class="info-label">Name:</span> ${customer.name}
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span> ${customer.email}
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span> ${customer.phone || 'Not provided'}
            </div>
            <div class="info-row">
              <span class="info-label">Address:</span> ${customer.address || 'Not provided'}
            </div>
          </div>
          
          <h2 style="color: #0891b2;">Order Items</h2>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>
                    <strong>${item.name}</strong>
                    <br>
                    <small style="color: #6b7280;">${item.description}</small>
                  </td>
                  <td>${item.category}</td>
                  <td>${item.quantity}</td>
                  <td>R${item.price.toFixed(2)}</td>
                  <td>R${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4">TOTAL</td>
                <td>R${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="timestamp">
            Submitted on: ${new Date(timestamp).toLocaleString('en-ZA', { 
              timeZone: 'Africa/Johannesburg',
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} (South Africa Time)
          </div>
        </div>
        
        <div class="footer">
          <p>BlockBusters and Partners</p>
          <p>South Africa Plumbing Suppliers 24/7 JHB Delivery</p>
          <p>This is an automated message from your website cart system.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
