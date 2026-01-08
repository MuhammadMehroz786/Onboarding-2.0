import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Get current client's data and links
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

    // Find the client associated with this user
    const client = await prisma.client.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        links: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      client: {
        id: client.id,
        uniqueClientId: client.uniqueClientId,
        companyName: client.companyName,
        industry: client.industry,
        websiteUrl: client.websiteUrl,
        status: client.status,
        onboardingCompleted: client.onboardingCompleted,
        onboardingCompletedAt: client.onboardingCompletedAt,
        email: client.user.email,
        createdAt: client.createdAt,
      },
      links: client.links,
    });
  } catch (error) {
    console.error("Client data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client data" },
      { status: 500 }
    );
  }
}
