const { prisma } = require('./lib/prisma');
const { verifyPassword } = require('./lib/auth-utils');

async function testTechLaunchLogin() {
  const email = 'james@techlaunch.io';
  const password = 'SecureTech2024!';

  console.log('🔍 Testing TechLaunch Innovations login...\n');

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      client: true,
    },
  });

  console.log('User found:', user ? '✅ YES' : '❌ NO');

  if (user) {
    console.log('\n📧 User Details:');
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  User ID:', user.id);
    console.log('  Created:', user.createdAt);

    const isValid = await verifyPassword(password, user.passwordHash);
    console.log('\n🔐 Password valid:', isValid ? '✅ YES' : '❌ NO');

    if (user.client) {
      console.log('\n🏢 Client Profile:');
      console.log('  Company:', user.client.companyName);
      console.log('  Industry:', user.client.industry);
      console.log('  Client ID:', user.client.uniqueClientId);
      console.log('  Website:', user.client.websiteUrl);
      console.log('  Employee Count:', user.client.employeeCount);
      console.log('  Business Model:', user.client.businessModel);
      console.log('  Onboarding Completed:', user.client.onboardingCompleted ? '✅ YES' : '❌ NO');
      console.log('  Status:', user.client.status);

      console.log('\n🎯 Goals:');
      console.log('  Primary Goal:', user.client.primaryGoal);
      console.log('  Revenue Target:', user.client.revenueTarget);
      console.log('  Target CPA:', user.client.targetCpa);
      console.log('  Target ROAS:', user.client.targetRoas);

      console.log('\n💼 Marketing State:');
      console.log('  Worked with Agency:', user.client.workedWithAgency ? 'Yes' : 'No');
      const channels = JSON.parse(user.client.currentChannels || '[]');
      console.log('  Current Channels:', channels.join(', '));

      console.log('\n📊 Analytics:');
      console.log('  Google Analytics:', user.client.hasGoogleAnalytics);
      console.log('  Facebook Pixel:', user.client.hasFacebookPixel);
      const trackingTools = JSON.parse(user.client.trackingTools || '[]');
      console.log('  Tracking Tools:', trackingTools.join(', '));

      console.log('\n👥 Target Audience:');
      console.log('  ICP:', user.client.idealCustomerProfile);
      console.log('  Geographic:', user.client.geographicTargeting);
      console.log('  Age Range:', user.client.ageRange);

      console.log('\n💰 Budget:');
      console.log('  Monthly Budget:', user.client.monthlyBudgetRange);
    } else {
      console.log('\n❌ No client profile found!');
    }
  }

  await prisma.$disconnect();
}

testTechLaunchLogin().catch(console.error);
