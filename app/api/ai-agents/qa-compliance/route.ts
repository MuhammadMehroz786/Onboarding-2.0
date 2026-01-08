import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * QA & Compliance Checker Agent
 * Reviews content/campaigns for quality, compliance, and brand alignment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      contentToReview,
      reviewType,
      platform,
      industry,
      additionalCriteria
    } = body;

    if (!contentToReview) {
      return NextResponse.json(
        { error: "Content to review is required" },
        { status: 400 }
      );
    }

    // Get client context
    const client = await prisma.client.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    // Build client context
    const clientContext = buildClientContext(client);

    // Perform QA review
    const review = await performQAReview({
      clientContext,
      contentToReview,
      reviewType,
      platform,
      industry: industry || client.industry,
      additionalCriteria,
    });

    return NextResponse.json({
      success: true,
      review,
    });

  } catch (error) {
    console.error("QA review error:", error);
    return NextResponse.json(
      { error: "Failed to perform QA review" },
      { status: 500 }
    );
  }
}

function buildClientContext(client: any): string {
  return `
BRAND STANDARDS:
- Company: ${client.companyName}
- Industry: ${client.industry}
- Target Audience: ${client.idealCustomerProfile || 'Not specified'}

BRAND VOICE & MESSAGING:
- Primary Goal: ${client.primaryGoal || 'Not specified'}
- Value Proposition: ${client.successDefinition || 'Not specified'}
- Key Differentiators: ${client.competitorStrengths || 'Not specified'}

COMPLIANCE CONTEXT:
- Industry: ${client.industry}
- Geographic Markets: ${client.geographicTargeting || 'Not specified'}
- Current Channels: ${parseJSON(client.currentChannels)}
`.trim();
}

function parseJSON(value: any): string {
  if (!value) return 'Not specified';
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
      return value;
    } catch {
      return value;
    }
  }
  return String(value);
}

async function performQAReview(params: {
  clientContext: string;
  contentToReview: string;
  reviewType?: string;
  platform?: string;
  industry: string;
  additionalCriteria?: string;
}): Promise<any> {
  const systemPrompt = `You are an expert QA specialist and compliance reviewer with expertise in marketing, advertising regulations, and brand standards.

CLIENT CONTEXT:
${params.clientContext}

REVIEW CRITERIA:
Perform a comprehensive review covering:

1. BRAND ALIGNMENT
- Tone and voice consistency
- Message alignment with brand values
- Target audience appropriateness
- Value proposition clarity

2. COMPLIANCE & LEGAL
- Industry-specific regulations (${params.industry})
- Platform policies (${params.platform || 'general'})
- FTC guidelines (disclosures, claims)
- Data privacy (GDPR/CCPA if applicable)
- Trademark/copyright concerns

3. QUALITY STANDARDS
- Grammar and spelling
- Clarity and readability
- Call-to-action effectiveness
- Mobile optimization (if applicable)
- Accessibility

4. PLATFORM-SPECIFIC
- Character limits and formatting
- Image/video requirements
- Link functionality
- Hashtag strategy
- Ad policy compliance

5. RISK ASSESSMENT
- Potential misinterpretation
- Competitive claims
- Unsubstantiated statements
- Sensitive content

Provide a detailed review with:
- Overall Score (1-10)
- Pass/Fail status
- Critical Issues (must fix)
- Recommendations (should fix)
- Suggestions (nice to have)
- Specific edits with before/after examples`;

  const userPrompt = `Review this content:

CONTENT TYPE: ${params.reviewType || 'General content'}
PLATFORM: ${params.platform || 'Multi-channel'}
ADDITIONAL CRITERIA: ${params.additionalCriteria || 'Standard review'}

CONTENT TO REVIEW:
${params.contentToReview}

Provide a comprehensive QA review in JSON format with the structure:
{
  "overallScore": number,
  "status": "pass" | "conditional_pass" | "fail",
  "summary": "Brief overview",
  "criticalIssues": [],
  "recommendations": [],
  "suggestions": [],
  "compliance": {
    "legal": "pass/warning/fail",
    "platform": "pass/warning/fail",
    "brand": "pass/warning/fail"
  },
  "edits": [
    {
      "type": "critical|recommended|suggestion",
      "issue": "What's wrong",
      "before": "Original text",
      "after": "Suggested fix",
      "rationale": "Why this change"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.3, // Lower temperature for more consistent QA
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });

  const reviewContent = completion.choices[0]?.message?.content || "{}";

  try {
    return JSON.parse(reviewContent);
  } catch (error) {
    return {
      overallScore: 0,
      status: "error",
      summary: "Failed to parse QA review",
      error: reviewContent,
    };
  }
}
