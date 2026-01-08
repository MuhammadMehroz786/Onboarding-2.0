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
 * Buyer Persona Generator Agent
 * Creates detailed buyer personas based on client context
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
            numberOfPersonas,
            focusSegment,
            includeNegativePersona,
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

        const personas = await generatePersonas({
            clientContext,
            numberOfPersonas: numberOfPersonas || 3,
            focusSegment,
            includeNegativePersona: includeNegativePersona === true,
            additionalContext,
        });

        return NextResponse.json({
            success: true,
            personas,
        });

    } catch (error) {
        console.error("Persona generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate personas" },
            { status: 500 }
        );
    }
}

function buildClientContext(client: any): string {
    return `
COMPANY:
- Name: ${client.companyName}
- Industry: ${client.industry}
- Business Model: ${client.businessModel || 'Not specified'}
- Description: ${client.companyDescription || 'Not specified'}

CURRENT ICP DEFINITION:
${client.idealCustomerProfile || 'Not specified'}

TARGET DEMOGRAPHICS:
- Age Range: ${client.ageRange || 'Not specified'}
- Gender: ${client.genderTargeting || 'All'}
- Geographic: ${client.geographicTargeting || 'Not specified'}

PRODUCT/SERVICE VALUE:
- Primary Goal: ${client.primaryGoal || 'Not specified'}
- Success Definition: ${client.successDefinition || 'Not specified'}

COMPETITIVE LANDSCAPE:
- Competitors: ${client.competitors || 'Not specified'}

CURRENT MARKETING:
- Channels: ${parseJSON(client.currentChannels)}
- Challenges: ${parseJSON(client.primaryChallenges)}
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

async function generatePersonas(params: {
    clientContext: string;
    numberOfPersonas: number;
    focusSegment?: string;
    includeNegativePersona: boolean;
    additionalContext?: string;
}): Promise<string> {
    const systemPrompt = `You are a customer research expert creating detailed, actionable buyer personas.

CLIENT CONTEXT:
${params.clientContext}

Create ${params.numberOfPersonas} detailed buyer personas${params.includeNegativePersona ? ' plus 1 negative persona (who NOT to target)' : ''}.

For EACH persona, use this structure:

# Buyer Persona: [Persona Name]
*"[A quote that captures this persona's mindset]"*

## 📊 Demographics
| Attribute | Details |
|-----------|---------|
| **Name** | [Fictional but realistic name] |
| **Age** | [Specific age or range] |
| **Job Title** | [Current role] |
| **Company Size** | [Employee count] |
| **Industry** | [Their industry] |
| **Location** | [Geographic] |
| **Income/Budget** | [If relevant] |
| **Education** | [Level and field] |

## 🧠 Psychographics
### Personality Traits
- [Trait 1]
- [Trait 2]
- [Trait 3]

### Values & Priorities
1. [Top priority]
2. [Second priority]
3. [Third priority]

### Communication Style
- Preferred channels: [...]
- Content preferences: [...]
- Best times to reach: [...]

## 😤 Pain Points & Challenges
### Primary Frustrations
1. **[Pain Point 1]**: [Detailed description]
2. **[Pain Point 2]**: [Detailed description]
3. **[Pain Point 3]**: [Detailed description]

### What Keeps Them Up at Night
[Deep emotional/professional concerns]

## 🎯 Goals & Motivations
### Professional Goals
1. [Goal with context]
2. [Goal with context]

### Personal Goals
1. [Goal with context]

### Success Metrics
- How they measure their own success

## 🛒 Buying Behavior
### Decision-Making Process
- Research habits
- Influence sources
- Timeline expectations
- Budget authority

### Objections & Barriers
1. [Common objection]: [How to overcome]
2. [Common objection]: [How to overcome]

### Trigger Events
- What prompts them to look for a solution

## 💬 Marketing Approach
### Key Messages That Resonate
1. [Message framework]
2. [Message framework]

### Content They Consume
- Blogs/publications: [...]
- Social platforms: [...]
- Events/communities: [...]

### Best Channels to Reach Them
1. [Channel]: [Why it works]
2. [Channel]: [Why it works]

## 🗺️ Customer Journey Map
### Awareness Stage
- What they're searching for
- Content that attracts them

### Consideration Stage
- Questions they're asking
- Comparisons they're making

### Decision Stage
- Final concerns
- What closes the deal

---

Make personas specific, memorable, and immediately actionable for marketing campaigns.`;

    const userPrompt = `Create ${params.numberOfPersonas} buyer persona${params.numberOfPersonas > 1 ? 's' : ''}${params.includeNegativePersona ? ' plus a negative persona' : ''}.

Focus Segment: ${params.focusSegment || 'Primary ICP from context'}
Additional Context: ${params.additionalContext || 'None'}

Make them detailed enough to inform real marketing decisions.`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 4000,
    });

    return completion.choices[0]?.message?.content || "Failed to generate personas.";
}
