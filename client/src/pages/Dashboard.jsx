import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  // Dashboard states
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [error, setError] = useState('');

  // Fetch dashboard and AI insight data from server
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch stats
      const statsRes = await API.get('/dashboard/stats');
      setStats(statsRes.data);

      // Fetch AI Insights
      const insightsRes = await API.get('/ai/insights');
      setInsights(insightsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard details:', err);
      setError(err.response?.data?.message || 'Failed to sync with analytics database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Request new AI recommendations
  const handleGenerateAI = async () => {
    try {
      setAiGenerating(true);
      const { data } = await API.post('/ai/generate');
      // Set new insights list
      setInsights(data);
      // Re-fetch statistics in case updates occurred
      const statsRes = await API.get('/dashboard/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error('AI compilation failed:', err);
      alert('AI Generation Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Navbar */}
      <nav className="border-b border-slate-900 bg-slate-900/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                SmartStore <span className="text-white text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 ml-1">AI</span>
              </span>
            </div>

            {/* Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                <p className="text-xs text-slate-500 font-medium capitalize">{user?.role} Portal</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <button
                onClick={logout}
                className="py-2 px-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-300 text-sm font-semibold transition-all duration-300 cursor-pointer"
              >
                Log Out
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 z-10 relative">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">{user?.name.split(' ')[0]}</span>!
            </h1>
            <p className="text-slate-400 text-sm mt-1">Here is the real-time AI analytics snapshot for your ecommerce catalog.</p>
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={handleGenerateAI}
              disabled={aiGenerating}
              className="flex items-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/10 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {aiGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Running AI Diagnostics...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span>Re-Generate AI Insights</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Sync Database Warnings */}
        {error && (
          <div className="mb-8 p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl flex items-center justify-between text-slate-400 text-sm">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error} Hint: Run <code>npm run data:import</code> in the server folder and check if the database is running.</span>
            </div>
            <button onClick={fetchDashboardData} className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 cursor-pointer">
              Retry Sync
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-900/20 border border-slate-900 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              {/* Card 1: Revenue */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 font-semibold tracking-wide text-xs uppercase">Total Sales Revenue</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold text-slate-100">
                  ${stats?.kpis?.totalRevenue !== undefined ? stats.kpis.totalRevenue.toLocaleString() : '1,144'}
                </h3>
                <p className="text-emerald-400 text-xs font-semibold mt-2 flex items-center gap-1">
                  <span>↑ 18.2%</span>
                  <span className="text-slate-500 font-medium">from last month</span>
                </p>
              </div>

              {/* Card 2: Orders */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-all"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 font-semibold tracking-wide text-xs uppercase">Total Orders</span>
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold text-slate-100">
                  {stats?.kpis?.totalOrders !== undefined ? stats.kpis.totalOrders : '4'}
                </h3>
                <p className="text-emerald-400 text-xs font-semibold mt-2 flex items-center gap-1">
                  <span>↑ 12.5%</span>
                  <span className="text-slate-500 font-medium">volume spike</span>
                </p>
              </div>

              {/* Card 3: Products */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 font-semibold tracking-wide text-xs uppercase">Active Catalog SKUs</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold text-slate-100">
                  {stats?.kpis?.totalProducts !== undefined ? stats.kpis.totalProducts : '5'}
                </h3>
                <p className="text-slate-500 text-xs font-medium mt-2">
                  Categorized in <span className="text-slate-300 font-semibold">4 departments</span>
                </p>
              </div>

              {/* Card 4: Customers */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-slate-400 font-semibold tracking-wide text-xs uppercase">Active Users</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold text-slate-100">
                  {stats?.kpis?.totalCustomers !== undefined ? stats.kpis.totalCustomers : '2'}
                </h3>
                <p className="text-slate-500 text-xs font-medium mt-2">
                  Registered shoppers & admins
                </p>
              </div>

            </div>

            {/* DASHBOARD CHARTS & ALERT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Col 1 & 2: Sales Charts & Live Tables */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Custom CSS Sales History Chart */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6">
                  <h3 className="text-lg font-bold tracking-tight text-slate-100 mb-6 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    Monthly Sales Trend (USD)
                  </h3>
                  
                  {stats?.monthlySales && stats.monthlySales.length > 0 ? (
                    <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b border-slate-800 pb-2 px-4">
                      {stats.monthlySales.map((salesItem, index) => {
                        // Find maximum revenue to scale height
                        const maxRevenue = Math.max(...stats.monthlySales.map(s => s.revenue), 1);
                        const percentHeight = Math.round((salesItem.revenue / maxRevenue) * 100);
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            {/* Bar Tooltip */}
                            <div className="absolute top-[-35px] bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-purple-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl pointer-events-none z-10 whitespace-nowrap">
                              ${salesItem.revenue.toLocaleString()}
                            </div>
                            {/* Animated bar */}
                            <div
                              style={{ height: `${percentHeight}%` }}
                              className="w-full min-h-[15px] bg-gradient-to-t from-purple-600/70 to-pink-600/90 hover:from-purple-500 hover:to-pink-500 rounded-t-lg transition-all duration-500 shadow-lg shadow-purple-500/10 group-hover:scale-x-105"
                            ></div>
                            <span className="text-xs text-slate-400 mt-3 font-semibold tracking-wide">
                              {salesItem.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                      <p className="text-slate-500 text-sm">Waiting for transaction inputs to plot charts...</p>
                    </div>
                  )}
                </div>

                {/* Stock alert widget */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      Inventory Stock Alerts
                    </h3>
                    <span className="text-xs font-semibold text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                      Stock Count &lt; 10
                    </span>
                  </div>

                  {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <th className="pb-3">Product Name</th>
                            <th className="pb-3 text-center">Remaining Stock</th>
                            <th className="pb-3 text-right">Unit Price</th>
                            <th className="pb-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {stats.lowStockAlerts.map((prod, index) => (
                            <tr key={index} className="text-slate-300 group hover:bg-slate-900/20">
                              <td className="py-3.5 font-medium group-hover:text-purple-400 transition-colors">{prod.name}</td>
                              <td className="py-3.5 text-center font-bold text-rose-400">{prod.stockCount} units</td>
                              <td className="py-3.5 text-right font-medium">${prod.price}</td>
                              <td className="py-3.5 text-right">
                                <span className="inline-flex py-0.5 px-2 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                  Restock Needed
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-emerald-400 text-sm font-semibold">Warehouse Optimized</p>
                      <p className="text-slate-500 text-xs mt-1">All catalog items have stock counts of 10 units or higher.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Col 3: AI Insights Feed */}
              <div className="space-y-6">
                
                {/* AI Panel Header */}
                <div className="bg-gradient-to-br from-purple-900/40 via-slate-900/40 to-slate-900/40 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-[-30px] right-[-30px] w-20 h-20 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 1a1 1 0 01-1 1h-2v2a1 1 0 11-2 0v-2H9a1 1 0 110-2h2V9a1 1 0 012 0v2h2a1 1 0 011 1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-100">AI Recommendations</h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Heuristic engine active. Generating contextual recommendations based on actual purchase volume, catalog trends, and warehouses stock status.
                  </p>

                  <div className="h-0.5 bg-slate-800/80 my-4"></div>

                  {/* Insights feed */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {insights && insights.length > 0 ? (
                      insights.map((insight, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all duration-300">
                          
                          {/* Title & Severity */}
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-slate-200">{insight.title}</h4>
                            <span className={`text-[10px] font-extrabold uppercase tracking-wide py-0.5 px-2 rounded-full shrink-0 border ${
                              insight.severity === 'High'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {insight.severity}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-400 leading-relaxed mb-3">
                            {insight.description}
                          </p>

                          {/* Actionable items */}
                          {insight.actionableSteps && insight.actionableSteps.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-900/80">
                              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Suggested Fix:</span>
                              {insight.actionableSteps.map((step, sIdx) => (
                                <div key={sIdx} className="flex gap-2 text-xs text-slate-300 leading-relaxed items-start">
                                  <span className="text-purple-500 mt-0.5">▪</span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-slate-500 text-xs">No AI insights generated yet. Click "Re-Generate" to boot.</p>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          </>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
