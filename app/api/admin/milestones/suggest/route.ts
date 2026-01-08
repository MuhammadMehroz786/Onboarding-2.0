import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI-powered milestone suggestions for a client
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const { clientId } = await request.json();

        if (!clientId) {
            return NextResponse.json({ error: "clientId is required" }, { status: 400 });
        }

        // Fetch client data
        const client = await prisma.client.findUnique({
            where: { id: clientId },
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // Generate AI suggestions
        const prompt = `Based on this client's profile, suggest 5-7 meaningful onboarding milestones that track their progress from signup to full activation.

Client Details:
- Company: ${client.companyName}
- Industry: ${client.industry || 'Not specified'}
- Business Model: ${client.businessModel || 'Not specified'}
- Primary Goal: ${client.primaryGoal || 'Not specified'}
- Monthly Budget: ${client.monthlyBudgetRange || 'Not specified'}

Create milestones that are:
1. Specific and actionable
2. In logical order (first to last)
3. Mix of admin tasks and client tasks
4. Relevant to their industry and goals

Return ONLY a JSON array of objects with this structure:
[
  {
    "title": "Complete Brand Asset Upload",
    "description": "Upload logo, brand colors, and style guide",
    "estimatedDays": 3
  }
]

Keep titles short (max 50 chars) and descriptions clear (max 150 chars).`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an onboarding specialist who creates milestone-based progress tracking for marketing agency clients. Return only valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 800,
        });

        const response = completion.choices[0]?.message?.content;

        if (!response) {
            throw new Error("No response from AI");
        }

        // Parse the JSON response
        const suggestions = JSON.parse(response.trim());

        // Add estimated due dates
        const now = new Date();
        const milestonesWithDates = suggestions.map((milestone: any, index: number) => {
            const daysOffset = suggestions.slice(0, index + 1).reduce((sum: number, m: any) => sum + (m.estimatedDays || 7), 0);
            const dueDate = new Date(now);
            dueDate.setDate(now.getDate() + daysOffset);

            return {
                ...milestone,
                dueDate: dueDate.toISOString(),
            };
        });

        return NextResponse.json({
            success: true,
            suggestions: milestonesWithDates
        });

    } catch (error) {
        console.error("AI milestone suggestion error:", error);
        return NextResponse.json(
            { error: "Failed to generate milestone suggestions" },
            { status: 500 }
        );
    }
}
