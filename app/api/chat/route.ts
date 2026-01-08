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
 * Support Chatbot API
 * Provides personalized business growth advice based on client's onboarding data
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
        const { message } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Get client data
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

        // Get recent chat history for context (last 10 messages)
        const recentMessages = await prisma.chatMessage.findMany({
            where: { clientId: client.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Reverse to get chronological order
        const chatHistory = recentMessages.reverse();

        // Save user message
        await prisma.chatMessage.create({
            data: {
                clientId: client.id,
                role: 'user',
                content: message,
            },
        });

        // Build comprehensive client context
        const clientContext = buildClientContext(client);

        // Build chat history for OpenAI
        const historyMessages = chatHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
        }));

        // Generate AI response
        const aiResponse = await generateChatResponse({
            clientContext,
            historyMessages,
            newMessage: message,
        });

        // Save assistant response
        await prisma.chatMessage.create({
            data: {
                clientId: client.id,
                role: 'assistant',
                content: aiResponse,
            },
        });

        return NextResponse.json({
            success: true,
            response: aiResponse,
        });

    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            { error: "Failed to process message" },
            { status: 500 }
        );
    }
}

/**
 * GET - Retrieve chat history for the client
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

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

        const messages = await prisma.chatMessage.findMany({
            where: { clientId: client.id },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json({
            success: true,
            messages,
        });

    } catch (error) {
        console.error("Chat history error:", error);
        return NextResponse.json(
            { error: "Failed to fetch chat history" },
            { status: 500 }
        );
    }
}

function buildClientContext(client: any): string {
    return `
=== CLIENT BUSINESS PROFILE ===

COMPANY INFORMATION:
- Company Name: ${client.companyName}
- Industry: ${client.industry}
- Website: ${client.websiteUrl || 'Not provided'}
- Description: ${client.companyDescription || 'Not provided'}
- Employee Count: ${client.employeeCount || 'Not specified'}
- Business Model: ${client.businessModel || 'Not specified'}

CURRENT MARKETING STATE:
- Previously Worked with Agency: ${client.workedWithAgency ? 'Yes' : 'No'}
- Current Marketing Channels: ${parseJSON(client.currentChannels)}
- Marketing Feedback: ${client.marketingFeedback || 'Not provided'}
- Primary Challenges: ${parseJSON(client.primaryChallenges)}

ANALYTICS & TRACKING:
- Google Analytics: ${client.hasGoogleAnalytics || 'Not specified'}
- Facebook Pixel: ${client.hasFacebookPixel || 'Not specified'}
- Tracking Tools: ${parseJSON(client.trackingTools)}
- Analytics Access: ${client.canProvideAnalyticsAccess || 'Not specified'}
- Analytics Notes: ${client.analyticsNotes || 'Not provided'}

SOCIAL MEDIA & PLATFORMS:
- Social Platforms: ${parseJSON(client.socialPlatforms)}
- Facebook Business Manager: ${client.hasFbBusinessManager || 'Not specified'}
- Google Ads: ${client.hasGoogleAds || 'Not specified'}

BUSINESS GOALS & OBJECTIVES:
- Primary Goal: ${client.primaryGoal}
- Success Definition: ${client.successDefinition || 'Not specified'}
- Key Metrics: ${parseJSON(client.keyMetrics)}
- Revenue Target: ${client.revenueTarget || 'Not specified'}
- Target CPA: ${client.targetCpa || 'Not specified'}
- Target ROAS: ${client.targetRoas || 'Not specified'}

TARGET AUDIENCE:
- Ideal Customer Profile: ${client.idealCustomerProfile}
- Geographic Targeting: ${client.geographicTargeting || 'Not specified'}
- Age Range: ${client.ageRange || 'Not specified'}
- Gender Targeting: ${client.genderTargeting || 'Not specified'}

COMPETITORS:
- Main Competitors: ${client.competitors || 'Not specified'}
- Competitor Strengths: ${client.competitorStrengths || 'Not specified'}

BUDGET & RESOURCES:
- Monthly Budget Range: ${client.monthlyBudgetRange}
- Has Creative Assets: ${client.hasCreativeAssets ? 'Yes' : 'No'}
- Has Marketing Contact: ${client.hasMarketingContact ? 'Yes' : 'No'}
- Marketing Contact: ${client.marketingContactName || 'Not specified'} (${client.marketingContactEmail || 'No email'})

CLIENT STATUS:
- Onboarding Completed: ${client.onboardingCompleted ? 'Yes' : 'No'}
- Status: ${client.status}
- Member Since: ${client.createdAt}
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

async function generateChatResponse(params: {
    clientContext: string;
    historyMessages: { role: 'user' | 'assistant'; content: string }[];
    newMessage: string;
}): Promise<string> {
    const companyName = params.clientContext.split('\n')[4]?.replace('- Company Name:', '').trim() || 'your company';

    const systemPrompt = `You are "GrowthBot", a friendly, conversational marketing advisor for ${companyName}.

CONTEXT ABOUT THIS BUSINESS:
${params.clientContext}

YOUR PERSONALITY:
- You're like a smart friend who happens to know a lot about growing businesses
- Keep responses SHORT and conversational (2-4 sentences usually, max 1-2 short paragraphs)
- Use simple, everyday language - avoid marketing jargon and technical terms
- Remember what was discussed earlier in the conversation and reference it naturally
- Ask follow-up questions to keep the conversation going
- Use their company name naturally in conversation

LANGUAGE RULES - VERY IMPORTANT:
- NO technical marketing terms like: CTR, CPA, ROAS, conversion rate, funnel, retargeting, pixel, impressions, CPM, etc.
- Instead say things like: "how many people click", "cost to get a customer", "return on your spending", "getting people to buy", "showing ads to people who visited before", etc.
- Explain everything like you're talking to a friend who runs a business but isn't a marketing expert
- If they use technical terms, you can respond but always explain in simple words

CONVERSATION STYLE:
✓ "Great question! For ${companyName}, I'd suggest..."
✓ "Since you mentioned earlier that..."
✓ "That makes sense! Here's a quick thought..."
✗ Don't write long essays or bullet-point lists unless they specifically ask
✗ Don't repeat their business details back to them - you already know them

REMEMBER:
- This is a CHAT, not a report. Be concise!
- Keep it simple - like texting a helpful friend
- Reference past messages in this conversation naturally
- If they ask something vague, ask a quick clarifying question
- End with a question or invitation to continue when appropriate`;

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        ...params.historyMessages,
        { role: 'user', content: params.newMessage },
    ];

    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages,
        temperature: 0.8,
        max_tokens: 400,
    });

    return completion.choices[0]?.message?.content || "Sorry, I had a moment there! Could you ask that again?";
}
