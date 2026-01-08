'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bot, FileText, Clipboard, MessageSquare, CheckCircle2, Sparkles,
  Target, Mail, Users, BarChart3, Megaphone, Copy, Download, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

function AIAgentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const agents = [
    {
      id: 'campaign-brief',
      name: 'Campaign Brief Generator',
      description: 'Generate comprehensive campaign briefs with strategy, tactics, and timelines',
      icon: FileText,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
      endpoint: '/api/ai-agents/campaign-brief',
    },
    {
      id: 'sop-drafter',
      name: 'SOP Drafter',
      description: 'Create detailed Standard Operating Procedures for any process',
      icon: Clipboard,
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600',
      endpoint: '/api/ai-agents/sop-drafter',
    },
    {
      id: 'content-assistant',
      name: 'Content & Messaging Assistant',
      description: 'Generate brand-aligned content and messaging for any channel',
      icon: MessageSquare,
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600',
      endpoint: '/api/ai-agents/content-assistant',
    },
    {
      id: 'qa-compliance',
      name: 'QA & Compliance Checker',
      description: 'Review content for quality, compliance, and brand alignment',
      icon: CheckCircle2,
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600',
      endpoint: '/api/ai-agents/qa-compliance',
    },
    {
      id: 'competitor-analyzer',
      name: 'Competitor Analyzer',
      description: 'SWOT analysis, market positioning, and competitive insights',
      icon: Target,
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600',
      endpoint: '/api/ai-agents/competitor-analyzer',
    },
    {
      id: 'email-sequence',
      name: 'Email Sequence Builder',
      description: 'Create complete email sequences with subject line variations',
      icon: Mail,
      color: 'bg-cyan-500',
      gradient: 'from-cyan-500 to-cyan-600',
      endpoint: '/api/ai-agents/email-sequence',
    },
    {
      id: 'persona-builder',
      name: 'Buyer Persona Generator',
      description: 'Create detailed buyer personas with journey mapping',
      icon: Users,
      color: 'bg-pink-500',
      gradient: 'from-pink-500 to-pink-600',
      endpoint: '/api/ai-agents/persona-builder',
    },
    {
      id: 'reporting-insights',
      name: 'Reporting & Insights',
      description: 'Generate executive summaries and performance reports',
      icon: BarChart3,
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-indigo-600',
      endpoint: '/api/ai-agents/reporting-insights',
    },
    {
      id: 'ad-creative',
      name: 'Ad Creative Generator',
      description: 'Platform-specific ad copy for Facebook, Google, LinkedIn',
      icon: Megaphone,
      color: 'bg-amber-500',
      gradient: 'from-amber-500 to-amber-600',
      endpoint: '/api/ai-agents/ad-creative',
    },
  ];

  useEffect(() => {
    const agentParam = searchParams.get('agent');
    if (agentParam && agents.find(a => a.id === agentParam)) {
      setSelectedAgent(agentParam);
    }
  }, [searchParams]);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    setResult(null);
  };

  const handleGenerate = async (agentId: string, data: any) => {
    setIsGenerating(true);
    try {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;

      const response = await fetch(agent.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setResult(result);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="w-[180px]"></div> {/* Spacer for balance */}
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mr-4">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Agents
              </h1>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Specialized AI assistants trained on your business context to accelerate your marketing
            </p>
          </div>
        </div>

        {/* Agent Grid */}
        {!selectedAgent && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left group overflow-hidden"
                >
                  <div className={`h-2 bg-gradient-to-r ${agent.gradient}`} />
                  <div className="p-6">
                    <div className="flex items-start">
                      <div className={`${agent.color} rounded-xl p-3 mr-4 shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                          {agent.name}
                        </h3>
                        <p className="text-sm text-slate-500">{agent.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-indigo-600 font-medium text-sm">
                      <span>Launch Agent</span>
                      <Sparkles className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Agent Interface */}
        {selectedAgent && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Agent Header */}
            {(() => {
              const agent = agents.find((a) => a.id === selectedAgent);
              if (!agent) return null;
              const Icon = agent.icon;
              return (
                <>
                  <div className={`h-2 bg-gradient-to-r ${agent.gradient}`} />
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`${agent.color} rounded-xl p-3 mr-4 shadow-md`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">{agent.name}</h2>
                          <p className="text-slate-500">{agent.description}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedAgent(null);
                          setResult(null);
                        }}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}

            <div className="p-6">
              <AgentForm
                agentId={selectedAgent}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                result={result}
                onCopy={copyToClipboard}
                onDownload={downloadAsMarkdown}
                copied={copied}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Agent Form Component
function AgentForm({
  agentId,
  onGenerate,
  isGenerating,
  result,
  onCopy,
  onDownload,
  copied,
}: {
  agentId: string;
  onGenerate: (agentId: string, data: any) => void;
  isGenerating: boolean;
  result: any;
  onCopy: (text: string) => void;
  onDownload: (content: string, filename: string) => void;
  copied: boolean;
}) {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(agentId, formData);
  };

  const getResultContent = () => {
    if (!result) return null;
    return result.brief || result.sop || result.content || result.analysis ||
      result.sequence || result.personas || result.report || result.adCreative ||
      JSON.stringify(result, null, 2);
  };

  const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Brief Form */}
        {agentId === 'campaign-brief' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Campaign Type</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="Product Launch">Product Launch</option>
                <option value="Brand Awareness">Brand Awareness</option>
                <option value="Lead Generation">Lead Generation</option>
                <option value="Retargeting">Retargeting</option>
                <option value="Seasonal/Promotional">Seasonal/Promotional</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Budget</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., $5,000/month"
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Campaign Goal</label>
              <input
                type="text"
                className={inputClass}
                placeholder="What do you want to achieve?"
                onChange={(e) => setFormData({ ...formData, campaignGoal: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Target Audience</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Who are you targeting?"
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Timeline</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., 4 weeks, Q1 2024"
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Additional Notes</label>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Any specific requirements or context..."
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* SOP Drafter Form */}
        {agentId === 'sop-drafter' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Process Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., Client Onboarding, Campaign Setup"
                onChange={(e) => setFormData({ ...formData, processName: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Process Owner</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Who is responsible?"
                onChange={(e) => setFormData({ ...formData, processOwner: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>SOP Type</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, sopType: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="Marketing Operations">Marketing Operations</option>
                <option value="Campaign Management">Campaign Management</option>
                <option value="Client Management">Client Management</option>
                <option value="Reporting & Analytics">Reporting & Analytics</option>
                <option value="Content Production">Content Production</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Frequency</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              >
                <option value="">Select frequency...</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="As Needed">As Needed</option>
                <option value="Per Project">Per Project</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Tools Used</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., Google Ads, Facebook Business Manager, HubSpot"
                onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Additional Context</label>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Describe the process, key steps, pain points..."
                onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Content Assistant Form */}
        {agentId === 'content-assistant' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Content Type</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="Blog Post">Blog Post</option>
                <option value="Social Media Post">Social Media Post</option>
                <option value="Email">Email</option>
                <option value="Ad Copy">Ad Copy</option>
                <option value="Landing Page">Landing Page Copy</option>
                <option value="Video Script">Video Script</option>
                <option value="Press Release">Press Release</option>
                <option value="Case Study">Case Study</option>
                <option value="Newsletter">Newsletter</option>
                <option value="Whitepaper">Whitepaper</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tone</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              >
                <option value="">Select tone...</option>
                <option value="Professional">Professional</option>
                <option value="Casual">Casual</option>
                <option value="Friendly">Friendly</option>
                <option value="Authoritative">Authoritative</option>
                <option value="Playful">Playful</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Topic</label>
              <input
                type="text"
                className={inputClass}
                placeholder="What is this content about?"
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Length</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
              >
                <option value="">Select length...</option>
                <option value="Short (< 300 words)">Short (&lt; 300 words)</option>
                <option value="Medium (300-800 words)">Medium (300-800 words)</option>
                <option value="Long (800+ words)">Long (800+ words)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Call to Action</label>
              <input
                type="text"
                className={inputClass}
                placeholder="What action should readers take?"
                onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Keywords (SEO)</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Comma-separated keywords to include"
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Additional Guidelines</label>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Any specific requirements..."
                onChange={(e) => setFormData({ ...formData, additionalGuidelines: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* QA Compliance Form */}
        {agentId === 'qa-compliance' && (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Content to Review</label>
              <textarea
                rows={8}
                className={inputClass}
                placeholder="Paste the content you want to review..."
                required
                onChange={(e) => setFormData({ ...formData, contentToReview: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Platform</label>
                <select
                  className={inputClass}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                >
                  <option value="">Select platform...</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="google-ads">Google Ads</option>
                  <option value="tiktok">TikTok</option>
                  <option value="email">Email</option>
                  <option value="website">Website</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Review Type</label>
                <select
                  className={inputClass}
                  onChange={(e) => setFormData({ ...formData, reviewType: e.target.value })}
                >
                  <option value="">Select type...</option>
                  <option value="Ad Copy">Ad Copy</option>
                  <option value="Social Post">Social Post</option>
                  <option value="Email">Email</option>
                  <option value="Landing Page">Landing Page</option>
                  <option value="Blog Post">Blog Post</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Additional Criteria</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Any specific compliance requirements..."
                onChange={(e) => setFormData({ ...formData, additionalCriteria: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Competitor Analyzer Form */}
        {agentId === 'competitor-analyzer' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Competitors to Analyze</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., Competitor A, Competitor B, Competitor C"
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Analysis Type</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, analysisType: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="Comprehensive">Comprehensive Analysis</option>
                <option value="SWOT Only">SWOT Analysis Only</option>
                <option value="Marketing Focus">Marketing Strategy Focus</option>
                <option value="Pricing Focus">Pricing & Positioning Focus</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Focus Areas</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, focusAreas: [e.target.value] })}
              >
                <option value="">Select focus...</option>
                <option value="Messaging">Messaging & Positioning</option>
                <option value="Channels">Marketing Channels</option>
                <option value="Content">Content Strategy</option>
                <option value="Pricing">Pricing Strategy</option>
                <option value="Product">Product Features</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Additional Context</label>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Any specific insights you're looking for..."
                onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Email Sequence Form */}
        {agentId === 'email-sequence' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Sequence Type</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, sequenceType: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="Welcome">Welcome Sequence</option>
                <option value="Nurture">Lead Nurture</option>
                <option value="Onboarding">Customer Onboarding</option>
                <option value="Re-engagement">Re-engagement</option>
                <option value="Promotional">Promotional/Sales</option>
                <option value="Educational">Educational Series</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Number of Emails</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, numberOfEmails: parseInt(e.target.value) })}
              >
                <option value="3">3 emails</option>
                <option value="5">5 emails</option>
                <option value="7">7 emails</option>
                <option value="10">10 emails</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Sequence Goal</label>
              <input
                type="text"
                className={inputClass}
                placeholder="What should this sequence achieve?"
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Tone</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              >
                <option value="">Select tone...</option>
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Casual">Casual</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="flex items-center pt-8">
              <input
                type="checkbox"
                id="subjectVariations"
                className="w-4 h-4 text-indigo-600 rounded"
                defaultChecked
                onChange={(e) => setFormData({ ...formData, includeSubjectVariations: e.target.checked })}
              />
              <label htmlFor="subjectVariations" className="ml-2 text-sm text-slate-700">
                Include subject line A/B variations
              </label>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Additional Context</label>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Product details, offers, specific messaging..."
                onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Persona Builder Form */}
        {agentId === 'persona-builder' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Number of Personas</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, numberOfPersonas: parseInt(e.target.value) })}
              >
                <option value="1">1 persona</option>
                <option value="2">2 personas</option>
                <option value="3">3 personas</option>
                <option value="4">4 personas</option>
              </select>
            </div>
            <div className="flex items-center pt-8">
              <input
                type="checkbox"
                id="negativePersona"
                className="w-4 h-4 text-indigo-600 rounded"
                onChange={(e) => setFormData({ ...formData, includeNegativePersona: e.target.checked })}
              />
              <label htmlFor="negativePersona" className="ml-2 text-sm text-slate-700">
                Include negative persona (who NOT to target)
              </label>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Focus Segment</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., Enterprise decision makers, SMB owners..."
                onChange={(e) => setFormData({ ...formData, focusSegment: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Additional Context</label>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="What do you know about your customers already?"
                onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Reporting Insights Form */}
        {agentId === 'reporting-insights' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Report Type</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="Marketing Performance">Marketing Performance</option>
                <option value="Campaign Analysis">Campaign Analysis</option>
                <option value="Channel Performance">Channel Performance</option>
                <option value="Executive Summary">Executive Summary</option>
                <option value="Quarterly Review">Quarterly Review</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Time Period</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, timePeriod: e.target.value })}
              >
                <option value="">Select period...</option>
                <option value="Last Week">Last Week</option>
                <option value="Last Month">Last Month</option>
                <option value="Last Quarter">Last Quarter</option>
                <option value="Year to Date">Year to Date</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Audience</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              >
                <option value="">Select audience...</option>
                <option value="Executive/C-Suite">Executive/C-Suite</option>
                <option value="Marketing Team">Marketing Team</option>
                <option value="Client">Client</option>
                <option value="Board">Board/Investors</option>
              </select>
            </div>
            <div className="flex items-center pt-8">
              <input
                type="checkbox"
                id="recommendations"
                className="w-4 h-4 text-indigo-600 rounded"
                defaultChecked
                onChange={(e) => setFormData({ ...formData, includeRecommendations: e.target.checked })}
              />
              <label htmlFor="recommendations" className="ml-2 text-sm text-slate-700">
                Include recommendations
              </label>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Metrics Data (Optional)</label>
              <textarea
                rows={4}
                className={inputClass}
                placeholder="Paste any metrics or data you want to include..."
                onChange={(e) => setFormData({ ...formData, metricsData: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Ad Creative Form */}
        {agentId === 'ad-creative' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Platform</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                <option value="">Select platform...</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="google-search">Google Search</option>
                <option value="google-display">Google Display</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Ad Type</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, adType: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="Image Ad">Image Ad</option>
                <option value="Video Ad">Video Ad</option>
                <option value="Carousel">Carousel</option>
                <option value="Stories">Stories</option>
                <option value="Text Ad">Text Ad</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Objective</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              >
                <option value="">Select objective...</option>
                <option value="Awareness">Awareness</option>
                <option value="Consideration">Consideration</option>
                <option value="Conversions">Conversions</option>
                <option value="Lead Generation">Lead Generation</option>
                <option value="Traffic">Traffic</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Number of Variations</label>
              <select
                className={inputClass}
                onChange={(e) => setFormData({ ...formData, numberOfVariations: parseInt(e.target.value) })}
              >
                <option value="3">3 variations</option>
                <option value="5">5 variations</option>
                <option value="7">7 variations</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Product/Service</label>
              <input
                type="text"
                className={inputClass}
                placeholder="What are you advertising?"
                onChange={(e) => setFormData({ ...formData, productService: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Special Offer (Optional)</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g., 20% off, Free trial, Limited time"
                onChange={(e) => setFormData({ ...formData, offer: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Additional Context</label>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Landing page URL, specific messaging to include..."
                onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isGenerating}
          className="w-full py-4 text-lg font-semibold"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate
            </span>
          )}
        </Button>
      </form>

      {/* Result Display */}
      {result && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">Generated Result</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onCopy(getResultContent())}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onDownload(getResultContent(), `${agentId}-output`)}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
            {agentId === 'qa-compliance' ? (
              <QAResultDisplay result={result.review} />
            ) : (
              <div className="prose prose-slate max-w-none">
                <MarkdownRenderer content={getResultContent()} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Markdown Renderer
function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Basic markdown rendering
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeLanguage = '';

  lines.forEach((line, index) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="bg-slate-800 text-slate-100 p-4 rounded-lg overflow-x-auto my-4">
            <code>{codeContent}</code>
          </pre>
        );
        codeContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLanguage = line.slice(3);
      }
      return;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      return;
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-2xl font-bold text-slate-900 mt-6 mb-4">{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-xl font-bold text-slate-800 mt-5 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-lg font-semibold text-slate-700 mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('#### ')) {
      elements.push(<h4 key={index} className="text-base font-semibold text-slate-700 mt-3 mb-2">{line.slice(5)}</h4>);
    }
    // Horizontal rules
    else if (line.startsWith('---')) {
      elements.push(<hr key={index} className="my-6 border-slate-200" />);
    }
    // Lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={index} className="ml-4 text-slate-700 my-1">
          {formatInlineMarkdown(line.slice(2))}
        </li>
      );
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '');
      elements.push(
        <li key={index} className="ml-4 text-slate-700 my-1 list-decimal">
          {formatInlineMarkdown(content)}
        </li>
      );
    }
    // Tables
    else if (line.startsWith('|')) {
      elements.push(
        <div key={index} className="overflow-x-auto my-2">
          <span className="font-mono text-sm text-slate-600">{line}</span>
        </div>
      );
    }
    // Regular paragraphs
    else if (line.trim()) {
      elements.push(
        <p key={index} className="text-slate-700 my-2">
          {formatInlineMarkdown(line)}
        </p>
      );
    }
  });

  return <div className="space-y-1">{elements}</div>;
}

// Format inline markdown (bold, italic, etc.)
function formatInlineMarkdown(text: string): React.ReactNode {
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code
  text = text.replace(/`(.*?)`/g, '<code class="bg-slate-200 px-1 rounded text-sm">$1</code>');

  return <span dangerouslySetInnerHTML={{ __html: text }} />;
}

// QA Result Display Component
function QAResultDisplay({ result }: { result: any }) {
  if (!result) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-100';
      case 'conditional_pass':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'fail':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
        <div>
          <h4 className="text-2xl font-bold text-slate-900">Score: {result.overallScore}/10</h4>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(result.status)}`}>
            {result.status?.toUpperCase().replace('_', ' ')}
          </span>
        </div>
        {result.compliance && (
          <div className="flex gap-4">
            <div className="text-center">
              <span className={`block text-xs uppercase ${getStatusColor(result.compliance.legal)}`}>Legal</span>
            </div>
            <div className="text-center">
              <span className={`block text-xs uppercase ${getStatusColor(result.compliance.platform)}`}>Platform</span>
            </div>
            <div className="text-center">
              <span className={`block text-xs uppercase ${getStatusColor(result.compliance.brand)}`}>Brand</span>
            </div>
          </div>
        )}
      </div>

      {result.summary && (
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h5 className="font-bold mb-2 text-slate-900">Summary</h5>
          <p className="text-slate-700">{result.summary}</p>
        </div>
      )}

      {result.criticalIssues && result.criticalIssues.length > 0 && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <h5 className="font-bold text-red-700 mb-3">🚨 Critical Issues</h5>
          <ul className="space-y-2">
            {result.criticalIssues.map((issue: string, i: number) => (
              <li key={i} className="text-red-700 flex items-start">
                <span className="mr-2">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <h5 className="font-bold text-yellow-700 mb-3">⚠️ Recommendations</h5>
          <ul className="space-y-2">
            {result.recommendations.map((rec: string, i: number) => (
              <li key={i} className="text-yellow-700 flex items-start">
                <span className="mr-2">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.suggestions && result.suggestions.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h5 className="font-bold text-blue-700 mb-3">💡 Suggestions</h5>
          <ul className="space-y-2">
            {result.suggestions.map((sug: string, i: number) => (
              <li key={i} className="text-blue-700 flex items-start">
                <span className="mr-2">•</span>
                {sug}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.edits && result.edits.length > 0 && (
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h5 className="font-bold mb-4 text-slate-900">✏️ Suggested Edits</h5>
          <div className="space-y-4">
            {result.edits.map((edit: any, i: number) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900 mb-3">{edit.issue}</p>
                {edit.before && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-red-600 uppercase">Before:</span>
                    <p className="text-sm bg-red-50 p-3 rounded mt-1 text-red-800">{edit.before}</p>
                  </div>
                )}
                {edit.after && (
                  <div>
                    <span className="text-xs font-semibold text-green-600 uppercase">After:</span>
                    <p className="text-sm bg-green-50 p-3 rounded mt-1 text-green-800">{edit.after}</p>
                  </div>
                )}
                {edit.rationale && (
                  <p className="text-xs text-slate-500 mt-2 italic">{edit.rationale}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIAgentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading AI Agents...</p>
        </div>
      </div>
    }>
      <AIAgentsContent />
    </Suspense>
  );
}
