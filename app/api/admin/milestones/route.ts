import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * Admin API - Manage client milestones
 */

// GET - Fetch milestones for a specific client
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');

        if (!clientId) {
            return NextResponse.json({ error: "clientId is required" }, { status: 400 });
        }

        const milestones = await prisma.milestone.findMany({
            where: { clientId },
            orderBy: { displayOrder: 'asc' },
        });

        return NextResponse.json({ success: true, milestones });
    } catch (error) {
        console.error("Fetch milestones error:", error);
        return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
    }
}

// POST - Create a new milestone
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

        const data = await request.json();
        const { clientId, title, description, dueDate, aiSuggested } = data;

        if (!clientId || !title) {
            return NextResponse.json(
                { error: "clientId and title are required" },
                { status: 400 }
            );
        }

        // Get the highest display order
        const lastMilestone = await prisma.milestone.findFirst({
            where: { clientId },
            orderBy: { displayOrder: 'desc' },
        });

        const milestone = await prisma.milestone.create({
            data: {
                clientId,
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                aiSuggested: aiSuggested || false,
                displayOrder: (lastMilestone?.displayOrder || 0) + 1,
            },
        });

        return NextResponse.json({ success: true, milestone });
    } catch (error) {
        console.error("Create milestone error:", error);
        return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
    }
}

// PATCH - Update a milestone
export async function PATCH(request: NextRequest) {
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

        const data = await request.json();
        const { id, title, description, dueDate, completed } = data;

        if (!id) {
            return NextResponse.json({ error: "Milestone ID is required" }, { status: 400 });
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (completed !== undefined) {
            updateData.completed = completed;
            updateData.completedAt = completed ? new Date() : null;
        }

        const milestone = await prisma.milestone.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, milestone });
    } catch (error) {
        console.error("Update milestone error:", error);
        return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
    }
}

// DELETE - Delete a milestone
export async function DELETE(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Milestone ID is required" }, { status: 400 });
        }

        await prisma.milestone.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete milestone error:", error);
        return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
    }
}
