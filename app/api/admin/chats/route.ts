import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * Admin API - View all client chat conversations
 * Allows admins to see chat history from all clients
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

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        // Get query params
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');

        if (clientId) {
            // Get messages for specific client
            const client = await prisma.client.findUnique({
                where: { id: clientId },
                select: {
                    id: true,
                    companyName: true,
                    uniqueClientId: true,
                    industry: true,
                },
            });

            if (!client) {
                return NextResponse.json(
                    { error: "Client not found" },
                    { status: 404 }
                );
            }

            const messages = await prisma.chatMessage.findMany({
                where: { clientId },
                orderBy: { createdAt: 'asc' },
            });

            return NextResponse.json({
                success: true,
                client,
                messages,
                totalMessages: messages.length,
            });
        }

        // Get all clients with their chat statistics
        const clientsWithChats = await prisma.client.findMany({
            select: {
                id: true,
                companyName: true,
                uniqueClientId: true,
                industry: true,
                status: true,
                createdAt: true,
                chatMessages: {
                    select: {
                        id: true,
                        createdAt: true,
                        role: true,
                        flagged: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform data to include chat statistics
        const clientChatData = clientsWithChats.map(client => ({
            id: client.id,
            companyName: client.companyName,
            uniqueClientId: client.uniqueClientId,
            industry: client.industry,
            status: client.status,
            createdAt: client.createdAt,
            chatStats: {
                totalMessages: client.chatMessages.length,
                userMessages: client.chatMessages.filter(m => m.role === 'user').length,
                assistantMessages: client.chatMessages.filter(m => m.role === 'assistant').length,
                flaggedMessages: client.chatMessages.filter(m => m.flagged).length,
                lastMessageAt: client.chatMessages[0]?.createdAt || null,
            },
        }));

        // Filter to only clients with chat messages
        const clientsWithMessages = clientChatData.filter(c => c.chatStats.totalMessages > 0);

        return NextResponse.json({
            success: true,
            clients: clientsWithMessages,
            totalClientsWithChats: clientsWithMessages.length,
            totalMessages: clientsWithMessages.reduce((sum, c) => sum + c.chatStats.totalMessages, 0),
        });

    } catch (error) {
        console.error("Admin chat fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch chat data" },
            { status: 500 }
        );
    }
}
