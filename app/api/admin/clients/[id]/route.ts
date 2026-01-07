import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get single client details (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow admins
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const clientId = params.id;

    // Get client with all details
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
            lastLogin: true,
          },
        },
        links: {
          orderBy: { createdAt: "desc" },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Return all client data (for admin view)
    return NextResponse.json({
      client: {
        id: client.id,
        uniqueClientId: client.uniqueClientId,
        email: client.user.email,
        createdAt: client.user.createdAt,
        lastLogin: client.user.lastLogin,

        // All onboarding responses
        businessInfo: {
          companyName: client.companyName,
          industry: client.industry,
          websiteUrl: client.websiteUrl,
          companyDescription: client.companyDescription,
          employeeCount: client.employeeCount,
          businessModel: client.businessModel,
        },
        marketingState: {
          workedWithAgency: client.workedWithAgency,
          currentChannels: client.currentChannels,
          marketingFeedback: client.marketingFeedback,
          primaryChallenges: client.primaryChallenges,
        },
        analytics: {
          hasGoogleAnalytics: client.hasGoogleAnalytics,
          hasFacebookPixel: client.hasFacebookPixel,
          trackingTools: client.trackingTools,
          canProvideAnalyticsAccess: client.canProvideAnalyticsAccess,
          analyticsNotes: client.analyticsNotes,
        },
        socialMedia: {
          socialPlatforms: client.socialPlatforms,
          hasFbBusinessManager: client.hasFbBusinessManager,
          hasGoogleAds: client.hasGoogleAds,
        },
        goals: {
          primaryGoal: client.primaryGoal,
          successDefinition: client.successDefinition,
          keyMetrics: client.keyMetrics,
          revenueTarget: client.revenueTarget,
          targetCpa: client.targetCpa,
          targetRoas: client.targetRoas,
        },
        audience: {
          idealCustomerProfile: client.idealCustomerProfile,
          geographicTargeting: client.geographicTargeting,
          ageRange: client.ageRange,
          genderTargeting: client.genderTargeting,
          competitors: client.competitors,
          competitorStrengths: client.competitorStrengths,
        },
        budget: {
          monthlyBudgetRange: client.monthlyBudgetRange,
          hasCreativeAssets: client.hasCreativeAssets,
          hasMarketingContact: client.hasMarketingContact,
          marketingContactName: client.marketingContactName,
          marketingContactEmail: client.marketingContactEmail,
        },

        // Metadata
        status: client.status,
        onboardingCompleted: client.onboardingCompleted,
        onboardingCompletedAt: client.onboardingCompletedAt,
      },
      links: client.links,
      activityLogs: client.activityLogs,
    });
  } catch (error) {
    console.error("Admin client detail fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client details" },
      { status: 500 }
    );
  }
}
