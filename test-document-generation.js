const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The exact same functions from your API route
function buildClientContext(client) {
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

function parseJSON(value) {
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

async function testDocumentGeneration() {
  try {
    console.log('🔍 Fetching newly created client...\n');

    // Get the most recent client
    const client = await prisma.client.findFirst({
      where: {
        companyName: 'TechFlow Solutions'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!client) {
      console.error('❌ Client not found');
      return;
    }

    console.log(`✅ Found client: ${client.companyName}`);
    console.log(`📧 Email: ${client.uniqueClientId}\n`);

    // Build context
    const clientContext = buildClientContext(client);

    console.log('📝 CLIENT CONTEXT BEING SENT TO AI:\n');
    console.log('='.repeat(80));
    console.log(clientContext);
    console.log('='.repeat(80));
    console.log('\n🤖 Generating GTM Strategy document with OpenAI...\n');

    // Generate a sample document (GTM Strategy)
    const documentType = 'gtm-strategy';
    const prompt = `Create a comprehensive, consultant-grade Go-To-Market Strategy document.

REQUIRED SECTIONS:
1. Executive Summary (2-3 paragraphs)
2. Market Analysis & Segmentation
3. Positioning & Differentiation Strategy
4. Target Customer Profile Deep-Dive
5. Multi-Channel GTM Strategy
6. Launch Timeline & Phases
7. Success Metrics & KPIs
8. Risk Assessment & Mitigation

FORMAT: Professional markdown with tables, bullet points, and clear section headers. 1400-1600 words.`;

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

Document to create: Go-To-Market Strategy

${prompt}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate the Go-To-Market Strategy document based on the client context provided.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const documentContent = completion.choices[0]?.message?.content || "Failed to generate document content.";

    console.log('\n📄 GENERATED DOCUMENT:\n');
    console.log('='.repeat(80));
    console.log(documentContent);
    console.log('='.repeat(80));
    console.log(`\n✅ Document generated successfully!`);
    console.log(`📊 Word count: ~${documentContent.split(' ').length} words`);
    console.log(`📏 Character count: ${documentContent.length} characters`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDocumentGeneration();
