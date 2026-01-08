'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 7;

  // Form data matching your API schema
  const [formData, setFormData] = useState({
    // Account
    email: '',
    password: '',
    // Step 1: Business Info
    companyName: '',
    industry: '',
    websiteUrl: '',
    companyDescription: '',
    employeeCount: '',
    businessModel: '',
    // Step 2: Marketing State
    workedWithAgency: false,
    currentChannels: [] as string[],
    marketingFeedback: '',
    primaryChallenges: [] as string[],
    // Step 3: Analytics
    hasGoogleAnalytics: '',
    hasFacebookPixel: '',
    trackingTools: [] as string[],
    canProvideAnalyticsAccess: '',
    analyticsNotes: '',
    // Step 4: Social & Platforms
    socialPlatforms: [] as string[],
    hasFbBusinessManager: '',
    hasGoogleAds: '',
    // Step 5: Goals
    primaryGoal: '',
    successDefinition: '',
    keyMetrics: [] as string[],
    revenueTarget: '',
    targetCpa: '',
    targetRoas: '',
    // Step 6: Audience
    idealCustomerProfile: '',
    geographicTargeting: '',
    ageRange: '',
    genderTargeting: '',
    competitors: [] as string[],
    competitorStrengths: '',
    // Step 7: Budget
    monthlyBudgetRange: '',
    hasCreativeAssets: false,
    hasMarketingContact: false,
    marketingContactName: '',
    marketingContactEmail: '',
  });

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Submit to API
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Onboarding completed! Your resources are being generated.');
        router.push('/dashboard');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to submit onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
          <div className="text-sm font-medium text-slate-500">Onboarding Wizard</div>
        </div>
        <div className="text-sm font-semibold text-indigo-600">
          Step {step} of {totalSteps}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-200 w-full">
        <div
          className="h-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8">
            {step === 1 && <StepBusinessInfo formData={formData} setFormData={setFormData} />}
            {step === 2 && <StepMarketingStatus formData={formData} setFormData={setFormData} />}
            {step === 3 && <StepAnalytics formData={formData} setFormData={setFormData} />}
            {step === 4 && <StepSocialMedia formData={formData} setFormData={setFormData} />}
            {step === 5 && <StepGoals formData={formData} setFormData={setFormData} />}
            {step === 6 && <StepAudience formData={formData} setFormData={setFormData} />}
            {step === 7 && <StepBudgetAndAccount formData={formData} setFormData={setFormData} />}
          </div>

          <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className={step === 1 ? 'invisible' : ''}
            >
              <ChevronLeft size={18} /> Back
            </Button>

            <Button onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : step === totalSteps ? 'Complete Onboarding' : 'Next Step'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function StepBusinessInfo({ formData, setFormData }: any) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Business Information</h2>
        <p className="text-slate-500 mt-1">Tell us about your company</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Company Name"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          placeholder="e.g. Acme Corp"
          className="md:col-span-2"
        />
        <Input
          label="Industry"
          value={formData.industry}
          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          placeholder="e.g. SaaS, E-commerce"
        />
        <Input
          label="Website URL"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
          placeholder="https://"
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Description</label>
          <textarea
            className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
            placeholder="What does your company do?"
            value={formData.companyDescription}
            onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
          ></textarea>
        </div>
      </div>
    </div>
  );
}

