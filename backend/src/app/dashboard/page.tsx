'use client';

import { useState, useEffect } from 'react';

interface LinkItem {
  id: string;
  longUrl: string;
  code: string;
  customDomain: string | null;
  clicksCount: number;
  createdAt: string;
}

export default function Dashboard() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      // Fetch links
      const linksRes = await fetch('/api/links');
      const linksData = await linksRes.json();
      if (linksData.success) {
        setLinks(linksData.links);
      }

      // Fetch domains
      const domainsRes = await fetch('/api/domains');
      const domainsData = await domainsRes.json();
      if (domainsData.success) {
        setDomains(domainsData.domains);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle adding a new domain
  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add domain');
      }

      setSuccess(`Domain "${newDomain}" registered successfully!`);
      setNewDomain('');
      fetchData(); // Reload list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate stats
  const totalLinks = links.length;
  const totalClicks = links.reduce((sum, link) => sum + (link.clicksCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">QuickLink Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 py-1 px-3 rounded-full">SaaS Portal</span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* Step-by-Step Setup Guide */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            <h2 className="text-base font-extrabold">How to Setup Your Custom Domain (Onboarding Guide)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-emerald-100">
            <div className="bg-white/10 p-4 rounded-xl space-y-2">
              <span className="font-extrabold text-emerald-200 uppercase tracking-wider text-[10px] block">Step 1: Point your Domain DNS</span>
              <p className="text-xs leading-relaxed">
                Log into GoDaddy/Cloudflare. Add an <strong>A Record</strong> pointing to Vercel IP: 
                <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono block mt-1 select-all text-white text-center">76.76.21.21</code>
              </p>
            </div>

            <div className="bg-white/10 p-4 rounded-xl space-y-2">
              <span className="font-extrabold text-emerald-200 uppercase tracking-wider text-[10px] block">Step 2: Connect Domain</span>
              <p className="text-xs leading-relaxed">
                Type your domain in the <strong>"Connect Custom Domain"</strong> form below and click Register.
              </p>
            </div>

            <div className="bg-white/10 p-4 rounded-xl space-y-2">
              <span className="font-extrabold text-emerald-200 uppercase tracking-wider text-[10px] block">Step 3: Setup Chrome Extension</span>
              <p className="text-xs leading-relaxed">
                Open extension settings, select "My Backend", and set <strong>Backend URL</strong> to:
                <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono block mt-1 text-white text-center">https://quicklink-shortener.vercel.app</code>
              </p>
            </div>
          </div>
        </section>
        
        {/* Stat Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Active Links</span>
            <span className="text-4xl font-extrabold text-slate-900 mt-2">{totalLinks}</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Accumulated Clicks</span>
            <span className="text-4xl font-extrabold text-emerald-600 mt-2">{totalClicks}</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Branded Domains</span>
            <span className="text-4xl font-extrabold text-slate-900 mt-2">{domains.length}</span>
          </div>
        </section>

        {/* Dynamic Custom Domains Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Domain Form Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Connect Custom Domain</h2>
              <p className="text-xs text-slate-500 mt-1">Users register their domains here to bind them dynamically on Vercel.</p>
            </div>

            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Domain Name</label>
                <input
                  type="text"
                  placeholder="e.g. userbrand.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              {error && <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
              {success && <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-lg">{success}</div>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition duration-200 disabled:opacity-50 text-sm"
              >
                {isSubmitting ? 'Registering...' : 'Register Domain'}
              </button>
            </form>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">Registered Domains:</h3>
              {domains.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No custom domains connected yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {domains.map((dom) => (
                    <span key={dom} className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
                      {dom}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Links list Table Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Your Shortened Links</h2>

            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading links...</div>
            ) : links.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm italic">
                No links shortened yet. Shorten your first link in the Chrome Extension!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                      <th className="pb-3">Code / Destination</th>
                      <th className="pb-3 text-center">Clicks</th>
                      <th className="pb-3 text-right">Domain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => (
                      <tr key={link.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="py-4">
                          <div className="font-bold text-slate-900">
                            /r/{link.code}
                          </div>
                          <div className="text-xs text-slate-400 max-w-[300px] truncate mt-1">
                            {link.longUrl}
                          </div>
                        </td>
                        <td className="py-4 text-center font-bold text-emerald-600">
                          {link.clicksCount || 0}
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
                            {link.customDomain || 'Default'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
