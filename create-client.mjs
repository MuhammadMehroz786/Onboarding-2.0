import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createClient() {
  // Client credentials
  const email = 'client@fitnesspro.com';
  const password = 'Client123!';

  // Client business info - using only fields from schema
  const clientData = {
    // Step 1: Business Fundamentals
    companyName: 'FitnessPro Studios',
    industry: 'Fitness & Wellness',
    websiteUrl: 'https://www.fitnesspro.com',
    companyDescription: 'Premium fitness studio offering personal training and group classes',
    employeeCount: '10-25',
    businessModel: 'B2C',

    // Step 2: Marketing State
    workedWithAgency: false,
    currentChannels: JSON.stringify(['Social Media', 'Email Marketing']),
    marketingFeedback: 'Looking to improve online presence',
    primaryChallenges: 'Reaching target demographic effectively',

    // Step 3: Analytics & Tracking
    hasGoogleAnalytics: 'yes',
    hasFacebookPixel: 'no',
    canProvideAnalyticsAccess: 'yes',

    // Step 4: Social Media & Platforms
    socialPlatforms: JSON.stringify(['Instagram', 'Facebook']),
    hasFbBusinessManager: 'yes',
    hasGoogleAds: 'no',

    // Step 5: Goals & Objectives
    primaryGoal: 'Increase membership signups by 50%',
    successDefinition: 'Double monthly membership signups within 6 months',
    keyMetrics: JSON.stringify(['Conversion Rate', 'Cost Per Acquisition', 'Member Retention']),
    revenueTarget: '$500,000 annually',
    targetCpa: '$50',
    targetRoas: '4:1',

    // Step 6: Audience & Competitors
    idealCustomerProfile: 'Health-conscious professionals aged 25-45',
    geographicTargeting: 'Local - San Francisco Bay Area',
    ageRange: '25-45',
    genderTargeting: 'All',
    competitors: 'Equinox, 24 Hour Fitness, Local boutique studios',
    competitorStrengths: 'Established brands with larger facilities',

    // Step 7: Budget & Resources
    monthlyBudgetRange: '$5,000 - $10,000',
    hasCreativeAssets: true,
    hasMarketingContact: true,
    marketingContactName: 'Sarah Johnson',
    marketingContactEmail: 'sarah@fitnesspro.com',

    // Status
    status: 'active',
    onboardingCompleted: true,
    onboardingCompletedAt: new Date(),
  };

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ User with this email already exists');
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and client in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'client'
        }
      });

      // Generate unique client ID
      const uniqueClientId = `CL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create client profile
      const client = await tx.client.create({
        data: {
          userId: user.id,
          uniqueClientId,
          ...clientData
        }
      });

      return { user, client };
    });

    console.log('✅ Client registered successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('');
    console.log('Client Details:');
    console.log('Company:', clientData.companyName);
    console.log('Industry:', clientData.industry);
    console.log('Client ID:', result.client.uniqueClientId);

  } catch (error) {
    console.error('❌ Error creating client:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createClient();
