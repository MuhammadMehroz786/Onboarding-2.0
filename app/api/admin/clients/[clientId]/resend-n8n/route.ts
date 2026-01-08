import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Re-send client data to N8N webhook
 * Used when documents haven't been generated after onboarding
 */
export async function POST(
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

    // Get client data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: {
          select: {
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

    // Check if N8N webhook URL is configured
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { error: "N8N webhook URL not configured" },
        { status: 500 }
      );
    }

    // Parse JSON fields
    const currentChannels = client.currentChannels
      ? JSON.parse(client.currentChannels)
      : [];
    const primaryChallenges = client.primaryChallenges
      ? JSON.parse(client.primaryChallenges)
      : [];
    const trackingTools = client.trackingTools
      ? JSON.parse(client.trackingTools)
      : [];
    const socialPlatforms = client.socialPlatforms
      ? JSON.parse(client.socialPlatforms)
      : [];
    const keyMetrics = client.keyMetrics ? JSON.parse(client.keyMetrics) : [];
    const competitors = client.competitors ? JSON.parse(client.competitors) : [];

    // Prepare webhook payload (same structure as onboarding submit)
    const webhookPayload = {
      // User info
      userId: client.userId,
      clientId: client.id,
      uniqueClientId: client.uniqueClientId,
      email: client.user.email,

      // Business Fundamentals
      companyName: client.companyName,
      industry: client.industry,
      websiteUrl: client.websiteUrl,
      companyDescription: client.companyDescription,
      employeeCount: client.employeeCount,
      businessModel: client.businessModel,

      // Marketing State
      workedWithAgency: client.workedWithAgency,
      currentChannels,
      marketingFeedback: client.marketingFeedback,
      primaryChallenges,

      // Analytics & Tracking
      hasGoogleAnalytics: client.hasGoogleAnalytics,
      hasFacebookPixel: client.hasFacebookPixel,
      trackingTools,
      canProvideAnalyticsAccess: client.canProvideAnalyticsAccess,
      analyticsNotes: client.analyticsNotes,

      // Social Media & Platforms
      socialPlatforms,
      hasFbBusinessManager: client.hasFbBusinessManager,
      hasGoogleAds: client.hasGoogleAds,

      // Goals & Objectives
      primaryGoal: client.primaryGoal,
      successDefinition: client.successDefinition,
      keyMetrics,
      revenueTarget: client.revenueTarget,
      targetCpa: client.targetCpa,
      targetRoas: client.targetRoas,

      // Audience & Competitors
      idealCustomerProfile: client.idealCustomerProfile,
      geographicTargeting: client.geographicTargeting,
      ageRange: client.ageRange,
      genderTargeting: client.genderTargeting,
      competitors,
      competitorStrengths: client.competitorStrengths,

      // Budget & Resources
      monthlyBudgetRange: client.monthlyBudgetRange,
      hasCreativeAssets: client.hasCreativeAssets,
      hasMarketingContact: client.hasMarketingContact,
      marketingContactName: client.marketingContactName,
      marketingContactEmail: client.marketingContactEmail,

      // Metadata
      timestamp: new Date().toISOString(),
      resent: true,
      resentBy: session.user.email,
    };

    // Send to N8N webhook
    try {
      const response = await axios.post(n8nWebhookUrl, webhookPayload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      });

      // Log the webhook call
      await prisma.n8nWebhookLog.create({
        data: {
          clientId: client.id,
          uniqueClientId: client.uniqueClientId,
          direction: "outbound",
          webhookType: "onboarding_resent",
          payload: JSON.stringify(webhookPayload),
          status: "success",
          responseCode: response.status,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          clientId: client.id,
          activityType: "n8n_webhook_resent",
          activityDescription: `N8N webhook resent by admin (${session.user.email})`,
          metadata: JSON.stringify({
            resentBy: session.user.email,
            responseStatus: response.status,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Client data resent to N8N successfully",
        webhookResponse: {
          status: response.status,
          data: response.data,
        },
      });
    } catch (webhookError: any) {
      // Log the failed webhook call
      await prisma.n8nWebhookLog.create({
        data: {
          clientId: client.id,
          uniqueClientId: client.uniqueClientId,
          direction: "outbound",
          webhookType: "onboarding_resent",
          payload: JSON.stringify(webhookPayload),
          status: "failed",
          errorMessage: webhookError.message,
          responseCode: webhookError.response?.status || null,
        },
      });

      throw new Error(`N8N webhook failed: ${webhookError.message}`);
    }
  } catch (error: any) {
    console.error("Resend N8N error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resend to N8N" },
      { status: 500 }
    );
  }
}
