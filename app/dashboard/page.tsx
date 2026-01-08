'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExternalLink, FileText, List, CheckCircle, Clock, AlertCircle, LogOut, Sparkles, X, Bot, Clipboard, MessageSquare, CheckCircle2, Target, Mail, Users, BarChart3, Megaphone } from 'lucide-react';
import SupportChatbot from '@/components/SupportChatbot';

interface ClientLink {
  id: string;
  linkType: string;
  title: string;
  url: string;
  description?: string;
  createdAt: string;
}

interface ClientData {
  id: string;
  uniqueClientId: string;
  companyName: string;
  industry: string;
  websiteUrl?: string;
  status: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  email: string;
  createdAt: string;
}

// Available documents that can be generated
const AVAILABLE_DOCUMENTS = [
  { id: 'gtm-strategy', title: 'Go-To-Market Strategy', icon: '🚀' },
  { id: 'positioning', title: 'Offer & Positioning Framework', icon: '🎯' },
  { id: 'messaging', title: 'Messaging & Value Proposition', icon: '💬' },
  { id: 'funnel-strategy', title: 'Funnel & Conversion Strategy', icon: '📊' },
  { id: 'content-strategy', title: 'Content Strategy', icon: '✍️' },
  { id: 'paid-ads', title: 'Paid Ads Strategy', icon: '💰' },
  { id: 'seo-strategy', title: 'SEO / Organic Growth Plan', icon: '🔍' },
  { id: 'crm-design', title: 'CRM & RevOps Design', icon: '⚙️' },
  { id: 'client-success', title: 'Client Success & Retention Plan', icon: '🤝' },
  { id: 'kpi-framework', title: 'Reporting & KPI Framework', icon: '📈' },
  { id: 'risk-mitigation', title: 'Risk Mitigation & Constraints Map', icon: '🛡️' },
  { id: 'tool-optimization', title: 'Tool Stack Optimization Plan', icon: '🔧' },
  { id: 'automation-map', title: 'Automation Opportunities Map', icon: '🤖' },
  { id: 'quick-wins', title: 'Short-Term Quick Wins (30–90 days)', icon: '⚡' },
  { id: 'scale-strategy', title: 'Long-Term Scale Strategy', icon: '📡' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [links, setLinks] = useState<ClientLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Document generation state
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      // Redirect admins to the admin dashboard
      if (session?.user?.role === 'admin') {
        router.push('/admin');
        return;
      }
      fetchClientData();
    }
  }, [status, session, router]);

  const fetchClientData = async () => {
    try {
      const response = await fetch('/api/client/me');

      if (!response.ok) {
        throw new Error('Failed to fetch client data');
      }

      const data = await response.json();
      setClientData(data.client);
      setLinks(data.links);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const icons = {
      pending: <Clock className="w-4 h-4" />,
      active: <CheckCircle className="w-4 h-4" />,
      inactive: <AlertCircle className="w-4 h-4" />,
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {icons[status as keyof typeof icons] || icons.inactive}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getLinkIcon = (linkType: string) => {
    if (linkType === 'clickup_list') return <List className="w-5 h-5 text-purple-600" />;
    if (linkType === 'google_doc') return <FileText className="w-5 h-5 text-blue-600" />;
    return <ExternalLink className="w-5 h-5 text-slate-600" />;
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const generateDocument = async (documentType: string, title: string) => {
    setGeneratingDoc(documentType);
    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentType }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const data = await response.json();
      setGeneratedDocument({
        title: data.document.title,
        content: data.document.content,
      });
      setShowDocumentModal(true);
    } catch (err) {
      console.error('Document generation error:', err);
      alert('Failed to generate document. Please try again.');
    } finally {
      setGeneratingDoc(null);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card>
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/')}>Go to Home</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!clientData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Client Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Welcome back, {clientData.companyName}</p>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Info Card */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">{clientData.companyName}</h2>
                <div className="space-y-1 text-sm text-slate-600">
                  <p><span className="font-medium">Industry:</span> {clientData.industry}</p>
                  <p><span className="font-medium">Email:</span> {clientData.email}</p>
                  {clientData.websiteUrl && (
                    <p>
                      <span className="font-medium">Website:</span>{' '}
                      <a href={clientData.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        {clientData.websiteUrl}
                      </a>
                    </p>
                  )}
                  <p><span className="font-medium">Client ID:</span> {clientData.uniqueClientId}</p>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(clientData.status)}
                <p className="text-xs text-slate-500 mt-2">
                  Member since {new Date(clientData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {clientData.onboardingCompleted && clientData.onboardingCompletedAt && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <p className="font-medium">
                    Onboarding completed on {new Date(clientData.onboardingCompletedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Generated Resources */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Generated Resources</h2>

          {clientData.status === 'pending' && links.length === 0 && (
            <Card>
              <div className="p-8 text-center">
                <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Preparing Your Documents</h3>
                <p className="text-slate-600 mb-4">
                  Your onboarding was successful! We're now creating your personalized marketing resources.
                </p>
                <p className="text-sm text-slate-500">
                  This typically takes 2-3 minutes. Your documents will appear here automatically once ready.
                </p>
                <Button variant="secondary" onClick={fetchClientData} className="mt-6">
                  Refresh Status
                </Button>
              </div>
            </Card>
          )}

          {links.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <Card key={link.id} className="hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      {getLinkIcon(link.linkType)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1 truncate">{link.title}</h3>
                        {link.description && (
                          <p className="text-sm text-slate-600 mb-3">{link.description}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          Created {new Date(link.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="primary" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Resource
                      </Button>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {clientData.status === 'active' && links.length === 0 && (
            <Card>
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Resources Yet</h3>
                <p className="text-slate-600">
                  Your resources haven't been generated yet. Please contact support if you've been waiting for more than 5 minutes.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Generate Additional Documents */}
        {links.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">Generate Additional Strategy Documents</h2>
            </div>
            <Card>
              <div className="p-6">
                <p className="text-slate-600 mb-6">
                  Click any button below to instantly generate a personalized strategy document using AI.
                </p>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {AVAILABLE_DOCUMENTS.map((doc) => (
                    <Button
                      key={doc.id}
                      variant="secondary"
                      onClick={() => generateDocument(doc.id, doc.title)}
                      disabled={generatingDoc !== null}
                      className="w-full text-left justify-start"
                    >
                      <span className="mr-2">{doc.icon}</span>
                      <span className="flex-1">{doc.title}</span>
                      {generatingDoc === doc.id && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 ml-2"></div>
                      )}
                    </Button>
                  ))}
                </div>
                {generatingDoc && (
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center gap-2 text-indigo-800">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      <p className="text-sm font-medium">Generating your personalized document... This may take 20-30 seconds.</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* AI Agents */}
        {links.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">AI Agents</h2>
            </div>
            <Card>
              <div className="p-6">
                <p className="text-slate-600 mb-6">
                  Specialized AI assistants trained on your business context to help with ongoing marketing tasks.
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Campaign Brief Generator */}
                  <button
                    onClick={() => router.push('/ai-agents?agent=campaign-brief')}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left border border-blue-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 rounded-lg p-2.5">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">Campaign Brief Generator</h3>
                        <p className="text-xs text-slate-600 mb-2">Generate campaign briefs with strategy & timelines</p>
                        <div className="flex items-center text-blue-600 font-medium text-xs">
                          <span>Launch Agent</span>
                          <Sparkles className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* SOP Drafter */}
                  <button
                    onClick={() => router.push('/ai-agents?agent=sop-drafter')}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left border border-purple-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-500 rounded-lg p-2.5">
                        <Clipboard className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">SOP Drafter</h3>
                        <p className="text-xs text-slate-600 mb-2">Create detailed Standard Operating Procedures</p>
                        <div className="flex items-center text-purple-600 font-medium text-xs">
                          <span>Launch Agent</span>
                          <Sparkles className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Content Assistant */}
                  <button
                    onClick={() => router.push('/ai-agents?agent=content-assistant')}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left border border-green-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-green-500 rounded-lg p-2.5">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">Content & Messaging</h3>
                        <p className="text-xs text-slate-600 mb-2">Generate brand-aligned content for any channel</p>
                        <div className="flex items-center text-green-600 font-medium text-xs">
                          <span>Launch Agent</span>
                          <Sparkles className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* QA Compliance Checker */}
                  <button
                    onClick={() => router.push('/ai-agents?agent=qa-compliance')}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left border border-orange-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-500 rounded-lg p-2.5">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">QA & Compliance</h3>
                        <p className="text-xs text-slate-600 mb-2">Review content for quality & compliance</p>
                        <div className="flex items-center text-orange-600 font-medium text-xs">
                          <span>Launch Agent</span>
                          <Sparkles className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Competitor Analyzer */}
                  <button
                    onClick={() => router.push('/ai-agents?agent=competitor-analyzer')}
                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left border border-red-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-red-500 rounded-lg p-2.5">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">Competitor Analyzer</h3>
                        <p className="text-xs text-slate-600 mb-2">SWOT analysis & competitive insights</p>
                        <div className="flex items-center text-red-600 font-medium text-xs">
                          <span>Launch Agent</span>
                          <Sparkles className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Email Sequence Builder */}
                  <button
                    onClick={() => router.push('/ai-agents?agent=email-sequence')}
                    className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left border border-cyan-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-cyan-500 rounded-lg p-2.5">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">Email Sequence Builder</h3>
                        <p className="text-xs text-slate-600 mb-2">Create email sequences with subject variations</p>
                        <div className="flex items-center text-cyan-600 font-medium text-xs">
                          <span>Launch Agent</span>
                          <Sparkles className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Buyer Persona Generator */}
                  <button
                    onClick={() => router.push('/ai-agents?agent=persona-builder')}
                    className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left border border-pink-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-pink-500 rounded-lg p-2.5">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">Buyer Persona Generator</h3>
                        <p className="text-xs text-slate-600 mb-2">Create detailed personas with journey mapping</p>
                        <div className="flex items-center text-pink-600 font-medium text-xs">
                          <span>Launch Agent</span>
                          <Sparkles className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Reporting & Insights */}
                  <button
                    onClick={() => router.push('/ai-agents?agent=reporting-insights')}
                    className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left border border-indigo-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-500 rounded-lg p-2.5">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">Reporting & Insights</h3>
                        <p className="text-xs text-slate-600 mb-2">Generate executive summaries & reports</p>
                        <div className="flex items-center text-indigo-600 font-medium text-xs">
                          <span>Launch Agent</span>
                          <Sparkles className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Ad Creative Generator */}
                  <button
                    onClick={() => router.push('/ai-agents?agent=ad-creative')}
                    className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-105 text-left border border-amber-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-500 rounded-lg p-2.5">
                        <Megaphone className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">Ad Creative Generator</h3>
                        <p className="text-xs text-slate-600 mb-2">Platform-specific ad copy for FB, Google, LinkedIn</p>
                        <div className="flex items-center text-amber-600 font-medium text-xs">
                          <span>Launch Agent</span>
                          <Sparkles className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Need Help?</h3>
            <div className="space-y-3 text-sm">
              <p className="text-slate-600">
                If you have any questions about your resources or need assistance, please reach out to our support team.
              </p>
              <Button variant="secondary" onClick={() => router.push('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* Document Modal */}
      {showDocumentModal && generatedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">{generatedDocument.title}</h2>
              </div>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setGeneratedDocument(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {generatedDocument.content}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
              <Button
                variant="secondary"
                onClick={() => {
                  const blob = new Blob([generatedDocument.content], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${generatedDocument.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download as Markdown
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDocumentModal(false);
                  setGeneratedDocument(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Support Chatbot */}
      <SupportChatbot />
    </div>
  );
}
