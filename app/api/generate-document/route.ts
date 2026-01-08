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

// Document types that can be generated
export const DOCUMENT_TYPES = {
  'gtm-strategy': 'Go-To-Market Strategy',
  'positioning': 'Offer & Positioning Framework',
  'messaging': 'Messaging & Value Proposition',
  'funnel-strategy': 'Funnel & Conversion Strategy',
  'content-strategy': 'Content Strategy',
  'paid-ads': 'Paid Ads Strategy',
  'seo-strategy': 'SEO / Organic Growth Plan',
  'crm-design': 'CRM & RevOps Design',
  'client-success': 'Client Success & Retention Plan',
  'kpi-framework': 'Reporting & KPI Framework',
  'risk-mitigation': 'Risk Mitigation & Constraints Map',
  'tool-optimization': 'Tool Stack Optimization Plan',
  'automation-map': 'Automation Opportunities Map',
  'quick-wins': 'Short-Term Quick Wins (30–90 days)',
  'scale-strategy': 'Long-Term Scale Strategy',
} as const;

type DocumentType = keyof typeof DOCUMENT_TYPES;

/**
 * Generate a strategic document using OpenAI
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
    const { documentType, forceRegenerate } = body as { documentType: DocumentType; forceRegenerate?: boolean };

    if (!documentType || !DOCUMENT_TYPES[documentType]) {
      return NextResponse.json(
        { error: "Invalid document type" },
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

    // Check if document already exists (unless forceRegenerate is true)
    if (!forceRegenerate) {
      const existingDocument = await prisma.generatedDocument.findUnique({
        where: {
          clientId_documentType: {
            clientId: client.id,
            documentType: documentType,
          },
        },
      });

      if (existingDocument) {
        // Return existing document
        return NextResponse.json({
          success: true,
          cached: true,
          document: {
            id: existingDocument.id,
            type: documentType,
            title: DOCUMENT_TYPES[documentType],
            content: existingDocument.content,
            wordCount: existingDocument.wordCount,
            generatedAt: existingDocument.generatedAt.toISOString(),
            updatedAt: existingDocument.updatedAt.toISOString(),
          },
        });
      }
    }

    // Build context from client data
    const clientContext = buildClientContext(client);

    // Generate document using OpenAI
    const documentContent = await generateDocument(documentType, clientContext);

    // Calculate word count
    const wordCount = documentContent.split(/\s+/).length;

    // Save or update the document
    const savedDocument = await prisma.generatedDocument.upsert({
      where: {
        clientId_documentType: {
          clientId: client.id,
          documentType: documentType,
        },
      },
      update: {
        content: documentContent,
        wordCount: wordCount,
        title: DOCUMENT_TYPES[documentType],
      },
      create: {
        clientId: client.id,
        documentType: documentType,
        title: DOCUMENT_TYPES[documentType],
        content: documentContent,
        wordCount: wordCount,
      },
    });

    // Return the generated document
    return NextResponse.json({
      success: true,
      cached: false,
      document: {
        id: savedDocument.id,
        type: documentType,
        title: DOCUMENT_TYPES[documentType],
        content: documentContent,
        wordCount: wordCount,
        generatedAt: savedDocument.generatedAt.toISOString(),
        updatedAt: savedDocument.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error("Document generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 }
    );
  }
}

/**
 * Build context string from client data
 */
function buildClientContext(client: any): string {
  const context = `
Company Information:
- Company Name: ${client.companyName}
- Industry: ${client.industry}
- Website: ${client.websiteUrl || 'Not provided'}
- Employee Count: ${client.employeeCount || 'Not provided'}
- Business Model: ${client.businessModel || 'Not provided'}
- Company Description: ${client.companyDescription || 'Not provided'}

Marketing State:
- Worked with Agency Before: ${client.workedWithAgency ? 'Yes' : 'No'}
- Current Marketing Channels: ${parseJSON(client.currentChannels)}
- Primary Challenges: ${parseJSON(client.primaryChallenges)}
- Marketing Feedback: ${client.marketingFeedback || 'Not provided'}

Analytics & Tracking:
- Google Analytics: ${client.hasGoogleAnalytics || 'Not provided'}
- Facebook Pixel: ${client.hasFacebookPixel || 'Not provided'}
- Tracking Tools: ${parseJSON(client.trackingTools)}
- Analytics Notes: ${client.analyticsNotes || 'Not provided'}

Social Media:
- Social Platforms: ${parseJSON(client.socialPlatforms)}
- FB Business Manager: ${client.hasFbBusinessManager || 'Not provided'}
- Google Ads: ${client.hasGoogleAds || 'Not provided'}

Goals & Objectives:
- Primary Goal: ${client.primaryGoal || 'Not provided'}
- Success Definition: ${client.successDefinition || 'Not provided'}
- Key Metrics: ${parseJSON(client.keyMetrics)}
- Revenue Target: ${client.revenueTarget || 'Not provided'}
- Target CPA: ${client.targetCpa || 'Not provided'}
- Target ROAS: ${client.targetRoas || 'Not provided'}

Target Audience:
- Ideal Customer Profile: ${client.idealCustomerProfile || 'Not provided'}
- Geographic Targeting: ${client.geographicTargeting || 'Not provided'}
- Age Range: ${client.ageRange || 'Not provided'}
- Gender Targeting: ${client.genderTargeting || 'Not provided'}
- Competitors: ${client.competitors || 'Not provided'}
- Competitor Strengths: ${client.competitorStrengths || 'Not provided'}

Budget & Resources:
- Monthly Budget Range: ${client.monthlyBudgetRange || 'Not provided'}
- Has Creative Assets: ${client.hasCreativeAssets || 'Not provided'}
- Has Marketing Contact: ${client.hasMarketingContact || 'Not provided'}
`;

  return context.trim();
}

/**
 * Parse JSON string or return as-is
 */
