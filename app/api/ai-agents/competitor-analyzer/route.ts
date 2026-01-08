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
 * Competitor Analysis Agent
 * Analyzes competitor landscape and provides strategic insights
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
      competitors,
      analysisType,
      focusAreas,
      additionalContext
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

    const clientContext = buildClientContext(client);
    
    const analysis = await generateCompetitorAnalysis({
      clientContext,
      competitors: competitors || client.competitors,
      analysisType,
      focusAreas,
      additionalContext,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error) {
    console.error("Competitor analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate competitor analysis" },
      { status: 500 }
    );
  }
}

function buildClientContext(client: any): string {
  return `
YOUR COMPANY:
- Company: ${client.companyName}
- Industry: ${client.industry}
- Business Model: ${client.businessModel || 'Not specified'}
- Value Proposition: ${client.companyDescription || 'Not specified'}

TARGET MARKET:
- ICP: ${client.idealCustomerProfile || 'Not specified'}
- Geographic: ${client.geographicTargeting || 'Not specified'}

CURRENT POSITIONING:
- Primary Goal: ${client.primaryGoal || 'Not specified'}
- Success Definition: ${client.successDefinition || 'Not specified'}
- Key Differentiators: ${client.competitorStrengths || 'Not specified'}

KNOWN COMPETITORS:
${client.competitors || 'Not specified'}

MARKETING CONTEXT:
- Monthly Budget: ${client.monthlyBudgetRange || 'Not specified'}
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

async function generateCompetitorAnalysis(params: {
  clientContext: string;
  competitors?: string;
  analysisType?: string;
  focusAreas?: string[];
  additionalContext?: string;
}): Promise<string> {
  const systemPrompt = `You are a strategic competitive intelligence analyst. Your role is to provide actionable insights about the competitive landscape.

CLIENT CONTEXT:
${params.clientContext}

Provide a comprehensive competitor analysis with the following structure:

# Competitive Analysis Report

## 1. Executive Summary
- Key findings at a glance
- Most critical competitive threats
- Biggest opportunities identified

## 2. Competitor Profiles
For each competitor:
- Company overview and positioning
- Target market overlap
- Estimated market share/size
- Key products/services
- Pricing strategy (if known)
- Marketing channels and tactics

## 3. SWOT Analysis
### Your Strengths (vs. competitors)
### Your Weaknesses (vs. competitors)
### Market Opportunities
### Competitive Threats

## 4. Competitive Positioning Map
- Where you stand vs. competitors
- Key differentiators
- Positioning gaps and opportunities

## 5. Channel Analysis
- Where competitors are active
- Their content strategy
- Ad messaging and offers
- Social media presence
- SEO/keyword strategy

## 6. Strategic Recommendations
### Immediate Actions (0-30 days)
### Short-term Strategy (1-3 months)
### Long-term Positioning (3-12 months)

## 7. Competitive Messaging
- Key messages that differentiate you
- Competitive objection handling
- Positioning statements

Format in professional markdown. Be specific and actionable.`;

  const userPrompt = `Analyze these competitors: ${params.competitors || 'Use competitors from client context'}

Analysis Type: ${params.analysisType || 'Comprehensive analysis'}
Focus Areas: ${params.focusAreas?.join(', ') || 'All areas'}
Additional Context: ${params.additionalContext || 'None'}

Provide strategic insights and actionable recommendations.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 3500,
  });

  return completion.choices[0]?.message?.content || "Failed to generate analysis.";
}
