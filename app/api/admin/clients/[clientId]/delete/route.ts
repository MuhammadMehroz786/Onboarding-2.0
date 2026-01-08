import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Delete a client and all associated data
 * Admin only - permanent deletion
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await auth();
    const { clientId } = await context.params;

    // Check if user is admin
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Get client data for logging
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Store info for response
    const deletedInfo = {
      clientId: client.id,
      uniqueClientId: client.uniqueClientId,
      companyName: client.companyName,
      email: client.user.email,
      userId: client.userId,
    };

    // Delete client and cascade to related data
    // Prisma cascade will handle: links, activity logs, webhook logs, brand assets, documents, chat messages
    await prisma.client.delete({
      where: { id: clientId },
    });

    // Delete the user account
    await prisma.user.delete({
      where: { id: client.userId },
    });

    console.log(`✅ Client deleted by admin: ${client.companyName} (${client.uniqueClientId})`);
    console.log(`   Deleted by: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Client and all associated data deleted successfully",
      deleted: deletedInfo,
    });
  } catch (error: any) {
    console.error("Delete client error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete client" },
      { status: 500 }
    );
  }
}
