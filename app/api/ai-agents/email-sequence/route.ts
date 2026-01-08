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
 * Email Sequence Builder Agent
 * Creates complete email marketing sequences
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
            sequenceType,
            numberOfEmails,
            goal,
            tone,
            includeSubjectVariations,
            additionalContext
        } = body;

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

        const sequence = await generateEmailSequence({
            clientContext,
            sequenceType,
            numberOfEmails: numberOfEmails || 5,
            goal,
            tone,
            includeSubjectVariations: includeSubjectVariations !== false,
            additionalContext,
        });

        return NextResponse.json({
            success: true,
            sequence,
        });

    } catch (error) {
        console.error("Email sequence error:", error);
        return NextResponse.json(
            { error: "Failed to generate email sequence" },
            { status: 500 }
        );
    }
}

function buildClientContext(client: any): string {
    return `
BRAND IDENTITY:
- Company: ${client.companyName}
- Industry: ${client.industry}
- Description: ${client.companyDescription || 'Not specified'}

VALUE PROPOSITION:
- Primary Goal: ${client.primaryGoal || 'Not specified'}
- Success Definition: ${client.successDefinition || 'Not specified'}

TARGET AUDIENCE:
- ICP: ${client.idealCustomerProfile || 'Not specified'}
- Demographics: ${client.ageRange || 'Not specified'}, ${client.genderTargeting || 'All'}
- Geographic: ${client.geographicTargeting || 'Not specified'}

COMPETITIVE CONTEXT:
- Competitors: ${client.competitors || 'Not specified'}
- Key Differentiators: ${client.competitorStrengths || 'Not specified'}

MARKETING CHALLENGES:
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

async function generateEmailSequence(params: {
    clientContext: string;
    sequenceType?: string;
    numberOfEmails: number;
    goal?: string;
    tone?: string;
    includeSubjectVariations: boolean;
    additionalContext?: string;
}): Promise<string> {
    const systemPrompt = `You are an expert email marketing strategist creating high-converting email sequences.

CLIENT CONTEXT:
${params.clientContext}

Create a complete email sequence with the following structure:

# Email Sequence: [Sequence Name]

## Sequence Overview
- **Type**: ${params.sequenceType || 'Nurture Sequence'}
- **Goal**: ${params.goal || 'Convert leads to customers'}
- **Number of Emails**: ${params.numberOfEmails}
- **Tone**: ${params.tone || 'Professional yet approachable'}
- **Recommended Timing**: Include delay between emails

---

## Email Sequence Flow
[Visual flow: Email 1 → (delay) → Email 2 → ...]

---

For EACH email, provide:

### Email [#]: [Email Name]
**Send Timing**: [When to send relative to trigger/previous email]

**Subject Lines** (3 variations for A/B testing):
1. [Primary subject line]
2. [Alternative subject line]
3. [Alternative subject line]

**Preview Text**: [30-50 characters]

**Email Body**:
\`\`\`
[Complete email copy with proper formatting]
\`\`\`

**CTA Button**: [Button text] → [Link destination]

**Key Purpose**: [Why this email exists in the sequence]

**Success Metrics**: [What to measure]

---

## Sequence Performance Framework
- Expected open rates by email
- Click-through benchmarks
- Conversion expectations
- When to optimize

## A/B Testing Recommendations
- What to test in each email
- Priority tests to run

Format in professional markdown. Make emails ready to copy and use.`;

    const userPrompt = `Create a ${params.numberOfEmails}-email ${params.sequenceType || 'nurture'} sequence.

Goal: ${params.goal || 'Nurture leads through the funnel'}
Tone: ${params.tone || 'Professional, helpful, not pushy'}
Include Subject Variations: ${params.includeSubjectVariations ? 'Yes, 3 per email' : 'No, just primary'}
Additional Context: ${params.additionalContext || 'None'}

Make emails compelling, personalized to the ICP, and conversion-focused.`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 4000,
    });

    return completion.choices[0]?.message?.content || "Failed to generate email sequence.";
}
