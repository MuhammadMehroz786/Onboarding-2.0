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
 * Reporting & Insights Agent
 * Generates executive summaries and reporting templates
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
            reportType,
            timePeriod,
            metricsData,
            includeRecommendations,
            audience,
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

        const report = await generateReport({
            clientContext,
            reportType,
            timePeriod,
            metricsData,
            includeRecommendations: includeRecommendations !== false,
            audience,
            additionalContext,
        });

        return NextResponse.json({
            success: true,
            report,
        });

    } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate report" },
            { status: 500 }
        );
    }
}

function buildClientContext(client: any): string {
    return `
CLIENT:
- Company: ${client.companyName}
- Industry: ${client.industry}

GOALS & KPIs:
- Primary Goal: ${client.primaryGoal || 'Not specified'}
- Success Definition: ${client.successDefinition || 'Not specified'}
- Key Metrics: ${parseJSON(client.keyMetrics)}
- Revenue Target: ${client.revenueTarget || 'Not specified'}
- Target CPA: ${client.targetCpa || 'Not specified'}
- Target ROAS: ${client.targetRoas || 'Not specified'}

MARKETING CONTEXT:
- Budget: ${client.monthlyBudgetRange || 'Not specified'}
- Channels: ${parseJSON(client.currentChannels)}
- Challenges: ${parseJSON(client.primaryChallenges)}

ANALYTICS SETUP:
- Google Analytics: ${client.hasGoogleAnalytics || 'Not specified'}
- Facebook Pixel: ${client.hasFacebookPixel || 'Not specified'}
- Tools: ${parseJSON(client.trackingTools)}
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

async function generateReport(params: {
    clientContext: string;
    reportType?: string;
    timePeriod?: string;
    metricsData?: string;
    includeRecommendations: boolean;
    audience?: string;
    additionalContext?: string;
}): Promise<string> {
    const systemPrompt = `You are a marketing analytics expert creating executive-level reports and insights.

CLIENT CONTEXT:
${params.clientContext}

Create a ${params.reportType || 'marketing performance'} report with this structure:

# ${params.reportType || 'Marketing Performance'} Report
**Period**: ${params.timePeriod || 'Current Period'}
**Prepared for**: ${params.audience || 'Leadership Team'}
**Date**: [Current Date]

---

## 📊 Executive Summary
### Key Highlights
- 🟢 [Top win/achievement]
- 🟢 [Second highlight]
- 🟡 [Area of opportunity]
- 🔴 [Challenge requiring attention]

### Performance at a Glance
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| [KPI 1] | [Target] | [Actual] | 🟢/🟡/🔴 |
| [KPI 2] | [Target] | [Actual] | 🟢/🟡/🔴 |
| [KPI 3] | [Target] | [Actual] | 🟢/🟡/🔴 |

---

## 📈 Detailed Performance Analysis

### Channel Performance
#### [Channel 1]
- Performance summary
- Key metrics
- Insights and observations

#### [Channel 2]
- Performance summary
- Key metrics
- Insights and observations

### Campaign Highlights
- Top performing campaigns
- Underperforming campaigns
- Learnings and insights

### Audience Insights
- Segment performance
- New audience discoveries
- Engagement patterns

---

## 💡 Key Insights & Learnings

### What Worked Well
1. **[Insight]**: [Explanation and data]
2. **[Insight]**: [Explanation and data]

### What Needs Improvement
1. **[Area]**: [Problem and impact]
2. **[Area]**: [Problem and impact]

### Unexpected Findings
- [Discovery that challenges assumptions]

---

${params.includeRecommendations ? `## 🎯 Recommendations

### Immediate Actions (This Week)
1. **[Action]**: [Rationale and expected impact]
2. **[Action]**: [Rationale and expected impact]

### Short-term Optimizations (This Month)
1. **[Optimization]**: [Details]
2. **[Optimization]**: [Details]

### Strategic Recommendations (Next Quarter)
1. **[Strategy]**: [Business case]
2. **[Strategy]**: [Business case]

### Budget Reallocation Suggestions
- [Channel]: [Increase/Decrease] by [%] because [reason]

---` : ''}

## 📅 Next Steps & Timeline
| Action Item | Owner | Due Date | Priority |
|-------------|-------|----------|----------|
| [Task 1] | [TBD] | [Date] | High/Med/Low |
| [Task 2] | [TBD] | [Date] | High/Med/Low |

---

## 📎 Appendix
### Data Sources
- [List of data sources used]

### Methodology Notes
- [Any important methodology notes]

### Glossary
- [Key terms and definitions if needed]

---

*Report generated for ${params.audience || 'leadership review'}. For questions, contact the marketing team.*

Format in clean, professional markdown. Use data-driven language and be specific with insights.`;

    const userPrompt = `Generate a ${params.reportType || 'marketing performance'} report.

Time Period: ${params.timePeriod || 'Last Month'}
Audience: ${params.audience || 'Leadership/Executives'}
Include Recommendations: ${params.includeRecommendations ? 'Yes' : 'No'}

${params.metricsData ? `Available Metrics Data:\n${params.metricsData}` : 'Use placeholder metrics that align with client goals.'}

Additional Context: ${params.additionalContext || 'None'}

Make the report actionable and executive-friendly.`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 3500,
    });

    return completion.choices[0]?.message?.content || "Failed to generate report.";
}
