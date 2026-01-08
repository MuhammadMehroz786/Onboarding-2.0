import axios from 'axios';

const EMAIL_WEBHOOK_URL = 'https://n8n.eventplanners.cloud/webhook/d99e44c8-7d47-4f51-8a30-a12263446eac';

export interface EmailPayload {
  email: string;
  subject: string;
  mailBody: string;
}

/**
 * Send email via N8N webhook
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const response = await axios.post(EMAIL_WEBHOOK_URL, {
      email: payload.email,
      subject: payload.subject,
      mailBody: payload.mailBody,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    if (response.status >= 200 && response.status < 300) {
      console.log('Email sent successfully to:', payload.email);
      return true;
    }

    console.error('Email webhook returned non-2xx status:', response.status);
    return false;
  } catch (error) {
    console.error('Failed to send email via N8N webhook:', error);
    return false;
  }
}

/**
 * Send welcome email to new client
 */
export async function sendWelcomeEmail(
  email: string,
  companyName: string,
  clientName?: string
): Promise<boolean> {
  const name = clientName || companyName;
  const dashboardUrl = process.env.NEXTAUTH_URL || 'https://onboarding-20-production.up.railway.app';
  const appName = process.env.APP_NAME || 'AgencyFlow';

  return sendEmail({
    email,
    subject: `Welcome to ${appName}, ${companyName}! 🚀`,
    mailBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25); }
    .features { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }
    .features li { margin: 10px 0; color: #475569; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to ${appName}!</h1>
    </div>
    <div class="content">
      <h2 style="color: #1e293b;">Hi ${name},</h2>
      <p>Welcome aboard! We're thrilled to have <strong>${companyName}</strong> join ${appName}.</p>
      
      <p>Your onboarding is complete, and we're already working on your personalized strategy suite. You'll receive access to:</p>
      
      <div class="features">
        <ul style="margin: 0; padding-left: 20px;">
          <li>✅ Custom marketing strategies tailored to your business</li>
          <li>✅ AI-powered business insights and recommendations</li>
          <li>✅ Your dedicated workspace with all resources</li>
          <li>✅ 9 specialized AI agents trained on your business data</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="${dashboardUrl}/dashboard" class="button">Access Your Dashboard</a>
      </p>
      
      <p>If you have any questions, our <strong>GrowthBot</strong> is available 24/7 in your dashboard to help you grow your business.</p>
      
      <p>Best regards,<br><strong>Your Success Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}

/**
 * Send strategy documents ready email
 */
export async function sendStrategyReadyEmail(
  email: string,
  companyName: string,
  documentCount: number
): Promise<boolean> {
  const dashboardUrl = process.env.NEXTAUTH_URL || 'https://onboarding-20-production.up.railway.app';
  const appName = process.env.APP_NAME || 'AgencyFlow';

  return sendEmail({
    email,
    subject: `Your ${documentCount} Strategy Documents are Ready! 📄`,
    mailBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.25); }
    .documents { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
    .documents li { margin: 8px 0; color: #065f46; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
    .badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Your Strategies are Ready!</h1>
    </div>
    <div class="content">
      <h2>Great news!</h2>
      <p>We've generated <span class="badge">${documentCount} documents</span> personalized for <strong>${companyName}</strong>.</p>
      
      <div class="documents">
        <p style="margin-top: 0; font-weight: 600; color: #065f46;">Your Strategy Suite Includes:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>📊 Go-To-Market Strategy</li>
          <li>💬 Messaging & Positioning</li>
          <li>📝 Content Strategy</li>
          <li>🎯 Funnel Optimization</li>
          <li>And ${documentCount - 4} more...</li>
        </ul>
      </div>
      
      <p>Each document is customized based on your business goals, target audience, and industry insights.</p>
      
      <p style="text-align: center;">
        <a href="${dashboardUrl}/dashboard" class="button">View Your Strategies</a>
      </p>
      
      <p>Ready to accelerate your growth? 🚀</p>
      
      <p>Best regards,<br><strong>Your Success Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}

/**
 * Send admin notification for new client
 */
export async function sendAdminNotification(
  companyName: string,
  clientEmail: string,
  uniqueClientId: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@agency.com';
  const dashboardUrl = process.env.NEXTAUTH_URL || 'https://onboarding-20-production.up.railway.app';
  const appName = process.env.APP_NAME || 'AgencyFlow';

  return sendEmail({
    email: adminEmail,
    subject: `New Client Onboarded: ${companyName}`,
    mailBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .info-box { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #fde68a; }
    .info-label { font-weight: 600; width: 120px; color: #92400e; }
    .info-value { color: #78350f; }
    .checklist { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .checklist li { margin: 8px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Client Alert!</h1>
    </div>
    <div class="content">
      <h2>A new client has completed onboarding</h2>
      
      <div class="info-box">
        <div class="info-row">
          <div class="info-label">Company:</div>
          <div class="info-value"><strong>${companyName}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value">${clientEmail}</div>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <div class="info-label">Client ID:</div>
          <div class="info-value"><code>${uniqueClientId}</code></div>
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="${dashboardUrl}/admin" class="button">View in Admin Dashboard</a>
      </p>
      
      <div class="checklist">
        <p style="margin-top: 0; font-weight: 600;">Next Steps:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>✅ Review their intake responses</li>
          <li>✅ Trigger strategy document generation</li>
          <li>✅ Set up their workspace</li>
          <li>✅ Schedule kickoff call</li>
        </ul>
      </div>
      
      <p>Time to deliver an amazing experience! 🚀</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${appName} - Admin Notifications</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });
}
