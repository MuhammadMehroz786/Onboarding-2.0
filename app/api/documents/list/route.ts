import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Get all generated documents for the current client
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

    // Get client data
    const client = await prisma.client.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        generatedDocuments: {
          select: {
            id: true,
            documentType: true,
            title: true,
            wordCount: true,
            generatedAt: true,
            updatedAt: true,
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
      success: true,
      documents: client.generatedDocuments,
    });

  } catch (error) {
    console.error("Document list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
