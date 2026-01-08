import Link from 'next/link';
import { Briefcase, User, Shield, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
              <span className="text-xl font-bold text-slate-900">AgencyFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Client Login
              </Link>
              <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-slate-50">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-50 rounded-bl-full opacity-50 blur-3xl transform translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-50 rounded-tr-full opacity-50 blur-3xl transform -translate-x-1/4 translate-y-1/4"></div>
        </div>

        <div className="relative max-w-4xl w-full space-y-12 text-center">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900">
              Marketing Onboarding <br/>
              <span className="text-indigo-600">Reimagined.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Welcome to the future of agency collaboration. Streamlined onboarding, centralized assets, and real-time project tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {/* New Client */}
            <Link href="/onboarding">
              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-indigo-100 ring-1 ring-indigo-50 relative overflow-hidden group cursor-pointer">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Briefcase size={80} className="text-indigo-600" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">New Client?</h3>
                    <p className="text-sm text-slate-500 mt-1">Start your onboarding journey here. It only takes 5 minutes.</p>
                  </div>
                  <Button className="w-full justify-between group">
                    Start Onboarding <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            </Link>

            {/* Client Portal */}
            <Link href="/login">
              <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Client Portal</h3>
                    <p className="text-sm text-slate-500 mt-1">Access your dashboard, view deliverables, and track progress.</p>
                  </div>
                  <Button variant="secondary" className="w-full">Login to Dashboard</Button>
                </div>
              </Card>
            </Link>

            {/* Admin */}
            <Link href="/admin">
              <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group opacity-80 hover:opacity-100">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Agency Admin</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage clients, generate links, and view analytics.</p>
                  </div>
                  <Button variant="ghost" className="w-full justify-start pl-0 hover:pl-2">Admin Access &rarr;</Button>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm">
        &copy; 2026 AgencyFlow Platform. All rights reserved.
      </footer>
    </div>
  );
}
