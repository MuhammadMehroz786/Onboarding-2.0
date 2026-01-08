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
 * Ad Creative Generator Agent
 * Creates platform-specific ad content
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
            platform,
            adType,
            objective,
            productService,
            offer,
            numberOfVariations,
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

        const adCreative = await generateAdCreative({
            clientContext,
            platform,
            adType,
            objective,
            productService,
            offer,
            numberOfVariations: numberOfVariations || 3,
            additionalContext,
        });

        return NextResponse.json({
            success: true,
            adCreative,
        });

    } catch (error) {
        console.error("Ad creative generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate ad creative" },
            { status: 500 }
        );
    }
}

function buildClientContext(client: any): string {
    return `
BRAND:
- Company: ${client.companyName}
- Industry: ${client.industry}
- Description: ${client.companyDescription || 'Not specified'}
- Website: ${client.websiteUrl || 'Not specified'}

VALUE PROPOSITION:
- Primary Goal: ${client.primaryGoal || 'Not specified'}
- Key Differentiators: ${client.competitorStrengths || 'Not specified'}

TARGET AUDIENCE:
- ICP: ${client.idealCustomerProfile || 'Not specified'}
- Demographics: ${client.ageRange || 'Not specified'}, ${client.genderTargeting || 'All'}
- Geographic: ${client.geographicTargeting || 'Not specified'}

COMPETITIVE CONTEXT:
- Competitors: ${client.competitors || 'Not specified'}

MARKETING CONTEXT:
- Budget: ${client.monthlyBudgetRange || 'Not specified'}
- Current Channels: ${parseJSON(client.currentChannels)}
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

async function generateAdCreative(params: {
    clientContext: string;
    platform?: string;
    adType?: string;
    objective?: string;
    productService?: string;
    offer?: string;
    numberOfVariations: number;
    additionalContext?: string;
}): Promise<string> {
    const platformSpecs: Record<string, string> = {
        'facebook': `
**Facebook Ad Specs:**
- Primary Text: 125 characters (expanded shows more)
- Headline: 40 characters
- Description: 30 characters
- Image: 1080x1080 (1:1) or 1200x628 (1.91:1)
- Video: Up to 240 minutes`,
        'instagram': `
**Instagram Ad Specs:**
- Caption: 2,200 characters (first 125 visible)
- Hashtags: Up to 30 (5-10 recommended)
- Image: 1080x1080 (feed) or 1080x1920 (stories)
- Video: Up to 60 seconds (feed) or 15 seconds (stories)`,
        'linkedin': `
**LinkedIn Ad Specs:**
- Intro Text: 150 characters (600 max)
- Headline: 70 characters
- Description: 100 characters
- Image: 1200x627
- Sponsored InMail: 500 characters intro`,
        'google-search': `
**Google Search Ad Specs:**
- Headlines: 3 (30 characters each)
- Descriptions: 2 (90 characters each)
- Display URL: 15 characters per path
- Responsive: Up to 15 headlines, 4 descriptions`,
        'google-display': `
**Google Display Ad Specs:**
- Headlines: 5 (30 characters each)
- Long Headline: 90 characters
- Descriptions: 5 (90 characters each)
- Business Name: 25 characters
- Images: Multiple sizes (1200x628, 1200x1200)`,
        'tiktok': `
**TikTok Ad Specs:**
- Ad Text: 100 characters
- Video: 9:16 (1080x1920), 5-60 seconds
- Thumbnail text: Minimal
- CTA: Platform options`,
    };

    const systemPrompt = `You are an expert performance marketer creating high-converting ad creative.

CLIENT CONTEXT:
${params.clientContext}

PLATFORM: ${params.platform || 'Multi-platform'}
${platformSpecs[params.platform || ''] || 'Follow general best practices for character limits and formats.'}

Create ${params.numberOfVariations} ad variations with this structure:

# Ad Creative Package: ${params.platform || 'Multi-Platform'}
**Objective**: ${params.objective || 'Conversions'}
**Product/Service**: ${params.productService || 'From client context'}

---

## 🎯 Ad Strategy
- Hook approach for this audience
- Emotional triggers to leverage
- Key differentiators to highlight
- Offer positioning

---

## 📝 Ad Variations

### Variation 1: [Angle Name - e.g., "Pain Point Focus"]
**Angle**: [What approach this variation takes]

${params.platform === 'google-search' ? `
**Headlines (30 chars each)**:
1. [Headline 1]
2. [Headline 2]
3. [Headline 3]
4. [Headline 4 - optional]
5. [Headline 5 - optional]

**Descriptions (90 chars each)**:
1. [Description 1]
2. [Description 2]

**Display Path**: /[path1]/[path2]
` : `
**Primary Text/Copy**:
\`\`\`
[Full ad copy - respect platform limits]
\`\`\`

**Headline**: [Headline within platform limits]

**Description/Link Description**: [If applicable]

**CTA**: [Call-to-action button text]
`}

**Visual Direction**: [What the image/video should show]

**Why This Works**: [Brief rationale]

---

### Variation 2: [Angle Name]
[Same structure as above]

---

### Variation 3: [Angle Name]
[Same structure as above]

---

## 🧪 Testing Recommendations
### A/B Test Priority
1. [What to test first and why]
2. [Second test priority]

### Audience Testing
- [Audience segment suggestions]

### Creative Testing
- [Visual elements to test]

---

## 📊 Performance Predictions
| Variation | Expected CTR | Best For |
|-----------|--------------|----------|
| Variation 1 | [Range] | [Use case] |
| Variation 2 | [Range] | [Use case] |
| Variation 3 | [Range] | [Use case] |

---

## ⚠️ Compliance Notes
- [Any platform policy considerations]
- [Claims to be careful about]
- [Required disclosures if any]

Make ads compelling, platform-optimized, and ready to use.`;

    const userPrompt = `Create ${params.numberOfVariations} ad variations for ${params.platform || 'Facebook'}.

Ad Type: ${params.adType || 'Image ad'}
Objective: ${params.objective || 'Conversions'}
Product/Service: ${params.productService || 'Use from client context'}
Special Offer: ${params.offer || 'None specified'}
Additional Context: ${params.additionalContext || 'None'}

Make ads high-converting and platform-optimized.`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 3500,
    });

    return completion.choices[0]?.message?.content || "Failed to generate ad creative.";
}
