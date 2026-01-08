'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Users,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  LogOut,
  ChevronDown,
  ChevronUp,
  Building2,
  Link as LinkIcon
} from 'lucide-react';

interface Client {
  id: string;
  uniqueClientId: string;
  companyName: string;
  industry: string;
  email: string;
  status: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  monthlyBudgetRange?: string;
  createdAt: string;
  lastLogin?: string;
  linkCount: number;
  activityCount: number;
  websiteUrl?: string;
}

interface ClientDetails extends Client {
  links?: Array<{
    id: string;
    linkType: string;
    title: string;
    url: string;
    description?: string;
    createdAt: string;
  }>;
  businessInfo?: any;
  marketingState?: any;
  analytics?: any;
  socialMedia?: any;
  goals?: any;
  audience?: any;
  budget?: any;
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [expandedClientData, setExpandedClientData] = useState<ClientDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      if (session.user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchClients();
    }
  }, [status, session, router]);

  useEffect(() => {
    filterClients();
  }, [searchTerm, statusFilter, clients]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data.clients);
      setFilteredClients(data.clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleClientDetails = async (clientId: string) => {
    // If clicking the same client, collapse it
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
      setExpandedClientData(null);
      return;
    }

    // Expand new client
    setExpandedClientId(clientId);
    setLoadingDetails(true);
    setExpandedClientData(null);

    try {
      const response = await fetch(`/api/admin/clients/${clientId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch client details');
      }

      const data = await response.json();
      // Merge links into the client object
      setExpandedClientData({ ...data.client, links: data.links });
    } catch (err) {
      console.error('Error fetching client details:', err);
      setExpandedClientId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.industry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((client) => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const icons = {
      pending: <Clock className="w-3 h-3" />,
      active: <CheckCircle className="w-3 h-3" />,
      inactive: <AlertCircle className="w-3 h-3" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {icons[status as keyof typeof icons] || icons.inactive}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-1">Total Clients</p>
              <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {clients.filter((c) => c.status === 'active').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {clients.filter((c) => c.status === 'pending').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-1">Completed Onboarding</p>
              <p className="text-2xl font-bold text-indigo-600">
                {clients.filter((c) => c.onboardingCompleted).length}
              </p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by company, email, or industry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Clients Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Links
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center border-b border-slate-200">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No clients found</p>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <React.Fragment key={client.id}>
                      <tr
                        className={`hover:bg-slate-50 cursor-pointer border-b border-slate-200 ${expandedClientId === client.id ? 'bg-slate-50' : ''}`}
                        onClick={() => toggleClientDetails(client.id)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{client.companyName}</p>
                            <p className="text-sm text-slate-500">{client.industry}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {client.email}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(client.status)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                            <LinkIcon className="w-4 h-4" />
                            {client.linkCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {expandedClientId === client.id ? (
                            <ChevronUp className="w-5 h-5 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-600" />
                          )}
                        </td>
                      </tr>
                      {expandedClientId === client.id && (
                        <tr key={`${client.id}-details`}>
                          <td colSpan={6} className="px-0 py-0 bg-slate-50 border-b border-slate-200">
                            <div className="px-8 py-6">
                              {loadingDetails ? (
                                <div className="text-center py-12">
                                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                  <p className="text-slate-600">Loading client details...</p>
                                </div>
                              ) : expandedClientData ? (
                                <div className="space-y-6">
                                  {/* Client Details Content */}
                                  <div className="grid grid-cols-3 gap-6">
                                    {/* Company Info */}
                                    <div className="col-span-3 bg-white rounded-lg p-6 shadow-sm">
                                      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-indigo-600" />
                                        Company Information
                                      </h3>
                                      <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                          <p className="text-slate-500">Client ID</p>
                                          <p className="font-medium text-slate-900">{expandedClientData.uniqueClientId}</p>
                                        </div>
                                        <div>
                                          <p className="text-slate-500">Industry</p>
                                          <p className="font-medium text-slate-900">{(expandedClientData as any).businessInfo?.industry}</p>
                                        </div>
                                        <div>
                                          <p className="text-slate-500">Status</p>
                                          <div className="mt-1">{getStatusBadge(expandedClientData.status)}</div>
                                        </div>
                                        <div>
                                          <p className="text-slate-500">Email</p>
                                          <p className="font-medium text-slate-900">{expandedClientData.email}</p>
                                        </div>
                                        {(expandedClientData as any).businessInfo?.websiteUrl && (
                                          <div>
                                            <p className="text-slate-500">Website</p>
                                            <a
                                              href={(expandedClientData as any).businessInfo.websiteUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="font-medium text-indigo-600 hover:underline"
                                            >
                                              Visit
                                            </a>
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-slate-500">Created</p>
                                          <p className="font-medium text-slate-900">
                                            {new Date(expandedClientData.createdAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Onboarding Responses - Full Width */}
                                    <div className="col-span-3 bg-white rounded-lg p-6 shadow-sm">
                                      <h3 className="font-semibold text-slate-900 mb-4">Onboarding Questionnaire Responses</h3>
                                      <div className="grid grid-cols-2 gap-4">
                                        {/* Business Info */}
                                        {(expandedClientData as any).businessInfo && (
                                          <div className="bg-slate-50 rounded-lg p-4">
                                            <h4 className="font-medium text-slate-900 mb-3">Business Information</h4>
                                            <div className="space-y-2 text-sm">
                                              {(expandedClientData as any).businessInfo.companyDescription && (
                                                <div>
                                                  <p className="text-slate-500">Company Description:</p>
                                                  <p className="text-slate-900">{(expandedClientData as any).businessInfo.companyDescription}</p>
                                                </div>
                                              )}
                                              {(expandedClientData as any).businessInfo.employeeCount && (
                                                <div>
                                                  <p className="text-slate-500">Employee Count:</p>
                                                  <p className="text-slate-900">{(expandedClientData as any).businessInfo.employeeCount}</p>
                                                </div>
                                              )}
                                              {(expandedClientData as any).businessInfo.businessModel && (
                                                <div>
                                                  <p className="text-slate-500">Business Model:</p>
                                                  <p className="text-slate-900">{(expandedClientData as any).businessInfo.businessModel}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Marketing State */}
                                        {(expandedClientData as any).marketingState && (
                                          <div className="bg-slate-50 rounded-lg p-4">
                                            <h4 className="font-medium text-slate-900 mb-3">Current Marketing State</h4>
                                            <div className="space-y-2 text-sm">
                                              {(expandedClientData as any).marketingState.workedWithAgency !== null && (
                                                <div>
                                                  <p className="text-slate-500">Previously Worked with Agency:</p>
                                                  <p className="text-slate-900">{(expandedClientData as any).marketingState.workedWithAgency ? 'Yes' : 'No'}</p>
                                                </div>
                                              )}
                                              {(expandedClientData as any).marketingState.currentChannels && (
                                                <div>
                                                  <p className="text-slate-500">Current Marketing Channels:</p>
                                                  <p className="text-slate-900">{typeof (expandedClientData as any).marketingState.currentChannels === 'string' ? JSON.parse((expandedClientData as any).marketingState.currentChannels).join(', ') : (expandedClientData as any).marketingState.currentChannels}</p>
                                                </div>
                                              )}
                                              {(expandedClientData as any).marketingState.primaryChallenges && (
                                                <div>
                                                  <p className="text-slate-500">Primary Challenges:</p>
                                                  <p className="text-slate-900">{typeof (expandedClientData as any).marketingState.primaryChallenges === 'string' ? JSON.parse((expandedClientData as any).marketingState.primaryChallenges).join(', ') : (expandedClientData as any).marketingState.primaryChallenges}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Analytics */}
                                        {(expandedClientData as any).analytics && (
                                          <div className="bg-slate-50 rounded-lg p-4">
                                            <h4 className="font-medium text-slate-900 mb-3">Analytics & Tracking</h4>
                                            <div className="space-y-2 text-sm">
                                              {(expandedClientData as any).analytics.trackingTools && (
                                                <div>
                                                  <p className="text-slate-500">Tracking Tools:</p>
                                                  <p className="text-slate-900">{typeof (expandedClientData as any).analytics.trackingTools === 'string' ? JSON.parse((expandedClientData as any).analytics.trackingTools).join(', ') : (expandedClientData as any).analytics.trackingTools}</p>
                                                </div>
                                              )}
                                              {(expandedClientData as any).analytics.analyticsNotes && (
                                                <div>
                                                  <p className="text-slate-500">Analytics Notes:</p>
                                                  <p className="text-slate-900">{(expandedClientData as any).analytics.analyticsNotes}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Goals */}
                                        {(expandedClientData as any).goals && (
                                          <div className="bg-slate-50 rounded-lg p-4">
                                            <h4 className="font-medium text-slate-900 mb-3">Goals & Objectives</h4>
                                            <div className="space-y-2 text-sm">
                                              {(expandedClientData as any).goals.primaryGoal && (
                                                <div>
                                                  <p className="text-slate-500">Primary Goal:</p>
                                                  <p className="text-slate-900">{(expandedClientData as any).goals.primaryGoal}</p>
                                                </div>
                                              )}
                                              {(expandedClientData as any).goals.keyMetrics && (
                                                <div>
                                                  <p className="text-slate-500">Key Metrics:</p>
                                                  <p className="text-slate-900">{typeof (expandedClientData as any).goals.keyMetrics === 'string' ? JSON.parse((expandedClientData as any).goals.keyMetrics).join(', ') : (expandedClientData as any).goals.keyMetrics}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Audience */}
                                        {(expandedClientData as any).audience && (
                                          <div className="bg-slate-50 rounded-lg p-4">
                                            <h4 className="font-medium text-slate-900 mb-3">Target Audience</h4>
                                            <div className="space-y-2 text-sm">
                                              {(expandedClientData as any).audience.idealCustomerProfile && (
                                                <div>
                                                  <p className="text-slate-500">Ideal Customer Profile:</p>
                                                  <p className="text-slate-900">{(expandedClientData as any).audience.idealCustomerProfile}</p>
                                                </div>
                                              )}
                                              {(expandedClientData as any).audience.competitors && (
                                                <div>
                                                  <p className="text-slate-500">Competitors:</p>
                                                  <p className="text-slate-900">{(expandedClientData as any).audience.competitors}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Budget */}
                                        {(expandedClientData as any).budget?.monthlyBudgetRange && (
                                          <div className="bg-slate-50 rounded-lg p-4">
                                            <h4 className="font-medium text-slate-900 mb-3">Budget Information</h4>
                                            <div className="space-y-2 text-sm">
                                              <div>
                                                <p className="text-slate-500">Monthly Budget Range:</p>
                                                <p className="text-slate-900">{(expandedClientData as any).budget.monthlyBudgetRange}</p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Generated Links - Full Width */}
                                    <div className="col-span-3 bg-white rounded-lg p-6 shadow-sm">
                                      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        <LinkIcon className="w-5 h-5 text-indigo-600" />
                                        Generated Resources ({expandedClientData.links?.length || 0})
                                      </h3>
                                      {expandedClientData.links && expandedClientData.links.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-4">
                                          {expandedClientData.links.map((link) => (
                                            <div
                                              key={link.id}
                                              className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                                            >
                                              <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                  <p className="font-medium text-slate-900 mb-1">{link.title}</p>
                                                  {link.description && (
                                                    <p className="text-sm text-slate-600 mb-2">{link.description}</p>
                                                  )}
                                                  <p className="text-xs text-slate-500">
                                                    {link.linkType.replace('_', ' ').toUpperCase()} •{' '}
                                                    {new Date(link.createdAt).toLocaleDateString()}
                                                  </p>
                                                </div>
                                                <a
                                                  href={link.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="ml-4"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <Button variant="secondary" className="text-sm">
                                                    <ExternalLink className="w-4 h-4" />
                                                  </Button>
                                                </a>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-slate-500 text-sm">No resources generated yet.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
