export async function sendPasswordResetEmail(
  toEmail: string, 
  userName: string, 
  username: string, 
  resetToken: string
): Promise<void> {
  try {
    // Import the existing email handler
    const { handleSendEmail } = await import("../routes/email");
    
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
    
    const emailData = {
      toEmail,
      subject: `Password Reset Request - BlockBusters Private Client App`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Password Reset Request</h2>
          
          <p>Hello,</p>
          
          <p>A password reset request has been made for the following user:</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Name:</strong> ${userName}<br>
            <strong>Username:</strong> ${username}
          </div>
          
          <p>To reset the password, click the link below:</p>
          
          <a href="${resetLink}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          
          <p style="color: #6b7280; font-size: 14px;">
            This link will expire in 10 minutes for security reasons.
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you did not request this password reset, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px;">
            BlockBusters Private Client App<br>
            Automated System Email
          </p>
        </div>
      `
    };

    // Create a mock request/response for the email handler
    const req = {
      body: emailData
    } as any;

    const res = {
      json: (data: any) => {
        if (data.success) {
          console.log(`✅ Password reset email sent to ${toEmail}`);
        } else {
          throw new Error(data.error || 'Email sending failed');
        }
      },
      status: (code: number) => ({
        json: (data: any) => {
          throw new Error(data.error || `Email sending failed with status ${code}`);
        }
      })
    } as any;

    await handleSendEmail(req, res);
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}
