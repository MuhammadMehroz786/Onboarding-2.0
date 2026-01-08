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
 * SOP Drafter Agent
 * Generates detailed Standard Operating Procedures based on client context
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
      sopType,
      processName,
      processOwner,
      tools,
      frequency,
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

    // Build client context
    const clientContext = buildClientContext(client);

    // Generate SOP
    const sop = await generateSOP({
      clientContext,
      sopType,
      processName,
      processOwner,
      tools,
      frequency,
      additionalContext,
    });

    return NextResponse.json({
      success: true,
      sop,
    });

  } catch (error) {
    console.error("SOP generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate SOP" },
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
- Team Size: ${client.employeeCount || 'Not specified'}

CURRENT TOOLS & SYSTEMS:
- Analytics: ${client.hasGoogleAnalytics ? 'Google Analytics' : ''} ${client.hasFacebookPixel ? ', Facebook Pixel' : ''}
- Tracking Tools: ${parseJSON(client.trackingTools)}
- Marketing Channels: ${parseJSON(client.currentChannels)}
- Social Platforms: ${parseJSON(client.socialPlatforms)}

BUSINESS GOALS:
- Primary Goal: ${client.primaryGoal || 'Not specified'}
- Key Metrics: ${parseJSON(client.keyMetrics)}

CHALLENGES:
${parseJSON(client.primaryChallenges)}
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

async function generateSOP(params: {
  clientContext: string;
  sopType?: string;
  processName?: string;
  processOwner?: string;
  tools?: string;
  frequency?: string;
  additionalContext?: string;
}): Promise<string> {
  const systemPrompt = `You are an expert operations consultant creating detailed, actionable Standard Operating Procedures (SOPs).

CLIENT CONTEXT:
${params.clientContext}

Generate a comprehensive SOP with the following structure:

# Standard Operating Procedure

## 1. SOP Overview
- SOP Title
- SOP ID/Version
- Process Owner
- Date Created/Last Updated
- Purpose and Scope

## 2. Process Summary
- High-level description
- When this process applies
- Who is responsible
- Expected outcomes

## 3. Prerequisites
- Required access/permissions
- Required tools and systems
- Required knowledge/training
- Resources needed

## 4. Step-by-Step Procedure
Detailed, numbered steps with:
- Clear action items
- Screenshots/examples where helpful (describe them)
- Decision points and branching logic
- Common pitfalls to avoid
- Quality checkpoints

## 5. Tools & Systems
- Specific tools used (integrate with client's tech stack)
- Login/access requirements
- Tool-specific instructions
- Integration points

## 6. Quality Assurance
- QA checklist
- Success criteria
- Common errors and fixes
- Review process

## 7. Troubleshooting
- Common issues and solutions
- Error messages and fixes
- Escalation procedures
- Support contacts

## 8. Metrics & Reporting
- KPIs to track
- Reporting requirements
- Frequency of review
- Optimization opportunities

## 9. Version History & Updates
- Version control process
- Review schedule
- Who can approve changes

## 10. Appendices
- Templates
- Checklists
- Reference materials
- Related SOPs

Make it specific, detailed, and immediately usable. Use client's actual tools and systems where applicable.`;

  const userPrompt = `Create an SOP with these details:

SOP Type: ${params.sopType || 'General operational SOP'}
Process Name: ${params.processName || 'Not specified - recommend based on common needs'}
Process Owner: ${params.processOwner || 'To be assigned'}
Tools Used: ${params.tools || 'Use client\'s existing tools'}
Frequency: ${params.frequency || 'As needed'}
Additional Context: ${params.additionalContext || 'None'}

Generate a complete, ready-to-use SOP that the team can follow immediately.`;

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
    max_tokens: 3500,
  });

  return completion.choices[0]?.message?.content || "Failed to generate SOP.";
}
