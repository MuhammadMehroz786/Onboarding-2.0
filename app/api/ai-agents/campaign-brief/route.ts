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
 * Campaign Brief Generator Agent
 * Generates detailed campaign briefs based on client context and user input
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
      campaignType,
      campaignGoal,
      targetAudience,
      budget,
      timeline,
      additionalNotes
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

    // Generate campaign brief
    const brief = await generateCampaignBrief({
      clientContext,
      campaignType,
      campaignGoal,
      targetAudience,
      budget,
      timeline,
      additionalNotes,
    });

    return NextResponse.json({
      success: true,
      brief,
    });

  } catch (error) {
    console.error("Campaign brief generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate campaign brief" },
      { status: 500 }
    );
  }
}

function buildClientContext(client: any): string {
  return `
COMPANY PROFILE:
- Company: ${client.companyName}
- Industry: ${client.industry}
- Business Model: ${client.businessModel || 'Not specified'}
- Employee Count: ${client.employeeCount || 'Not specified'}

TARGET MARKET:
- ICP: ${client.idealCustomerProfile || 'Not specified'}
- Geographic: ${client.geographicTargeting || 'Not specified'}
- Demographics: ${client.ageRange || 'Not specified'}, ${client.genderTargeting || 'All'}

BUSINESS GOALS:
- Primary Goal: ${client.primaryGoal || 'Not specified'}
- Success Definition: ${client.successDefinition || 'Not specified'}
- Revenue Target: ${client.revenueTarget || 'Not specified'}
- Target CPA: ${client.targetCpa || 'Not specified'}
- Target ROAS: ${client.targetRoas || 'Not specified'}

MARKETING STATE:
- Current Channels: ${parseJSON(client.currentChannels)}
- Primary Challenges: ${parseJSON(client.primaryChallenges)}
- Monthly Budget: ${client.monthlyBudgetRange || 'Not specified'}

COMPETITORS:
${client.competitors || 'Not specified'}

ANALYTICS SETUP:
- Google Analytics: ${client.hasGoogleAnalytics || 'Not specified'}
- Facebook Pixel: ${client.hasFacebookPixel || 'Not specified'}
- Tracking Tools: ${parseJSON(client.trackingTools)}
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

async function generateCampaignBrief(params: {
  clientContext: string;
  campaignType?: string;
  campaignGoal?: string;
  targetAudience?: string;
  budget?: string;
  timeline?: string;
  additionalNotes?: string;
}): Promise<string> {
  const systemPrompt = `You are an expert marketing strategist creating detailed campaign briefs.

CLIENT CONTEXT:
${params.clientContext}

Generate a comprehensive, actionable campaign brief with the following structure:

# Campaign Brief

## 1. Campaign Overview
- Campaign name (creative and relevant)
- Campaign type and objective
- Timeline and key dates
- Budget allocation

## 2. Target Audience
- Primary audience (based on client's ICP)
- Secondary audiences (if applicable)
- Audience pain points and motivations
- Audience insights specific to this campaign

## 3. Campaign Strategy
- Core message and value proposition
- Key differentiators vs. competitors
- Tone and voice
- Creative direction

## 4. Channel Mix & Tactics
- Primary channels (with rationale based on client's current channels and budget)
- Channel-specific tactics
- Content requirements by channel
- Budget allocation per channel

## 5. Creative Requirements
- Ad copy examples (3-5 variations)
- Visual direction and design requirements
- Video/multimedia needs (if applicable)
- Landing page structure

## 6. Success Metrics & KPIs
- Primary KPIs aligned with campaign goal
- Secondary metrics
- Measurement plan using client's analytics tools
- Target benchmarks

## 7. Timeline & Milestones
- Week-by-week breakdown
- Key deliverables and owners
- Review and approval gates
- Launch and optimization schedule

## 8. Risk Mitigation
- Potential challenges
- Backup plans
- Budget contingencies

Format in professional markdown. Be specific, actionable, and tailored to the client's industry, goals, and constraints.`;

  const userPrompt = `Create a campaign brief with these details:

Campaign Type: ${params.campaignType || 'Not specified - recommend based on client goals'}
Campaign Goal: ${params.campaignGoal || 'Align with client\'s primary goal'}
Target Audience: ${params.targetAudience || 'Use client\'s ICP'}
Budget: ${params.budget || 'Use client\'s monthly budget range'}
Timeline: ${params.timeline || 'Recommend appropriate timeline'}
Additional Notes: ${params.additionalNotes || 'None'}

Generate a complete, ready-to-use campaign brief.`;

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
    temperature: 0.7,
    max_tokens: 3000,
  });

  return completion.choices[0]?.message?.content || "Failed to generate campaign brief.";
}
