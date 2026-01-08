'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, FileText, Clipboard, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AIAgentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const agents = [
    {
      id: 'campaign-brief',
      name: 'Campaign Brief Generator',
      description: 'Generate comprehensive campaign briefs with strategy, tactics, and timelines',
      icon: FileText,
      color: 'bg-blue-500',
      endpoint: '/api/ai-agents/campaign-brief',
    },
    {
      id: 'sop-drafter',
      name: 'SOP Drafter',
      description: 'Create detailed Standard Operating Procedures for any process',
      icon: Clipboard,
      color: 'bg-purple-500',
      endpoint: '/api/ai-agents/sop-drafter',
    },
    {
      id: 'content-assistant',
      name: 'Content & Messaging Assistant',
      description: 'Generate brand-aligned content and messaging for any channel',
      icon: MessageSquare,
      color: 'bg-green-500',
      endpoint: '/api/ai-agents/content-assistant',
    },
    {
      id: 'qa-compliance',
      name: 'QA & Compliance Checker',
      description: 'Review content for quality, compliance, and brand alignment',
      icon: CheckCircle2,
      color: 'bg-orange-500',
      endpoint: '/api/ai-agents/qa-compliance',
    },
  ];

  // Check for pre-selected agent from URL parameter
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Bot className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-900">AI Agents</h1>
          </div>
          <p className="text-lg text-slate-600">
            Specialized AI assistants trained on your business context
          </p>
        </div>

        {/* Agent Grid */}
        {!selectedAgent && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 text-left group"
                >
                  <div className="flex items-start">
                    <div className={`${agent.color} rounded-lg p-3 mr-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-slate-600">{agent.description}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center text-indigo-600 font-medium">
                    <span>Launch Agent</span>
                    <Sparkles className="w-4 h-4 ml-2" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Agent Interface */}
        {selectedAgent && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                {(() => {
                  const agent = agents.find((a) => a.id === selectedAgent);
                  if (!agent) return null;
                  const Icon = agent.icon;
                  return (
                    <>
                      <div className={`${agent.color} rounded-lg p-3 mr-4`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{agent.name}</h2>
                        <p className="text-slate-600">{agent.description}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <Button
                onClick={() => {
                  setSelectedAgent(null);
                  setResult(null);
                }}
                variant="outline"
              >
                Back
              </Button>
            </div>

            {/* Agent-specific forms go here */}
            <AgentForm
              agentId={selectedAgent}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              result={result}
            />
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
}: {
  agentId: string;
  onGenerate: (agentId: string, data: any) => void;
  isGenerating: boolean;
  result: any;
}) {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(agentId, formData);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Brief Form */}
        {agentId === 'campaign-brief' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Campaign Type
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Product Launch, Brand Awareness, Lead Generation"
                onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Campaign Goal
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="What do you want to achieve?"
                onChange={(e) => setFormData({ ...formData, campaignGoal: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Notes
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Any specific requirements or context..."
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              />
            </div>
          </>
        )}

        {/* SOP Drafter Form */}
        {agentId === 'sop-drafter' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Process Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Client Onboarding, Campaign Setup, Monthly Reporting"
                onChange={(e) => setFormData({ ...formData, processName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Process Owner
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Who is responsible?"
                onChange={(e) => setFormData({ ...formData, processOwner: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Context
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe the process, key steps, tools used..."
                onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
              />
            </div>
          </>
        )}

        {/* Content Assistant Form */}
        {agentId === 'content-assistant' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Content Type
              </label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="blog-post">Blog Post</option>
                <option value="social-media">Social Media Post</option>
                <option value="email">Email</option>
                <option value="ad-copy">Ad Copy</option>
                <option value="landing-page">Landing Page Copy</option>
                <option value="video-script">Video Script</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Topic
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="What is this content about?"
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Guidelines
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Tone, keywords, CTAs, length requirements..."
                onChange={(e) => setFormData({ ...formData, additionalGuidelines: e.target.value })}
              />
            </div>
          </>
        )}

        {/* QA Compliance Form */}
        {agentId === 'qa-compliance' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Content to Review
              </label>
              <textarea
                rows={8}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Paste the content you want to review..."
                required
                onChange={(e) => setFormData({ ...formData, contentToReview: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Platform
              </label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                <option value="">Select platform...</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="google-ads">Google Ads</option>
                <option value="email">Email</option>
                <option value="website">Website</option>
              </select>
            </div>
          </>
        )}

        <Button
          type="submit"
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </form>

      {/* Result Display */}
      {result && (
        <div className="mt-8 p-6 bg-slate-50 rounded-lg">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Result</h3>
          <div className="prose max-w-none">
            {agentId === 'qa-compliance' ? (
              <QAResultDisplay result={result.review} />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-slate-700">
                {result.brief || result.sop || result.content || JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// QA Result Display Component
function QAResultDisplay({ result }: { result: any }) {
  if (!result) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'fail':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold">Overall Score: {result.overallScore}/10</h4>
          <p className={`text-sm font-medium ${getStatusColor(result.status)}`}>
            Status: {result.status?.toUpperCase()}
          </p>
        </div>
      </div>

      {result.summary && (
        <div>
          <h5 className="font-bold mb-2">Summary</h5>
          <p className="text-sm text-slate-700">{result.summary}</p>
        </div>
      )}

      {result.criticalIssues && result.criticalIssues.length > 0 && (
        <div>
          <h5 className="font-bold text-red-600 mb-2">Critical Issues</h5>
          <ul className="list-disc list-inside text-sm text-slate-700">
            {result.criticalIssues.map((issue: string, i: number) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <div>
          <h5 className="font-bold text-yellow-600 mb-2">Recommendations</h5>
          <ul className="list-disc list-inside text-sm text-slate-700">
            {result.recommendations.map((rec: string, i: number) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {result.edits && result.edits.length > 0 && (
        <div>
          <h5 className="font-bold mb-2">Suggested Edits</h5>
          {result.edits.map((edit: any, i: number) => (
            <div key={i} className="mb-4 p-4 bg-white rounded-lg">
              <p className="font-medium text-sm mb-2">{edit.issue}</p>
              {edit.before && (
                <div className="mb-2">
                  <span className="text-xs text-slate-500">Before:</span>
                  <p className="text-sm bg-red-50 p-2 rounded">{edit.before}</p>
                </div>
              )}
              {edit.after && (
                <div>
                  <span className="text-xs text-slate-500">After:</span>
                  <p className="text-sm bg-green-50 p-2 rounded">{edit.after}</p>
                </div>
              )}
              {edit.rationale && (
                <p className="text-xs text-slate-600 mt-2 italic">{edit.rationale}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
