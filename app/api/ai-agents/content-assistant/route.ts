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
 * Content & Messaging Assistant Agent
 * Generates brand-aligned content and messaging based on client context
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
      contentType,
      topic,
      targetAudience,
      tone,
      length,
      cta,
      keywords,
      additionalGuidelines
    } = body;

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

    // Generate content
    const content = await generateContent({
      clientContext,
      contentType,
      topic,
      targetAudience,
      tone,
      length,
      cta,
      keywords,
      additionalGuidelines,
    });

    return NextResponse.json({
      success: true,
      content,
    });

  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

function buildClientContext(client: any): string {
  return `
BRAND IDENTITY:
- Company: ${client.companyName}
- Industry: ${client.industry}
- Business Model: ${client.businessModel || 'Not specified'}
- Company Description: ${client.companyDescription || 'Not specified'}

VALUE PROPOSITION:
- Primary Goal: ${client.primaryGoal || 'Not specified'}
- Success Definition: ${client.successDefinition || 'Not specified'}

TARGET AUDIENCE:
- ICP: ${client.idealCustomerProfile || 'Not specified'}
- Geographic: ${client.geographicTargeting || 'Not specified'}
- Demographics: ${client.ageRange || 'Not specified'}, ${client.genderTargeting || 'All'}

COMPETITIVE LANDSCAPE:
- Competitors: ${client.competitors || 'Not specified'}
- Competitor Strengths: ${client.competitorStrengths || 'Not specified'}

MARKETING CONTEXT:
- Current Channels: ${parseJSON(client.currentChannels)}
- Primary Challenges: ${parseJSON(client.primaryChallenges)}
- Marketing Feedback: ${client.marketingFeedback || 'Not specified'}
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

async function generateContent(params: {
  clientContext: string;
  contentType?: string;
  topic?: string;
  targetAudience?: string;
  tone?: string;
  length?: string;
  cta?: string;
  keywords?: string;
  additionalGuidelines?: string;
}): Promise<string> {
  const systemPrompt = `You are an expert content strategist and copywriter creating brand-aligned content.

CLIENT CONTEXT:
${params.clientContext}

You must create content that:
1. Aligns with the client's brand voice and value proposition
2. Speaks directly to their target audience
3. Differentiates from competitors
4. Addresses their market challenges
5. Supports their business goals

Content Type: ${params.contentType || 'General content'}
Target Audience: ${params.targetAudience || 'Use client\'s ICP'}
Tone: ${params.tone || 'Professional yet approachable'}
Length: ${params.length || 'Appropriate for content type'}
CTA: ${params.cta || 'Relevant to client goals'}
Keywords: ${params.keywords || 'Industry-relevant'}

Generate high-quality, brand-aligned content that delivers value and drives action.`;

  const userPrompt = `Create ${params.contentType || 'content'} about:

Topic: ${params.topic || 'Recommend based on client goals and challenges'}
Additional Guidelines: ${params.additionalGuidelines || 'None'}

Provide multiple variations where appropriate (e.g., 3-5 headline options, 2-3 copy variations).`;

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
    temperature: 0.8,
    max_tokens: 2500,
  });

  return completion.choices[0]?.message?.content || "Failed to generate content.";
}
