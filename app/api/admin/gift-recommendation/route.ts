import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI-powered gift recommendation for new clients
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const { clientId } = await request.json();

        if (!clientId) {
            return NextResponse.json({ error: "clientId is required" }, { status: 400 });
        }

        // Fetch client data
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                user: true,
            },
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // Generate AI gift recommendation
        const prompt = `You are a corporate gifting expert. Recommend a thoughtful, professional welcome gift for this new client.

Client Profile:
- Company: ${client.companyName}
- Industry: ${client.industry || 'Not specified'}
- Business Model: ${client.businessModel || 'Not specified'}
- Employee Count: ${client.employeeCount || 'Unknown'}
- Monthly Budget: ${client.monthlyBudgetRange || 'Not specified'}
- Primary Goal: ${client.primaryGoal || 'Not specified'}

Guidelines:
1. Gift should be premium but appropriate for business relationship
2. Consider their industry and company culture
3. Budget: $50-150 range
4. Should feel personal, not generic
5. Easy to ship/deliver

Return ONLY a JSON object with this structure:
{
  "giftName": "Branded Premium Notebook Set",
  "description": "Luxury leather-bound notebooks with their company colors",
  "reasoning": "Perfect for a professional services company that values thoughtful details",
  "estimatedCost": "$75",
  "vendor": "Moleskine or Leuchtturm1917",
  "fulfillmentNotes": "Can be ordered online with 2-day shipping. Consider embossing with company logo."
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert in corporate gifting who creates memorable first impressions. Return only valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 400,
        });

        const response = completion.choices[0]?.message?.content;

        if (!response) {
            throw new Error("No response from AI");
        }

        const recommendation = JSON.parse(response.trim());

        // Send email notification to admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@agency.com';
        const appName = process.env.APP_NAME || 'AgencyFlow';

        await sendEmail({
            email: adminEmail,
            subject: `🎁 Welcome Gift Recommendation for ${client.companyName}`,
            mailBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
    .gift-card { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-label { font-weight: 600; color: #475569; margin-bottom: 4px; }
    .detail-value { color: #1e293b; }
    .client-info { background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Gift Recommendation</h1>
    </div>
    <div class="content">
      <h2 style="color: #1e293b; margin-top: 0;">Welcome Gift for ${client.companyName}</h2>
      
      <div class="gift-card">
        <h3 style="margin-top: 0; color: #92400e;">✨ ${recommendation.giftName}</h3>
        <p style="color: #78350f; margin-bottom: 16px;">${recommendation.description}</p>
        
        <div style="display: grid; gap: 8px; font-size: 14px;">
          <div>
            <strong>Why this gift?</strong><br>
            ${recommendation.reasoning}
          </div>
          <div style="margin-top: 8px;">
            <strong>Estimated Cost:</strong> ${recommendation.estimatedCost}<br>
            <strong>Vendor:</strong> ${recommendation.vendor}
          </div>
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-label">📋 Fulfillment Notes</div>
        <div class="detail-value">${recommendation.fulfillmentNotes}</div>
      </div>

      <div class="client-info">
        <h4 style="margin-top: 0; color: #1e293b;">Client Details</h4>
        <div style="display: grid; gap: 8px; font-size: 14px;">
          <div><strong>Company:</strong> ${client.companyName}</div>
          <div><strong>Industry:</strong> ${client.industry || 'Not specified'}</div>
          <div><strong>Email:</strong> ${client.user.email}</div>
          <div><strong>Budget Range:</strong> ${client.monthlyBudgetRange || 'Not specified'}</div>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 16px; border-radius: 8px; border-left: 4px solid #0284c7; margin-top: 20px;">
        <p style="margin: 0; color: #075985; font-size: 14px;">
          💡 <strong>Next Step:</strong> Review this recommendation and proceed with ordering. The gift should arrive before the kickoff call for maximum impact.
        </p>
      </div>

      <p style="margin-top: 24px;">This recommendation was AI-generated based on the client's profile and industry best practices.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${appName} - Gift Recommendations</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
        });

        return NextResponse.json({
            success: true,
            recommendation,
            emailSent: true,
        });

    } catch (error) {
        console.error("Gift recommendation error:", error);
        return NextResponse.json(
            { error: "Failed to generate gift recommendation" },
            { status: 500 }
        );
    }
}