function parseJSON(value: any): string {
  if (!value) return 'Not provided';
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

/**
 * Generate document content using OpenAI
 */
async function generateDocument(documentType: DocumentType, clientContext: string): Promise<string> {
  const prompts: Record<DocumentType, string> = {
    'gtm-strategy': `Create a comprehensive, consultant-grade Go-To-Market Strategy document.

REQUIRED SECTIONS:
1. Executive Summary (2-3 paragraphs)
   - Strategic overview tailored to their industry and business model
   - Key opportunities and recommended approach

2. Market Analysis & Segmentation
   - Total Addressable Market (TAM) estimate for their industry
   - Serviceable segments based on their geographic targeting and ideal customer profile
   - Market sizing with realistic penetration estimates
   - Competitive landscape analysis using their listed competitors

3. Positioning & Differentiation Strategy
   - Unique value proposition based on their business model and offerings
   - Competitive differentiation matrix (table format)
   - Key differentiators vs. competitors mentioned

4. Target Customer Profile Deep-Dive
   - Detailed ICP analysis using their provided demographics
   - Customer pain points in their industry
   - Buying journey and decision-making process
   - Budget expectations aligned with their target CPA/ROAS

5. Multi-Channel GTM Strategy
   - Channel prioritization based on their current channels and budget
   - Specific tactics for each recommended channel
   - Budget allocation table across channels
   - Integration strategy for their existing tracking tools

6. Launch Timeline & Phases
   - Phase 1 (Months 1-3): Foundation building
   - Phase 2 (Months 4-6): Scale & optimize
   - Phase 3 (Months 7-12): Expansion
   - Specific milestones and deliverables per phase

7. Success Metrics & KPIs
   - North star metric aligned with their primary goal
   - Channel-specific KPIs
   - Measurement plan using their analytics tools (Google Analytics, Facebook Pixel, etc.)
   - Target benchmarks based on their revenue target and ROAS goals

8. Risk Assessment & Mitigation
   - Industry-specific challenges
   - Resource constraints based on their team size
   - Contingency plans

FORMAT: Professional markdown with tables, bullet points, and clear section headers. 1400-1600 words.`,

    'positioning': `Develop a strategic Offer & Positioning Framework that establishes market differentiation.

REQUIRED SECTIONS:
1. Brand Positioning Statement
   - For [target customer from their ICP]
   - Who [specific need/pain point in their industry]
   - Our [company name] is [category]
   - That [unique benefit]
   - Unlike [competitors], we [key differentiator]

2. Core Value Proposition
   - Functional benefits specific to their business model
   - Emotional benefits for their target audience
   - Economic benefits aligned with their pricing/ROI goals
   - Proof points from their industry experience

3. Competitive Positioning Matrix
   - TABLE: Compare client vs. 3-4 competitors on 5-6 key dimensions
   - Based on their listed competitors and competitive strengths
   - Identify white space opportunities
   - Recommended positioning angle

4. Target Segment Positioning
   - Primary segment: [their ICP details]
   - Secondary segments (if applicable based on their targeting)
   - Positioning variations by segment
   - Industry-specific messaging adaptations

5. Messaging Architecture
   - Master brand message
   - 3-4 messaging pillars supporting the value prop
   - Proof points for each pillar
   - Emotional and rational appeal balance

6. Category Design & Differentiation
   - Industry category analysis
   - How to position against established players
   - Unique angle based on their business model
   - Language and framing recommendations

7. Offer Architecture
   - Core offer structure aligned with their services
   - Service/product tiers (if applicable)
   - Bundling recommendations
   - Pricing positioning strategy

8. Brand Personality & Voice
   - Tone attributes for their industry
   - Voice guidelines
   - Example messaging for different touchpoints

FORMAT: Professional markdown with positioning matrix in table format. Include specific examples. 1300-1500 words.`,

    'messaging': `Create a comprehensive Messaging & Value Proposition guide for all customer touchpoints.

REQUIRED SECTIONS:
1. Core Messaging Framework
   - One-liner elevator pitch
   - 30-second value proposition
   - 2-minute company story
   - Industry-specific language and terminology

2. Customer Pain Points & Solutions Map
   - TABLE: Pain Point | Impact | Our Solution | Unique Approach
   - 5-7 pain points specific to their industry and ICP
   - How their business model solves each pain point
   - Proof points and validation

3. Benefits Hierarchy
   - Primary benefits (3-4 key benefits)
   - Supporting benefits (5-6 secondary benefits)
   - Feature-to-benefit translations
   - Quantified outcomes aligned with their KPIs

4. Competitive Messaging
   - How to message against listed competitors
   - Competitive advantages from their strengths
   - Objection handling for competitor claims
   - Switching narrative (why leave competitors)

5. Audience-Specific Messaging
   - For [primary ICP segment]: Key messages, pain points, language
   - For [secondary segments if applicable]: Adapted messaging
   - By geographic region (if targeting multiple)
   - By company size/stage (if applicable)

6. Messaging by Funnel Stage
   - AWARENESS: Problem-focused messaging
   - CONSIDERATION: Solution & differentiation messaging
   - DECISION: Proof & conversion messaging
   - Post-purchase messaging

7. Channel-Specific Messaging Adaptations
   - Based on their current channels:
   - Social media: Platform-specific adaptations
   - Paid ads: High-impact short-form messaging
   - Email: Nurture sequence messaging themes
   - Website: Page-by-page messaging guide
   - Sales: Pitch deck key messages

8. Proof Points & Credibility Indicators
   - Industry credentials and experience
   - Results and outcomes (quantified)
   - Case study themes
   - Trust builders for their target audience

9. Messaging Do's and Don'ts
   - Language to embrace
   - Terms to avoid for their industry
   - Tone guidelines
   - Common messaging pitfalls

FORMAT: Professional markdown with tables for pain point mapping and audience messaging. 1400-1600 words.`,

    'funnel-strategy': `Design a data-driven Funnel & Conversion Strategy optimized for their business model.

REQUIRED SECTIONS:
1. Funnel Overview & Architecture
   - Full customer journey map from awareness to retention
   - Funnel stages specific to their business model and sales cycle
   - Current state analysis based on their existing channels
   - Conversion benchmarks for their industry

2. Awareness Stage Strategy
   - Channel mix based on their budget and current channels
   - Top-of-funnel content and campaigns
   - Audience targeting using their ICP and demographics
   - Reach and impression goals
   - Cost per acquisition targets aligned with their target CPA

3. Consideration Stage Strategy
   - Nurture tactics and touchpoint sequence
   - Content types for education and engagement
   - Lead magnet recommendations for their industry
   - Email nurture flow structure
   - Social proof and credibility building

4. Decision Stage Strategy
   - Conversion tactics and offers
   - Sales enablement (if applicable)
   - Proposal/demo process optimization
   - Objection handling and FAQs
   - Closing tactics for their business model

5. Conversion Rate Optimization Plan
   - CRO audit priorities based on their website and tracking setup
   - Landing page optimization checklist
   - Form optimization (reduce friction)
   - A/B testing roadmap (first 90 days)
   - Personalization opportunities

6. Funnel Metrics & Measurement
   - TABLE: Stage | Key Metrics | Target Benchmarks | Tracking Method
   - Utilize their existing analytics tools (GA, FB Pixel, etc.)
   - Conversion rate targets by stage
   - Funnel velocity metrics
   - Attribution model recommendations

7. Retention & Expansion Funnel
   - Post-purchase engagement strategy
   - Upsell/cross-sell opportunities
   - Referral program strategy
   - Churn prevention triggers
   - Customer lifetime value optimization

8. Technology & Tools Stack
   - Recommendations based on their current tools
   - Marketing automation setup
   - CRM integration with their existing systems
   - Analytics and tracking implementation
   - Budget allocation for tools

9. 90-Day Optimization Roadmap
   - Month 1: Foundation and tracking
   - Month 2: Testing and optimization
   - Month 3: Scaling what works
   - Specific initiatives with priority ranking

FORMAT: Professional markdown with funnel stage tables and metrics framework. 1500-1700 words.`,

    'content-strategy': `Develop a comprehensive Content Strategy aligned with SEO and conversion goals.

REQUIRED SECTIONS:
1. Content Strategy Overview
   - Strategic objectives tied to their primary goal
   - How content supports their GTM and funnel strategy
   - Content marketing maturity assessment
   - Resource requirements based on their team size

2. Content Pillars & Themes
   - 4-5 core content pillars for their industry
   - Sub-themes under each pillar
   - Alignment with customer pain points and ICP interests
   - Keyword opportunities (high-level clusters)

3. Audience-Centric Content Planning
   - Content needs by ICP segment
   - Content by buyer journey stage (awareness → decision)
   - Industry-specific content types that perform well
   - Thought leadership opportunities

4. Content Types & Formats
   - Recommended mix for their channels and budget:
   - Blog posts/articles (topics and frequency)
   - Video content (if applicable)
   - Infographics and visual content
   - Case studies and testimonials
   - Whitepapers/guides (lead magnets)
   - Social content
   - Email newsletters
   - Format prioritization based on resources

5. SEO-Optimized Content Plan
   - Keyword research framework for their industry
   - Content gap analysis vs. competitors
   - Search intent mapping
   - On-page SEO checklist
   - Internal linking strategy
   - Featured snippet opportunities

6. Content Calendar Framework
   - Publishing frequency by content type
   - Seasonal/industry event calendar
   - Content production workflow
   - Sample 30-day content calendar
   - Repurposing strategy (1 piece → 10 assets)

7. Distribution & Amplification Strategy
   - Owned channels (website, email, social)
   - Earned channels (PR, partnerships, guest posting)
   - Paid amplification (social ads, sponsored content)
   - Distribution checklist for each piece
   - Cross-channel promotion tactics

8. Content Production & Workflow
   - Team roles and responsibilities
   - Content creation process (ideation → publish)
   - Tools and templates needed
   - Quality control and brand guidelines
   - Outsourcing vs. in-house recommendations

9. Content Metrics & KPIs
   - Traffic and engagement metrics
   - Conversion metrics (leads, sales)
   - SEO metrics (rankings, organic traffic)
   - TABLE: Content Type | Key Metrics | Targets
   - Reporting cadence and dashboards

10. Content Optimization & Iteration
    - Content audit framework
    - Update and refresh schedule
    - Performance analysis process
    - Scaling successful content
    - Sunsetting underperforming content

FORMAT: Professional markdown with content calendar template and metrics tables. 1600-1800 words.`,

    'paid-ads': `Create a performance-driven Paid Ads Strategy with platform-specific tactics.

REQUIRED SECTIONS:
1. Paid Advertising Strategy Overview
   - Budget allocation aligned with their monthly budget range
   - Platform prioritization based on their ICP and industry
   - Expected ROAS and CPA based on their targets
   - Integration with their existing tracking (FB Pixel, GA, etc.)

2. Platform Strategy & Budget Allocation
   - TABLE: Platform | Budget % | Rationale | Expected CPA | Expected ROAS
   - Platforms to consider based on their business model:
     * Google Ads (Search, Display, Shopping if ecommerce)
     * Facebook/Instagram Ads
     * LinkedIn Ads (if B2B)
     * YouTube Ads
     * TikTok Ads (if relevant to audience)
     * Industry-specific platforms
   - Testing budget vs. scaling budget split

3. Google Ads Strategy (if recommended)
   - Campaign structure (Search, Shopping, Display, Remarketing)
   - Keyword targeting based on their industry and offerings
   - Ad copy themes and CTAs
   - Landing page requirements
   - Bidding strategy and budget
   - Expected performance benchmarks

4. Facebook/Instagram Ads Strategy (if recommended)
   - Campaign objective hierarchy (Awareness → Conversion)
   - Audience targeting using their demographics and ICP
   - Creative strategy and format recommendations
   - Ad copy frameworks
   - Pixel implementation and custom conversions
   - Retargeting audiences and sequences
   - Budget scaling strategy

5. LinkedIn Ads Strategy (if B2B applicable)
   - Campaign types (Sponsored Content, InMail, Text Ads)
   - Targeting criteria using their B2B ICP
   - Content and creative recommendations
   - Lead gen forms vs. landing pages
   - Budget requirements and expected CPL

6. Creative Strategy & Asset Requirements
   - Ad creative guidelines for their brand
   - Format specifications by platform
   - A/B testing framework for creatives
   - Messaging variations by audience segment
   - Video ad scripts (if applicable)
   - User-generated content opportunities

7. Targeting & Audience Strategy
   - Cold audience targeting criteria
   - Warm audience (website visitors, engagement)
   - Hot audience (cart abandoners, high-intent)
   - Lookalike/similar audience strategy
   - Exclusion audiences
   - Geographic and demographic targeting per their data

8. Campaign Structure & Ad Account Setup
   - Account structure (Campaigns → Ad Sets → Ads)
   - Naming conventions
   - Conversion tracking setup
   - UTM parameter strategy
   - Integration with CRM and analytics

9. Performance Metrics & Optimization
   - KPIs by campaign objective
   - Daily/weekly monitoring checklist
   - Optimization triggers (when to pause, scale, adjust)
   - A/B testing roadmap (first 60 days)
   - Reporting dashboard requirements

10. 90-Day Rollout Plan
    - Month 1: Setup, testing, learning ($X budget)
    - Month 2: Optimize and scale winners ($Y budget)
    - Month 3: Full-scale deployment ($Z budget)
    - Milestones and decision points

FORMAT: Professional markdown with budget allocation tables and platform-specific tactics. 1500-1700 words.`,

    'seo-strategy': `Develop a comprehensive SEO / Organic Growth Plan for long-term visibility.

REQUIRED SECTIONS:
1. SEO Strategy Overview & Objectives
   - SEO goals aligned with their primary business goal
   - Current state assessment (if website provided)
   - Competitive SEO landscape in their industry
   - Timeline to results and expectations

2. Technical SEO Audit & Recommendations
   - Site speed optimization priorities
   - Mobile responsiveness check
   - Core Web Vitals targets
   - Crawlability and indexation issues
   - Site architecture and URL structure
   - Schema markup opportunities
   - HTTPS and security
   - Technical SEO checklist (prioritized)

3. Keyword Research & Strategy
   - Primary keywords for their industry and offerings
   - Long-tail keyword opportunities
   - Search intent mapping (informational, commercial, transactional)
   - Keyword difficulty and opportunity analysis
   - Competitor keyword gaps
   - TABLE: Target Keyword | Search Volume | Difficulty | Intent | Priority

4. On-Page SEO Strategy
   - Title tag and meta description framework
   - Header tag hierarchy (H1-H6 usage)
   - Content optimization guidelines
   - Internal linking strategy
   - Image optimization (alt tags, compression)
   - URL structure best practices
   - Featured snippet optimization tactics

5. Content Plan for SEO
   - Content gap analysis vs. competitors
   - Topic cluster strategy (pillar pages + supporting content)
   - Blog content calendar aligned with keywords
   - Bottom-of-funnel content priorities
   - Content depth and word count recommendations
   - Update schedule for existing content

6. Off-Page SEO & Link Building
   - Link building strategy for their industry
   - Target websites and publications
   - Outreach templates and tactics
   - Guest posting opportunities
   - Digital PR and brand mentions
   - Local citations (if applicable)
   - Competitor backlink analysis

7. Local SEO Strategy (if applicable)
   - Google Business Profile optimization
   - Local keyword targeting by location
   - Local citation building (directories)
   - Review generation strategy
   - Local content creation
   - NAP (Name, Address, Phone) consistency

8. E-commerce SEO (if applicable)
   - Product page optimization
   - Category page strategy
   - Duplicate content handling
   - Product schema markup
   - User-generated content (reviews)
   - Shopping feed optimization

9. Measurement & Tracking
   - Google Analytics 4 setup and goals
   - Google Search Console monitoring
   - Ranking tracking for target keywords
   - Organic traffic and conversion metrics
   - TABLE: Metric | Current | 3-Month Target | 6-Month Target | 12-Month Target
   - Dashboard and reporting setup

10. 12-Month SEO Roadmap
    - Months 1-3: Foundation (technical, keyword research, quick wins)
    - Months 4-6: Content production and on-page optimization
    - Months 7-9: Link building and authority building
    - Months 10-12: Scale and expand
    - Specific deliverables and milestones per quarter

FORMAT: Professional markdown with keyword tables and technical checklist. 1600-1800 words.`,

    'crm-design': `Design a comprehensive CRM & RevOps system for sales and marketing alignment.

REQUIRED SECTIONS:
1. CRM Strategy & Platform Recommendations
   - Recommended CRM platform for their business size and model
   - Why this CRM fits their needs and budget
   - Integration capabilities with their current tools
   - Implementation timeline and resources needed

2. Data Architecture & Custom Fields
   - Standard objects (Contacts, Companies, Deals, Tasks)
   - Custom fields needed for their industry and sales process
   - Data capture strategy (forms, integrations, enrichment)
   - Data governance and quality rules
   - Required fields vs. optional fields

3. Pipeline Design & Deal Stages
   - Sales pipeline structure for their business model
   - Deal stages with clear definitions:
     * Stage 1: [Name] - Entry criteria, activities, exit criteria
     * Stage 2: [Name] - Entry criteria, activities, exit criteria
     * (Continue for all stages)
   - Expected conversion rates between stages
   - Average time in each stage
   - Multiple pipelines if needed (different products/segments)

4. Lead Management & Scoring
   - Lead capture strategy from their marketing channels
   - Lead routing rules (assignment logic)
   - Lead scoring model:
     * Demographic scoring (title, company size, industry)
     * Behavioral scoring (website visits, email opens, content downloads)
     * Point values and thresholds
   - MQL (Marketing Qualified Lead) definition
   - SQL (Sales Qualified Lead) definition
   - Lead nurture workflows for not-ready leads

5. Marketing Automation & Workflows
   - Email automation sequences:
     * Welcome/onboarding series
     * Nurture campaigns by segment
     * Re-engagement campaigns
     * Event-triggered emails
   - Lead lifecycle automation
   - Task creation and notification workflows
   - Data enrichment automation
   - Integration with their email marketing tools

6. Sales Process & Playbooks
   - Sales process documentation for each pipeline stage
   - Email templates for common scenarios
   - Meeting/demo scripts
   - Proposal templates
   - Follow-up cadences
   - Deal progression criteria
   - Win/loss analysis process

7. Reporting & Analytics Framework
   - Dashboard 1: Sales Performance
     * Metrics: Pipeline value, win rate, avg. deal size, sales cycle
   - Dashboard 2: Marketing Performance
     * Metrics: Lead volume, MQL→SQL rate, cost per lead, channel ROI
   - Dashboard 3: Revenue Operations
     * Metrics: Customer acquisition cost, lifetime value, churn rate
   - Custom reports needed
   - Reporting cadence (daily, weekly, monthly)

8. Integration Strategy
   - Marketing integrations (email, ads, website forms)
   - Sales integrations (email, calendar, phone)
   - Customer success integrations
   - Analytics integrations (GA, tracking pixels)
   - Accounting/billing integrations
   - Integration priorities and timeline

9. Team Training & Adoption
   - User roles and permissions structure
   - Training plan for sales team
   - Training plan for marketing team
   - CRM usage policies and best practices
   - Adoption metrics and accountability

10. Implementation Roadmap
    - Phase 1: CRM setup and configuration (Weeks 1-2)
    - Phase 2: Data migration and integration (Weeks 3-4)
    - Phase 3: Automation and workflows (Weeks 5-6)
    - Phase 4: Training and rollout (Weeks 7-8)
    - Phase 5: Optimization and iteration (Ongoing)

FORMAT: Professional markdown with pipeline stage tables and scoring model. 1500-1700 words.`,

    'client-success': `Create a Client Success & Retention Plan to maximize customer lifetime value.

REQUIRED SECTIONS:
1. Client Success Strategy Overview
   - Goals: Retention rate, expansion revenue, NPS, churn reduction
   - Client success model for their business size and type
   - Team structure and role responsibilities
   - Success metrics aligned with their business goals

2. Customer Onboarding Process
   - Onboarding timeline (Day 1 → Day 90)
   - Welcome sequence and kick-off meeting agenda
   - Documentation and resources provided
   - Training and enablement schedule
   - Success milestones and checkpoints
   - Onboarding completion criteria
   - Time-to-value optimization

3. Customer Journey Mapping
   - TABLE: Journey Stage | Customer Goal | Our Actions | Key Metrics
   - Onboarding (Days 1-30)
   - Adoption (Days 31-90)
   - Value realization (Months 4-6)
   - Growth (Months 7-12)
   - Advocacy (12+ months)
   - Touchpoints and engagement at each stage

4. Engagement & Touchpoint Strategy
   - Regular check-in cadence (weekly, monthly, quarterly)
   - Business review meetings (QBRs) structure
   - Educational content and webinars
   - Community and peer networking
   - Product updates and new feature announcements
   - Proactive outreach triggers

5. Health Score & Risk Monitoring
   - Customer health score model:
     * Product usage metrics (login frequency, feature adoption)
     * Engagement metrics (support tickets, meeting attendance)
     * Sentiment metrics (NPS, CSAT, support tone)
     * Commercial metrics (expansion potential, payment history)
   - Health score calculation and thresholds
   - At-risk customer identification and alerts
   - Red flag indicators specific to their industry

6. Churn Prevention & Retention Strategies
   - Early warning system for churn risk
   - Intervention playbooks for at-risk customers
   - Win-back campaigns for churned customers
   - Retention offers and incentives
   - Root cause analysis for churn
   - Target retention rate and improvement plan

7. Expansion & Upsell Strategy
   - Expansion revenue opportunities (upsell, cross-sell)
   - Ideal expansion timing and triggers
   - Account growth playbook
   - Pricing and packaging for expansion
   - Success stories and case studies for expansion conversations
   - Expansion revenue targets

8. Customer Advocacy & Referrals
   - Customer satisfaction measurement (NPS, CSAT)
   - Review and testimonial generation process
   - Case study development workflow
   - Referral program structure and incentives
   - Customer advisory board (if applicable)
   - Speaking and co-marketing opportunities

9. Support & Success Operations
   - Support channel strategy (email, chat, phone)
   - SLA (Service Level Agreement) definitions
   - Knowledge base and self-service resources
   - Escalation process for critical issues
   - Support metrics (response time, resolution time, CSAT)
   - Tooling for customer success team

10. Success Metrics & Reporting
    - North Star Metric for customer success
    - TABLE: Metric | Current | Target | Tracking Method
      * Net Revenue Retention (NRR)
      * Gross Retention Rate
      * Churn Rate (logo and revenue)
      * Customer Lifetime Value (LTV)
      * Net Promoter Score (NPS)
      * Time to Value
      * Expansion Revenue
    - Dashboard and reporting cadence

FORMAT: Professional markdown with journey mapping tables and health score framework. 1500-1700 words.`,

    'kpi-framework': `Develop a comprehensive Reporting & KPI Framework for data-driven decision making.

REQUIRED SECTIONS:
1. Measurement Strategy Overview
   - North Star Metric for their business model
   - Measurement philosophy and approach
   - Data sources and tools integration
   - Reporting stakeholders and their needs

2. Business-Level KPIs
   - Revenue Metrics:
     * Monthly Recurring Revenue (MRR) or Total Revenue
     * Revenue Growth Rate
     * Customer Acquisition Cost (CAC)
     * Customer Lifetime Value (LTV)
     * LTV:CAC Ratio
   - Profitability Metrics:
     * Gross Margin
     * Operating Margin
     * Cash Flow
   - Targets based on their revenue goals

3. Marketing KPIs by Channel
   - TABLE: Channel | Key Metrics | Targets | Tracking Method

   - Paid Advertising:
     * Impressions, Clicks, CTR
     * Cost per Click (CPC)
     * Cost per Acquisition (CPA) - aligned with their target
     * Return on Ad Spend (ROAS) - aligned with their target
     * Conversion Rate

   - Organic/SEO:
     * Organic Traffic
     * Keyword Rankings
     * Domain Authority
     * Backlinks
     * Organic Conversion Rate

   - Social Media:
     * Followers and Growth Rate
     * Engagement Rate
     * Social Traffic
     * Social Conversions

   - Email Marketing:
     * List Size and Growth
     * Open Rate, Click Rate
     * Conversion Rate
     * Email Revenue Attribution

   - Content Marketing:
     * Content Views
     * Time on Page
     * Content Conversions
     * Content-Influenced Pipeline

4. Sales KPIs
   - Pipeline Metrics:
     * Pipeline Value by Stage
     * New Opportunities Created
     * Pipeline Velocity
     * Stage Conversion Rates
   - Activity Metrics:
     * Calls/Meetings Completed
     * Proposals Sent
     * Follow-up Response Rate
   - Performance Metrics:
     * Win Rate
     * Average Deal Size
     * Sales Cycle Length
     * Quota Attainment

5. Customer Success KPIs
   - Retention Metrics:
     * Customer Retention Rate
     * Logo Churn Rate
     * Revenue Churn Rate
     * Net Revenue Retention
   - Satisfaction Metrics:
     * Net Promoter Score (NPS)
     * Customer Satisfaction (CSAT)
     * Product Usage/Adoption Metrics
   - Growth Metrics:
     * Upsell/Cross-sell Rate
     * Expansion Revenue
     * Customer Health Score

6. Website & Conversion KPIs
   - Traffic Metrics:
     * Total Visitors
     * Traffic by Source/Channel
     * New vs. Returning Visitors
   - Engagement Metrics:
     * Pages per Session
     * Average Session Duration
     * Bounce Rate
   - Conversion Metrics:
     * Conversion Rate by Page
     * Form Completion Rate
     * Goal Completions
     * Micro and Macro Conversions

7. Dashboard Design & Specifications
   - Executive Dashboard (Monthly):
     * Revenue, growth, CAC, LTV
     * Top-line metrics and trends
   - Marketing Dashboard (Weekly):
     * Channel performance, lead volume
     * Campaign ROI, budget pacing
   - Sales Dashboard (Daily):
     * Pipeline health, activities
     * Win rate, forecast accuracy
   - Customer Success Dashboard (Weekly):
     * Health scores, churn risk
     * NPS, retention rates

   Tool recommendations: Google Looker Studio, Tableau, HubSpot, or based on their current stack

8. Data Sources & Integration Map
   - Data source inventory:
     * Google Analytics → Website and traffic data
     * Facebook Ads Manager → Paid social performance
     * Google Ads → Paid search performance
     * CRM → Sales and customer data
     * Email platform → Email marketing data
     * Financial system → Revenue and cost data
   - Integration requirements and setup
   - Data freshness and update frequency

9. Reporting Cadence & Distribution
   - Daily Reports: Who gets what, delivery method
   - Weekly Reports: Format and distribution
   - Monthly Reports: Comprehensive reviews
   - Quarterly Business Reviews: Format and presentation
   - Annual Strategic Reviews
   - Alert thresholds for critical metrics

10. Measurement Governance
    - Data quality standards and checks
    - Naming conventions and UTM parameters
    - Conversion tracking setup requirements
    - Attribution model selection (first-touch, last-touch, multi-touch)
    - A/B test tracking and documentation
    - Metric definitions and documentation (data dictionary)
    - Reporting calendar and responsibilities

FORMAT: Professional markdown with comprehensive KPI tables by function. 1500-1700 words.`,

    'risk-mitigation': `Create a Risk Mitigation & Constraints Map to proactively address challenges.

REQUIRED SECTIONS:
1. Risk Assessment Framework
   - Risk evaluation methodology
   - Risk severity matrix (Likelihood × Impact)
   - Risk categories for their business context
   - Stakeholder risk tolerance

2. Strategic & Market Risks
   - Risk 1: [Market/Competitive Risk for their industry]
     * Description and potential impact
     * Likelihood: Low/Medium/High
     * Impact: Low/Medium/High
     * Mitigation strategies (2-3 specific actions)
     * Contingency plan if risk materializes
     * Early warning indicators

   - Risk 2: [Customer Demand Risk]
     * Analysis based on their target market
     * Mitigation and contingency

   - Risk 3: [Competitive Disruption]
     * Based on their listed competitors
     * Mitigation and contingency

3. Execution & Operational Risks
   - Resource Constraints:
     * Team size limitations (based on their employee count)
     * Budget constraints (based on their budget range)
     * Time constraints
     * Mitigation: Prioritization, outsourcing, phasing

   - Technology Risks:
     * Platform dependencies
     * Integration failures
     * Data security and compliance
     * Mitigation: Redundancy, testing, security protocols

   - Process Risks:
     * Workflow bottlenecks
     * Quality control issues
     * Communication breakdowns
     * Mitigation: Process documentation, automation

4. Marketing & Channel Risks
   - Paid Advertising Risks:
     * Platform policy changes (FB, Google)
     * Ad account suspensions
     * Budget inefficiency / poor ROAS
     * Mitigation: Diversification, compliance, testing

   - SEO & Organic Risks:
     * Algorithm updates
     * Ranking volatility
     * Slow time-to-results
     * Mitigation: White-hat tactics, content diversity

   - Channel Concentration Risk:
     * Over-reliance on single channel
     * Mitigation: Multi-channel strategy

5. Financial Risks
   - Cash Flow Risks:
     * Customer payment delays
     * High customer acquisition costs
     * Budget overruns
     * Mitigation: Payment terms, CAC monitoring, budget controls

   - ROI Risks:
     * Marketing campaigns underperforming
     * Lower-than-expected conversion rates
     * Mitigation: Testing, gradual scaling, performance thresholds

6. Customer & Sales Risks
   - Acquisition Risks:
     * Longer sales cycles than expected
     * Low conversion rates
     * High customer acquisition cost
     * Mitigation: Sales process optimization, targeting refinement

   - Retention Risks:
     * Customer churn higher than expected
     * Low product/service adoption
     * Mitigation: Onboarding excellence, customer success focus

7. Regulatory & Compliance Risks
   - Data Privacy (GDPR, CCPA):
     * Requirements for their geography and business
     * Mitigation: Compliance audit, legal review

   - Industry Regulations:
     * Specific to their industry
     * Mitigation: Stay informed, compliance checklist

   - Advertising Compliance:
     * Platform policies, FTC guidelines
     * Mitigation: Ad review process, legal consultation

8. Constraints Analysis
   - Resource Constraints:
     * Budget limitations and impact
     * Team capacity and skills gaps
     * Technology limitations
     * Working within constraints strategy

   - Time Constraints:
     * Aggressive timelines and trade-offs
     * Seasonal factors for their industry
     * Dependency management

   - Market Constraints:
     * Competitive saturation
     * Market size limitations
     * Geographic constraints

9. Dependency Map
   - External Dependencies:
     * Third-party platforms and vendors
     * Partner relationships
     * Integration dependencies
     * Supply chain (if applicable)

   - Internal Dependencies:
     * Cross-functional collaboration needs
     * Approval processes
     * Resource availability

   - TABLE: Dependency | Owner | Risk Level | Mitigation

10. Risk Monitoring & Response Plan
    - Risk monitoring cadence (weekly review)
    - Early warning indicators dashboard
    - Decision triggers (when to activate contingency plans)
    - Risk response team and escalation path
    - Regular risk assessment schedule (monthly, quarterly)
    - Risk register maintenance

FORMAT: Professional markdown with risk matrices and dependency tables. 1400-1600 words.`,

    'tool-optimization': `Develop a Tool Stack Optimization Plan to improve efficiency and ROI.

REQUIRED SECTIONS:
1. Current Tool Stack Audit
   - Tools currently in use (based on their tracking tools and platforms):
     * Marketing tools
     * Sales tools
     * Analytics tools
     * Customer success tools
     * Operations tools
   - TABLE: Tool | Purpose | Cost | Users | Utilization | Issues
   - Total monthly/annual cost
   - Redundancies and overlaps

2. Tool Stack Assessment
   - Utilization Analysis:
     * Actively used vs. underutilized tools
     * Feature adoption within each tool
     * User adoption and satisfaction

   - Integration Assessment:
     * Current integrations and data flows
     * Integration gaps causing manual work
     * Data silos and disconnects

   - Cost-Benefit Analysis:
     * Cost per user/per feature
     * ROI of each tool
     * Expensive tools with low utilization

3. Gap Analysis
   - Missing Capabilities:
     * Marketing automation gaps
     * Analytics and reporting gaps
     * Sales enablement gaps
     * Customer success gaps

   - Pain Points:
     * Manual processes that could be automated
     * Reporting challenges
     * Integration issues
     * User experience problems

4. Tool Recommendations by Function
   - Marketing Stack:
     * CRM/Marketing Automation: [Recommendation with rationale]
     * Email Marketing: [Recommendation]
     * Social Media Management: [Recommendation]
     * SEO Tools: [Recommendation]
     * Advertising Management: [Recommendation]
     * Analytics: [Recommendation]

   - Sales Stack:
     * CRM: [Recommendation]
     * Email sequencing: [Recommendation]
     * Call tracking: [Recommendation]
     * Proposal software: [Recommendation]

   - Customer Success Stack:
     * Help desk: [Recommendation]
     * Onboarding: [Recommendation]
     * Customer communication: [Recommendation]

   - Operations & Analytics:
     * Project management: [Recommendation]
     * Reporting/BI: [Recommendation]
     * Documentation: [Recommendation]

5. Integration Architecture
   - Recommended tech stack architecture diagram (text-based)
   - Core platform (hub): [Tool] with integrations to:
     * Marketing tools
     * Sales tools
     * Customer data
     * Analytics
   - Critical integration requirements
   - Data flow and synchronization strategy
   - Single source of truth for customer data

6. Optimization Opportunities
   - Consolidation Opportunities:
     * Tools that can be replaced with all-in-one solution
     * Cost savings estimate

   - Upgrade Opportunities:
     * Moving from basic to advanced tiers
     * Unlocking unused features

   - New Tool Additions:
     * High-ROI tools to add
     * Justification and expected impact

7. Cost Optimization Plan
   - TABLE: Current State | Optimized State | Monthly Savings
   - Tools to eliminate
   - Tools to downgrade
   - Tools to consolidate
   - New tools to add (with cost)
   - Net cost impact (savings or investment)
   - ROI calculation for optimization effort

8. Implementation Priorities
   - Priority 1 (Immediate - 0-30 days):
     * Quick wins and high-impact changes
     * Tools causing pain points

   - Priority 2 (Short-term - 1-3 months):
     * Integration improvements
     * Training and adoption initiatives

   - Priority 3 (Medium-term - 3-6 months):
     * Major platform migrations
     * Advanced automation setup

   - Priority 4 (Long-term - 6-12 months):
     * Strategic additions
     * Advanced capabilities

9. Change Management & Training
   - Stakeholder communication plan
   - User training requirements by tool
   - Documentation and knowledge base needs
   - Adoption metrics and success criteria
   - Change champion identification
   - Phased rollout approach

10. Implementation Roadmap
    - Phase 1: Quick Wins (Month 1)
      * Specific actions, tools affected, expected outcomes
    - Phase 2: Core Integrations (Months 2-3)
      * Integration projects, data migration
    - Phase 3: Platform Consolidation (Months 4-6)
      * Major changes, training, adoption
    - Phase 4: Optimization (Months 7-12)
      * Advanced features, scaling
    - Timeline, owners, dependencies, success metrics

FORMAT: Professional markdown with tool comparison tables and cost analysis. 1500-1700 words.`,

    'automation-map': `Create an Automation Opportunities Map to increase efficiency and scale.

REQUIRED SECTIONS:
1. Automation Strategy Overview
   - Automation goals (time savings, consistency, scale)
   - Current automation maturity assessment
   - Resources available for automation initiatives
   - Expected ROI from automation investments

2. Current State: Manual Process Inventory
   - TABLE: Process | Function | Frequency | Time Cost | Pain Level

   - Marketing Processes:
     * Lead capture and routing
     * Email follow-ups
     * Social media posting
     * Report generation
     * Campaign setup

   - Sales Processes:
     * Lead qualification
     * Meeting scheduling
     * Follow-up sequences
     * Proposal creation
     * Data entry

   - Customer Success Processes:
     * Onboarding tasks
     * Check-in scheduling
     * Health score updates
     * Renewal notifications

3. Automation Opportunity Assessment
   For each automation opportunity, include:

   - Opportunity 1: [Lead Capture & Routing Automation]
     * Current manual process description
     * Automation solution and tools
     * Time savings estimate (hours/week)
     * Implementation complexity: Low/Medium/High
     * Cost estimate
     * ROI calculation (time saved × hourly rate)
     * Priority score: 1-10

   - Opportunity 2: [Email Marketing Automation]
     * Details as above

   - Opportunity 3: [Social Media Scheduling]
     * Details as above

   - Opportunity 4: [Sales Follow-up Sequences]
     * Details as above

   - Opportunity 5: [Meeting Scheduling Automation]
     * Details as above

   - Opportunity 6: [Lead Scoring Automation]
     * Details as above

   - Opportunity 7: [Report & Dashboard Automation]
     * Details as above

   - Opportunity 8: [Customer Onboarding Workflows]
     * Details as above

   - Opportunity 9: [Data Enrichment Automation]
     * Details as above

   - Opportunity 10: [Task & Notification Automation]
     * Details as above

4. Automation Tools & Platform Recommendations
   - Marketing Automation:
     * Platform: [HubSpot, Marketo, ActiveCampaign, etc.]
     * Use cases and workflows
     * Cost and learning curve

   - Workflow Automation:
     * Platform: [Zapier, Make, n8n, etc.]
     * Integration capabilities with their current tools

   - Sales Automation:
     * Platform: [Outreach, SalesLoft, built-in CRM automation]

   - Reporting Automation:
     * Platform: [Google Looker Studio, Tableau, etc.]

5. Priority Automation Roadmap
   - TABLE: Automation | Impact | Effort | ROI | Priority | Timeline

   - Prioritization Matrix (Quick Wins vs. Strategic):
     * Quick Wins (High Impact, Low Effort) - Start here
     * Strategic Bets (High Impact, High Effort) - Plan carefully
     * Fill-ins (Low Impact, Low Effort) - If time permits
     * Avoid (Low Impact, High Effort) - Deprioritize

6. Implementation Plans by Priority
   - Phase 1: Quick Wins (Weeks 1-4)
     * Automation 1: [Name]
       - Implementation steps
       - Tools/platforms needed
       - Owner and stakeholders
       - Success metrics
     * Automation 2: [Name]
       - Implementation details

   - Phase 2: Medium-Complexity (Weeks 5-12)
     * Automation initiatives with detailed plans

   - Phase 3: Advanced Automation (Months 4-6)
     * Complex workflow automation
     * Multi-system integrations

7. Workflow Documentation
   For top 3 priority automations, document:
   - Workflow name and trigger
   - Step-by-step automation logic
   - Data requirements and sources
   - Decision points and branching
   - Error handling and notifications
   - Success criteria

8. Training & Enablement Plan
   - Team members who need training
   - Training format (documentation, videos, workshops)
   - Automation best practices and governance
   - Who can create/modify automations
   - Testing and QA process
   - Documentation requirements

9. Measurement & ROI Tracking
   - Time savings metrics:
     * Hours saved per week/month
     * Cost savings (time × hourly rate)

   - Quality improvements:
     * Error reduction
     * Response time improvements
     * Consistency gains

   - Scale enablement:
     * Volume increase without headcount increase
     * Throughput improvements

   - TABLE: Automation | Time Saved | Cost Saved | Implemented Date | Status

10. Governance & Maintenance
    - Automation inventory and documentation
    - Regular review and optimization schedule
    - Broken automation monitoring and alerts
    - Update process when systems change
    - Ownership and responsibility matrix
    - Continuous improvement process

FORMAT: Professional markdown with opportunity matrices and ROI calculations. 1600-1800 words.`,

    'quick-wins': `Create a Short-Term Quick Wins plan (30–90 days) for immediate impact.

REQUIRED SECTIONS:
1. Quick Wins Strategy Overview
   - Definition of "quick wins" for their context
   - Selection criteria (high impact + low effort + fast results)
   - Resources available in the next 90 days
   - Expected cumulative impact

2. Quick Win Identification Framework
   - Evaluation matrix for each potential initiative:
     * Expected impact (1-10)
     * Implementation effort (1-10)
     * Time to results (days)
     * Resource requirements
     * Dependencies
     * Quick win score = Impact / (Effort + Time)

3. Website & Conversion Quick Wins
   - Quick Win 1: High-Intent Landing Page Optimization
     * What: Optimize top converting landing pages
     * Why: [Based on their conversion goals]
     * Actions: Clear CTA, form simplification, social proof
     * Timeline: Week 1-2
     * Expected impact: +X% conversion rate
     * Owner: [Role]

   - Quick Win 2: Website Speed Optimization
     * Compress images, enable caching, minify code
     * Timeline: Week 1
     * Impact: Better SEO, lower bounce rate

   - Quick Win 3: Lead Capture Form Optimization
     * Reduce fields, add trust signals, A/B test CTA
     * Timeline: Week 2
     * Impact: +X% form completions

4. Paid Advertising Quick Wins
   - Quick Win 4: Pause Underperforming Ads/Keywords
     * Audit current campaigns
     * Pause bottom 20% by ROAS
     * Reallocate budget to top performers
     * Timeline: Week 1
     * Impact: Immediate ROAS improvement

   - Quick Win 5: Remarketing Campaign Launch
     * Setup website visitor retargeting
     * Based on their FB Pixel and GA setup
     * Timeline: Week 2-3
     * Impact: Lower CPA, higher conversion rate

   - Quick Win 6: Ad Copy & Creative Refresh
     * Test new value props and offers
     * Timeline: Week 3-4
     * Impact: Improved CTR and conversion

5. SEO & Content Quick Wins
   - Quick Win 7: Low-Hanging Keyword Optimization
     * Find keywords ranking positions 11-20
     * Optimize pages to break into top 10
     * Timeline: Week 2-4
     * Impact: Organic traffic increase

   - Quick Win 8: Add Schema Markup
     * Implement structured data on key pages
     * Timeline: Week 3
     * Impact: Better search appearance, CTR

   - Quick Win 9: Content Update & Republish
     * Update top 10 performing blog posts
     * Timeline: Week 4-6
     * Impact: Traffic and ranking boost

6. Email & Marketing Automation Quick Wins
   - Quick Win 10: Welcome Email Sequence
     * 3-5 email automated welcome series
     * Timeline: Week 2-3
     * Impact: Better engagement, nurture

   - Quick Win 11: Lead Segmentation & Personalization
     * Segment database by [relevant criteria]
     * Send targeted campaigns
     * Timeline: Week 4-5
     * Impact: Higher email performance

   - Quick Win 12: Re-engagement Campaign
     * Target inactive leads/customers
     * Timeline: Week 5-6
     * Impact: Revenue from dormant list

7. Social Media Quick Wins
   - Quick Win 13: Content Posting Consistency
     * Create 30-day content calendar
     * Use scheduling tool
     * Timeline: Week 1-2
     * Impact: Engagement and visibility

   - Quick Win 14: Employee Advocacy Program
     * Team shares company content
     * Timeline: Week 3-4
     * Impact: Extended reach

8. Sales Process Quick Wins
   - Quick Win 15: Sales Email Template Library
     * Create templates for common scenarios
     * Timeline: Week 2-3
     * Impact: Faster response, consistency

   - Quick Win 16: Automated Follow-up Sequences
     * Set up 3-touch follow-up automation
     * Timeline: Week 4-5
     * Impact: Fewer dropped leads

   - Quick Win 17: Simple Lead Scoring
     * Basic scoring model in CRM
     * Timeline: Week 5-6
     * Impact: Better prioritization

9. Analytics & Tracking Quick Wins
   - Quick Win 18: Conversion Tracking Audit & Fix
     * Ensure all conversions properly tracked
     * Verify GA4 and pixel implementation
     * Timeline: Week 1
     * Impact: Better data for optimization

   - Quick Win 19: Weekly Dashboard Setup
     * Create automated reporting dashboard
     * Timeline: Week 2-3
     * Impact: Faster insights, better decisions

10. 90-Day Implementation Calendar
    - TABLE: Week | Quick Win | Owner | Resources Needed | Success Metric

    - Month 1 (Weeks 1-4): [List initiatives by week]
    - Month 2 (Weeks 5-8): [List initiatives by week]
    - Month 3 (Weeks 9-12): [List initiatives by week]

    - Weekly review checkpoints
    - Adjustment triggers (when to pivot)
    - Success metrics tracking
    - Celebration milestones

11. Resource Requirements
    - Team time allocation
    - Budget requirements (if any)
    - External resources or tools needed
    - Stakeholder involvement

12. Success Metrics & Reporting
    - Quick win scorecard
    - Weekly progress tracking
    - Impact measurement by initiative
    - Lessons learned documentation
    - What worked / what didn't
    - Insights for long-term strategy

FORMAT: Professional markdown with initiative tables and weekly calendar. 1500-1700 words.`,

    'scale-strategy': `Develop a Long-Term Scale Strategy for sustainable growth (12-24 months).

REQUIRED SECTIONS:
1. Scale Strategy Vision
   - Long-term vision for their business (2-3 years)
   - Growth targets based on their revenue goals
   - Market position objectives
   - How success is defined at scale

2. Growth Opportunity Analysis
   - Market Expansion Opportunities:
     * Geographic expansion (based on current targeting)
     * New customer segments beyond current ICP
     * Adjacent markets for their industry
     * Market size and potential

   - Product/Service Expansion:
     * New offerings aligned with customer needs
     * Service tier additions (premium, enterprise)
     * Productization opportunities

   - Channel Expansion:
     * New marketing channels to test
     * Strategic partnerships and alliances
     * Affiliate or referral programs

3. Scaling Foundations (Months 1-6)
   - Infrastructure Building:
     * Technology platform scalability
     * Process documentation and systemization
     * Data and analytics foundation
     * Quality assurance systems

   - Team Building:
     * Key hires needed (roles and timing)
     * Org structure for scale
     * Training and development programs
     * Culture and values reinforcement

   - Financial Foundation:
     * Funding requirements (if applicable)
     * Unit economics optimization
     * Cash flow management at scale
     * Profitability path

4. Marketing Scale Strategy
   - Channel Diversification & Expansion:
     * Current channels: Optimization for scale
     * New channels: Testing and validation roadmap
     * Budget scaling plan (from current to 12-24 months)
     * Multi-channel attribution and optimization

   - Content & SEO at Scale:
     * Content production scaling (volume & quality)
     * Topic cluster expansion strategy
     * Authority building and thought leadership
     * SEO market share targets

   - Brand Building:
     * Brand awareness campaigns
     * PR and media strategy
     * Industry positioning
     * Community building

5. Sales Scaling Strategy
   - Sales Model Evolution:
     * Current model maturation
     * Specialized roles (SDRs, AEs, CSMs)
     * Sales team structure and hiring plan
     * Compensation and incentive design

   - Sales Process Industrialization:
     * Playbook refinement and scaling
     * Sales enablement and training
     * Sales technology stack
     * Performance management

   - Pipeline Scaling:
     * Lead volume targets by quarter
     * Conversion rate improvements
     * Deal size expansion
     * Sales cycle reduction

6. Customer Success at Scale
   - Retention & Expansion Focus:
     * Churn reduction targets
     * Net Revenue Retention goals
     * Expansion revenue strategy
     * Customer lifetime value optimization

   - Scaled Customer Success Model:
     * Customer segmentation (high-touch vs. tech-touch)
     * Automated onboarding and education
     * Self-service resources and community
     * Health monitoring and intervention at scale

7. Operations & Technology Scaling
   - Technology Stack for Scale:
     * Platform scalability assessment
     * Marketing automation maturation
     * CRM and data warehouse
     * Business intelligence and analytics
     * Integration and API strategy

   - Process Automation:
     * Automation roadmap for scale
     * Workflow optimization
     * Reducing manual bottlenecks

   - Data Strategy:
     * Single source of truth
     * Data governance
     * Advanced analytics and AI/ML
     * Predictive modeling

8. Financial Scaling Model
   - Revenue Projections:
     * TABLE: Quarter | New Customers | Expansion Revenue | Churn | Total Revenue
     * Monthly projections for 24 months

   - Investment Requirements:
     * Marketing budget scaling path
     * Headcount plan and costs
     * Technology investments
     * Total funding needs and sources

   - Unit Economics at Scale:
     * CAC trends and targets
     * LTV expansion
     * Gross margin improvement
     * Path to profitability (if not profitable)

9. Milestone Roadmap (24 Months)
   - Q1 (Months 1-3):
     * Major initiatives
     * Key hires
     * Technology implementations
     * Revenue and customer targets

   - Q2 (Months 4-6):
     * Milestones and objectives

   - Q3 (Months 7-9):
     * Milestones and objectives

   - Q4 (Months 10-12):
     * Milestones and objectives

   - Year 2 (Months 13-24):
     * Quarterly milestones and objectives

   - Decision points and go/no-go criteria

10. Risk Management for Scale
    - Scaling Risks:
      * Quality dilution as you grow
      * Culture degradation with team growth
      * Cash flow challenges with rapid growth
      * Market saturation in core segment

    - Mitigation Strategies:
      * Quality assurance processes
      * Culture and values integration
      * Financial planning and runway management
      * Diversification strategies

    - Pivot Indicators:
      * Metrics that signal need to adjust strategy
      * Decision framework for pivots

11. Organizational Readiness
    - Leadership & Management:
      * Leadership team requirements
      * Management systems and cadence
      * Decision-making frameworks

    - Culture & Values:
      * Cultural values for scale
      * Communication strategies
      * Change management

    - Learning Organization:
      * Knowledge management
      * Continuous improvement culture
      * Innovation processes

12. Success Metrics & Tracking
    - North Star Metrics for Scale:
      * Primary growth metric
      * Secondary metrics (retention, expansion, efficiency)

    - Monthly/Quarterly Review Process:
      * Metrics review cadence
      * Strategy review and adjustment
      * Resource allocation decisions

    - Scaling Dashboard:
      * Key metrics to monitor
      * Leading vs. lagging indicators
      * Alert thresholds

FORMAT: Professional markdown with roadmap tables and financial projections. 1800-2000 words.`,
  };

  const systemPrompt = `You are a strategic marketing consultant creating detailed, client-specific strategy documents.

Generate a professional, comprehensive document that:
- Is tailored specifically to this client's industry, goals, and challenges
- Includes actionable recommendations and specific tactics
- Is well-structured with clear sections and headings
- Uses markdown formatting for readability
- Is 1000-1500 words
- Avoids generic advice and focuses on client-specific insights
- Includes specific examples and recommendations

Client Context:
${clientContext}

Document to create: ${DOCUMENT_TYPES[documentType]}

${prompts[documentType]}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Generate the ${DOCUMENT_TYPES[documentType]} document based on the client context provided.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return completion.choices[0]?.message?.content || "Failed to generate document content.";
}
