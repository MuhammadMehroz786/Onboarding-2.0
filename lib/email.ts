import axios from 'axios';

const EMAIL_WEBHOOK_URL = 'https://n8n.eventplanners.cloud/webhook-test/d99e44c8-7d47-4f51-8a30-a12263446eac';

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

    return sendEmail({
        email,
        subject: `Welcome to Our Platform, ${companyName}! 🚀`,
        mailBody: `
Hi ${name},

Welcome aboard! We're thrilled to have ${companyName} as part of our platform.

Your onboarding is complete, and we're already working on your personalized strategy suite. You'll receive access to:

✅ Custom marketing strategies
✅ AI-powered business insights  
✅ Your dedicated workspace
✅ 9 specialized AI agents trained on your business

Access your dashboard here:
${process.env.NEXTAUTH_URL || 'https://onboarding-20-production.up.railway.app'}/dashboard

If you have any questions, our GrowthBot is available 24/7 in your dashboard.

Best regards,
Your Success Team
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
    return sendEmail({
        email,
        subject: `Your ${documentCount} Strategy Documents are Ready! 📄`,
        mailBody: `
Hi there,

Great news! We've generated ${documentCount} personalized strategy documents for ${companyName}.

View them now in your dashboard:
${process.env.NEXTAUTH_URL || 'https://onboarding-20-production.up.railway.app'}/dashboard

These include:
• Go-To-Market Strategy
• Messaging & Positioning
• Content Strategy
• Funnel Optimization
• And ${documentCount - 4} more...

Each document is customized based on your business goals, target audience, and industry.

Ready to get started?
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

    return sendEmail({
        email: adminEmail,
        subject: `New Client Onboarded: ${companyName}`,
        mailBody: `
A new client has completed onboarding:

Company: ${companyName}
Email: ${clientEmail}
Client ID: ${uniqueClientId}

View in admin dashboard:
${process.env.NEXTAUTH_URL || 'https://onboarding-20-production.up.railway.app'}/admin

Next steps:
1. Review their intake responses
2. Trigger strategy document generation
3. Set up their workspace
    `.trim(),
    });
}