function StepMarketingStatus({ formData, setFormData }: any) {
  const toggleChallenge = (challenge: string) => {
    const challenges = formData.primaryChallenges.includes(challenge)
      ? formData.primaryChallenges.filter((c: string) => c !== challenge)
      : [...formData.primaryChallenges, challenge];
    setFormData({ ...formData, primaryChallenges: challenges });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Marketing Status</h2>
        <p className="text-slate-500 mt-1">Current marketing situation</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Have you worked with an agency before?
          </label>
          <div className="flex gap-4">
            <label className="flex-1 flex items-center justify-center gap-2 border p-3 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50">
              <input
                type="radio"
                checked={formData.workedWithAgency === true}
                onChange={() => setFormData({ ...formData, workedWithAgency: true })}
              />
              Yes
            </label>
            <label className="flex-1 flex items-center justify-center gap-2 border p-3 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50">
              <input
                type="radio"
                checked={formData.workedWithAgency === false}
                onChange={() => setFormData({ ...formData, workedWithAgency: false })}
              />
              No
            </label>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Primary Marketing Challenges
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['Lead generation', 'Attribution tracking', 'High CPA', 'Scaling campaigns'].map((challenge) => (
              <label key={challenge} className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.primaryChallenges.includes(challenge)}
                  onChange={() => toggleChallenge(challenge)}
                  className="rounded text-indigo-600"
                />
                <span className="text-sm">{challenge}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepAnalytics({ formData, setFormData }: any) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Analytics & Tracking</h2>
        <p className="text-slate-500 mt-1">Current tracking setup</p>
      </div>
      <div className="space-y-4">
        <Input
          label="Do you have Google Analytics?"
          value={formData.hasGoogleAnalytics}
          onChange={(e) => setFormData({ ...formData, hasGoogleAnalytics: e.target.value })}
          placeholder="yes/no"
        />
        <Input
          label="Do you have Facebook Pixel?"
          value={formData.hasFacebookPixel}
          onChange={(e) => setFormData({ ...formData, hasFacebookPixel: e.target.value })}
          placeholder="yes/no"
        />
      </div>
    </div>
  );
}

function StepSocialMedia({ formData, setFormData }: any) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Social Media & Platforms</h2>
        <p className="text-slate-500 mt-1">Where are you currently active?</p>
      </div>
      <div className="space-y-4">
        <Input
          label="Do you have Facebook Business Manager?"
          value={formData.hasFbBusinessManager}
          onChange={(e) => setFormData({ ...formData, hasFbBusinessManager: e.target.value })}
          placeholder="yes/no"
        />
        <Input
          label="Do you have Google Ads?"
          value={formData.hasGoogleAds}
          onChange={(e) => setFormData({ ...formData, hasGoogleAds: e.target.value })}
          placeholder="yes/no"
        />
      </div>
    </div>
  );
}

function StepGoals({ formData, setFormData }: any) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Goals & Objectives</h2>
        <p className="text-slate-500 mt-1">What does success look like?</p>
      </div>
      <div className="space-y-4">
        <Input
          label="Primary Goal"
          value={formData.primaryGoal}
          onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
          placeholder="e.g. Increase monthly leads by 20%"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Revenue Target"
            value={formData.revenueTarget}
            onChange={(e) => setFormData({ ...formData, revenueTarget: e.target.value })}
            placeholder="$1M"
          />
          <Input
            label="Target CPA"
            value={formData.targetCpa}
            onChange={(e) => setFormData({ ...formData, targetCpa: e.target.value })}
            placeholder="$50"
          />
        </div>
      </div>
    </div>
  );
}

function StepAudience({ formData, setFormData }: any) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Target Audience</h2>
        <p className="text-slate-500 mt-1">Who are we trying to reach?</p>
      </div>
      <div className="space-y-4">
        <Input
          label="Ideal Customer Profile"
          value={formData.idealCustomerProfile}
          onChange={(e) => setFormData({ ...formData, idealCustomerProfile: e.target.value })}
          placeholder="e.g. CTOs at mid-sized tech companies"
        />
        <Input
          label="Geographic Targeting"
          value={formData.geographicTargeting}
          onChange={(e) => setFormData({ ...formData, geographicTargeting: e.target.value })}
          placeholder="e.g. United States, Canada"
        />
      </div>
    </div>
  );
}

function StepBudgetAndAccount({ formData, setFormData }: any) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Budget & Create Account</h2>
        <p className="text-slate-500 mt-1">Final step</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Monthly Budget Range</label>
          <select
            className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            value={formData.monthlyBudgetRange}
            onChange={(e) => setFormData({ ...formData, monthlyBudgetRange: e.target.value })}
          >
            <option value="">Select budget range</option>
            <option value="$5,000-$10,000">$5,000-$10,000</option>
            <option value="$10,000-$20,000">$10,000-$20,000</option>
            <option value="$20,000+">$20,000+</option>
          </select>
        </div>

        <hr className="my-6" />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@company.com"
        />
        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
        />
      </div>
    </div>
  );
}
