import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  // Dashboard & Navigation states
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'products', or 'ai-tools'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [error, setError] = useState('');

  // Products CRUD states
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal / Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Product CRUD Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formStock, setFormStock] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSales, setFormSales] = useState('0');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // --- AI COPYWRITING TOOLS STATES ---
  const [aiTitle, setAiTitle] = useState('');
  const [aiCategory, setAiCategory] = useState('General');
  const [aiFeatures, setAiFeatures] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiSeoTags, setAiSeoTags] = useState([]);
  const [aiCaption, setAiCaption] = useState('');

  // Loading states for copywriter
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  // Copied alert states
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Fetch Dashboard data (stats & AI insights)
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, insightsRes] = await Promise.all([
        API.get('/dashboard/stats'),
        API.get('/ai/insights')
      ]);
      setStats(statsRes.data);
      setInsights(insightsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard details:', err);
      setError(err.response?.data?.message || 'Failed to sync with analytics database.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Products catalog
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const { data } = await API.get('/products');
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchProducts();
  }, []);

  // Request new AI recommendations
  const handleGenerateAI = async () => {
    try {
      setAiGenerating(true);
      const { data } = await API.post('/ai/generate');
      setInsights(data);
      const statsRes = await API.get('/dashboard/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error('AI compilation failed:', err);
      alert('AI Generation Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setAiGenerating(false);
    }
  };

  // Open modals & reset form fields
  const openAddModal = () => {
    setFormTitle('');
    setFormPrice('');
    setFormCategory('General');
    setFormStock('');
    setFormDescription('');
    setFormSales('0');
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormTitle(product.title || product.name || '');
    setFormPrice(product.price?.toString() || '');
    setFormCategory(product.category || 'General');
    setFormStock(product.stock?.toString() || product.stockCount?.toString() || '');
    setFormDescription(product.description || '');
    setFormSales(product.sales?.toString() || '0');
    setFormError('');
    setShowEditModal(true);
  };

  // CRUD operation: Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim() || !formPrice || !formCategory || !formStock || !formDescription.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setFormSubmitting(true);
      await API.post('/products', {
        title: formTitle,
        price: parseFloat(formPrice),
        category: formCategory,
        stock: parseInt(formStock),
        description: formDescription,
        sales: parseInt(formSales || '0'),
      });
      setShowAddModal(false);
      await Promise.all([fetchProducts(), fetchDashboardData()]);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create product.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // CRUD operation: Update Product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim() || !formPrice || !formCategory || !formStock || !formDescription.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setFormSubmitting(true);
      await API.put(`/products/${selectedProduct._id}`, {
        title: formTitle,
        price: parseFloat(formPrice),
        category: formCategory,
        stock: parseInt(formStock),
        description: formDescription,
        sales: parseInt(formSales || '0'),
      });
      setShowEditModal(false);
      await Promise.all([fetchProducts(), fetchDashboardData()]);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update product.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // CRUD operation: Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await API.delete(`/products/${id}`);
        await Promise.all([fetchProducts(), fetchDashboardData()]);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  // --- AI Tools: Generate Product Copywriting Assets ---
  const handleGenerateAsset = async (target) => {
    if (!aiTitle.trim()) {
      alert('Please enter a Product Title first.');
      return;
    }
    if (!aiCategory) {
      alert('Please select a Product Category.');
      return;
    }

    // Set active loading states
    if (target === 'description') setLoadingDesc(true);
    if (target === 'seoTags') setLoadingTags(true);
    if (target === 'marketingCaption') setLoadingCaption(true);
    if (target === 'all') setLoadingAll(true);

    try {
      const featuresArray = aiFeatures
        ? aiFeatures.split(',').map(f => f.trim()).filter(f => f.length > 0)
        : [];

      const { data } = await API.post('/ai/product/generate', {
        title: aiTitle,
        category: aiCategory,
        features: featuresArray,
      });

      // Populate results conditionally
      if (target === 'description' || target === 'all') setAiDescription(data.description || '');
      if (target === 'seoTags' || target === 'all') setAiSeoTags(data.seoTags || []);
      if (target === 'marketingCaption' || target === 'all') setAiCaption(data.marketingCaption || '');
    } catch (err) {
      console.error('AI Generation error:', err);
      alert(err.response?.data?.message || 'Failed to generate assets. Please try again.');
    } finally {
      if (target === 'description') setLoadingDesc(false);
      if (target === 'seoTags') setLoadingTags(false);
      if (target === 'marketingCaption') setLoadingCaption(false);
      if (target === 'all') setLoadingAll(false);
    }
  };

  // Copy to clipboard with success state
  const handleCopyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    
    if (type === 'description') {
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
    if (type === 'seoTags') {
      setCopiedTags(true);
      setTimeout(() => setCopiedTags(false), 2000);
    }
    if (type === 'marketingCaption') {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  };

  // Filter products by search query and category
  const filteredProducts = products.filter(product => {
    const titleMatch = (product.title || product.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = categoryFilter === '' || product.category === categoryFilter;
    return titleMatch && categoryMatch;
  });

  const categories = ['Electronics', 'Office', 'Home & Living', 'Accessories', 'General'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex relative overflow-hidden">
      
      {/* Decorative Glow Backgrounds */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* --- SIDEBAR NAVIGATION --- */}
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-900/35 backdrop-blur-xl flex flex-col justify-between shrink-0 hidden md:flex z-30">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              SmartStore <span className="text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 ml-1">AI</span>
            </span>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-purple-600/10 border border-purple-500/25 text-purple-300 shadow-md shadow-purple-500/5'
                  : 'border border-transparent hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              <span>Overview</span>
            </button>
            
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-purple-600/10 border border-purple-500/25 text-purple-300 shadow-md shadow-purple-500/5'
                  : 'border border-transparent hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Products</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-tools')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                activeTab === 'ai-tools'
                  ? 'bg-purple-600/10 border border-purple-500/25 text-purple-300 shadow-md shadow-purple-500/5'
                  : 'border border-transparent hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>AI Tools</span>
            </button>
          </nav>
        </div>

        {/* User profile & logout */}
        <div className="p-6 border-t border-slate-900 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-slate-800 flex items-center justify-center font-bold text-purple-300 text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-slate-200 truncate">{user?.name}</h4>
              <p className="text-xs text-slate-500 capitalize truncate">{user?.role} Portal</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-300 text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay backdrop */}
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          
          <aside className="relative w-64 bg-slate-950 border-r border-slate-900 flex flex-col justify-between p-6 h-full transition-transform duration-300">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-extrabold text-md tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    SmartStore
                  </span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-100 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-1.5">
                <button
                  onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
                  className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'overview' ? 'bg-purple-600/10 text-purple-300' : 'text-slate-400'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => { setActiveTab('products'); setSidebarOpen(false); }}
                  className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'products' ? 'bg-purple-600/10 text-purple-300' : 'text-slate-400'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => { setActiveTab('ai-tools'); setSidebarOpen(false); }}
                  className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'ai-tools' ? 'bg-purple-600/10 text-purple-300' : 'text-slate-400'
                  }`}
                >
                  AI Tools
                </button>
              </nav>
            </div>

            <div className="border-t border-slate-900 pt-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center font-bold text-purple-300">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{user?.name}</h4>
                  <p className="text-xs text-slate-500 capitalize">{user?.role} Portal</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* --- MAIN DASHBOARD CONTAINER --- */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative overflow-y-auto">
        
        {/* Mobile Navbar Header */}
        <header className="border-b border-slate-900 bg-slate-900/20 backdrop-blur-md sticky top-0 z-40 md:hidden py-3 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-extrabold text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              SmartStore <span className="text-white text-[8px] font-bold uppercase px-1 rounded bg-purple-500/10 ml-0.5">AI</span>
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
        </header>

        {/* --- MAIN PAGE CONTENT --- */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
                {activeTab === 'overview' && (
                  <>Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">{user?.name.split(' ')[0]}</span>!</>
                )}
                {activeTab === 'products' && (
                  <>Product <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Catalog</span></>
                )}
                {activeTab === 'ai-tools' && (
                  <>AI Copywriting <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Workstation</span></>
                )}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {activeTab === 'overview' && 'Here is the real-time AI analytics snapshot for your ecommerce catalog.'}
                {activeTab === 'products' && 'Add, update, search and manage items in your product inventory.'}
                {activeTab === 'ai-tools' && 'Generate search-optimized metadata, descriptions, and captions for your catalog in seconds.'}
              </p>
            </div>

            {activeTab === 'overview' && user?.role === 'admin' && (
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

            {activeTab === 'products' && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/10 active:scale-[0.98] transition-all duration-300 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Product</span>
              </button>
            )}

            {activeTab === 'ai-tools' && (
              <button
                onClick={() => handleGenerateAsset('all')}
                disabled={loadingAll || loadingDesc || loadingTags || loadingCaption || !aiTitle.trim()}
                className="flex items-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/10 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {loadingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Writing Copywriting Pack...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate All Assets</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Sync / Connection errors */}
          {error && (
            <div className="mb-8 p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl flex items-center justify-between text-slate-400 text-sm">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error} Hint: Run <code>npm run data:import</code> in the server folder and verify database connectivity.</span>
              </div>
              <button onClick={fetchDashboardData} className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 cursor-pointer">
                Retry Sync
              </button>
            </div>
          )}

          {/* --- TAB VIEW: OVERVIEW / ANALYTICS --- */}
          {activeTab === 'overview' && (
            <>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 bg-slate-900/20 border border-slate-900 rounded-2xl animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <>
                  {/* KPI CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    
                    {/* Revenue */}
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
                        ${stats?.kpis?.totalRevenue !== undefined ? stats.kpis.totalRevenue.toLocaleString() : '0'}
                      </h3>
                      <p className="text-emerald-400 text-xs font-semibold mt-2 flex items-center gap-1">
                        <span>↑ 18.2%</span>
                        <span className="text-slate-500 font-medium">from last month</span>
                      </p>
                    </div>

                    {/* Orders */}
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
                        {stats?.kpis?.totalOrders !== undefined ? stats.kpis.totalOrders : '0'}
                      </h3>
                      <p className="text-emerald-400 text-xs font-semibold mt-2 flex items-center gap-1">
                        <span>↑ 12.5%</span>
                        <span className="text-slate-500 font-medium">volume spike</span>
                      </p>
                    </div>

                    {/* Products */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                      <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-400 font-semibold tracking-wide text-xs uppercase">Catalog Products</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-3xl font-extrabold text-slate-100">
                        {stats?.kpis?.totalProducts !== undefined ? stats.kpis.totalProducts : '0'}
                      </h3>
                      <p className="text-slate-500 text-xs font-medium mt-2">
                        Categorized in <span className="text-slate-300 font-semibold">{stats?.categoryBreakdown?.length || 0} departments</span>
                      </p>
                    </div>

                    {/* Customers */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                      <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-400 font-semibold tracking-wide text-xs uppercase">Active Customers</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-3xl font-extrabold text-slate-100">
                        {stats?.kpis?.totalCustomers !== undefined ? stats.kpis.totalCustomers : '0'}
                      </h3>
                      <p className="text-slate-500 text-xs font-medium mt-2">
                        Registered shoppers
                      </p>
                    </div>

                  </div>

                  {/* CHARTS AND ALERTS */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Charts & Stocks */}
                    <div className="lg:col-span-2 space-y-8">
                      
                      {/* Sales trends bar chart */}
                      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6">
                        <h3 className="text-lg font-bold tracking-tight text-slate-100 mb-6 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                          Monthly Sales Trend (USD)
                        </h3>
                        
                        {stats?.monthlySales && stats.monthlySales.length > 0 ? (
                          <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b border-slate-800 pb-2 px-4">
                            {stats.monthlySales.map((salesItem, index) => {
                              const maxRevenue = Math.max(...stats.monthlySales.map(s => s.revenue), 1);
                              const percentHeight = Math.round((salesItem.revenue / maxRevenue) * 100);
                              return (
                                <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                  {/* Bar Tooltip */}
                                  <div className="absolute top-[-35px] bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-purple-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl pointer-events-none z-10 whitespace-nowrap">
                                    ${salesItem.revenue.toLocaleString()}
                                  </div>
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

                      {/* Stock alerts table */}
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
                                    <td className="py-3.5 font-medium group-hover:text-purple-400 transition-colors">{prod.title || prod.name}</td>
                                    <td className="py-3.5 text-center font-bold text-rose-400">{prod.stock || prod.stockCount} units</td>
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

                    {/* AI Insights Sidebar */}
                    <div className="space-y-6">
                      
                      <div className="bg-gradient-to-br from-purple-900/40 via-slate-900/40 to-slate-900/40 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-[-30px] right-[-30px] w-20 h-20 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 1a1 1 0 01-1 1h-2v2a1 1 0 11-2 0v-2H9a1 1 0 110-2h2V9a1 1 0 012 0v2h2a1 1 0 011 1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold tracking-tight text-slate-100">AI Insights</h3>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          Heuristic engine active. Generating contextual recommendations based on actual purchase volume, catalog trends, and warehouses stock status.
                        </p>

                        <div className="h-0.5 bg-slate-800/80 my-4"></div>

                        {/* Insights List */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                          {insights && insights.length > 0 ? (
                            insights.map((insight, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all duration-300">
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

                                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                  {insight.description}
                                </p>

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
            </>
          )}

          {/* --- TAB VIEW: PRODUCT MANAGEMENT --- */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              {/* Filter controls */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product title..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300"
                  />
                </div>

                {/* Category Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">Filter By Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Products Table container */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl overflow-hidden">
                {productsLoading ? (
                  <div className="p-20 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
                    <span className="text-slate-500 text-sm">Syncing inventory database...</span>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/10">
                          <th className="py-4 px-6">Product Details</th>
                          <th className="py-4 px-6 text-center">Category</th>
                          <th className="py-4 px-6 text-right">Price</th>
                          <th className="py-4 px-6 text-center">Stock</th>
                          <th className="py-4 px-6 text-center">Total Sales</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {filteredProducts.map((product) => {
                          const stockCountVal = product.stock !== undefined ? product.stock : product.stockCount;
                          return (
                            <tr key={product._id} className="text-slate-300 hover:bg-slate-900/20 group transition-all">
                              
                              {/* Title / Description */}
                              <td className="py-4 px-6 max-w-sm">
                                <div className="font-semibold text-slate-200 group-hover:text-purple-400 transition-colors truncate">
                                  {product.title || product.name}
                                </div>
                                <div className="text-xs text-slate-500 truncate mt-0.5">
                                  {product.description || 'No description provided.'}
                                </div>
                              </td>

                              {/* Category */}
                              <td className="py-4 px-6 text-center">
                                <span className="inline-flex py-1 px-3 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-800">
                                  {product.category || 'General'}
                                </span>
                              </td>

                              {/* Price */}
                              <td className="py-4 px-6 text-right font-medium text-slate-200">
                                ${product.price?.toFixed(2)}
                              </td>

                              {/* Stock */}
                              <td className="py-4 px-6 text-center">
                                <span className={`font-bold text-xs ${stockCountVal < 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {stockCountVal} units
                                </span>
                              </td>

                              {/* Sales */}
                              <td className="py-4 px-6 text-center text-slate-400 font-medium">
                                {product.sales !== undefined ? product.sales : 0} units
                              </td>

                              {/* Action buttons */}
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2.5">
                                  
                                  {/* Edit button */}
                                  <button
                                    onClick={() => openEditModal(product)}
                                    className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>

                                  {/* Delete button */}
                                  <button
                                    onClick={() => handleDeleteProduct(product._id, product.title || product.name)}
                                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all cursor-pointer"
                                    title="Delete Product"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>

                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-16 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-slate-300 font-bold text-lg">No Products Found</h3>
                    <p className="text-slate-500 text-sm mt-1">Try refining your search keyword or selecting a different category.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* --- TAB VIEW: AI COPYWRITING TOOLS --- */}
          {activeTab === 'ai-tools' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Product Info Workstation (Inputs) */}
              <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 h-fit space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">Product Specs</h3>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Product Title *</label>
                    <input
                      type="text"
                      value={aiTitle}
                      onChange={(e) => setAiTitle(e.target.value)}
                      placeholder="e.g. Premium Noise-Cancelling Headphones"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category *</label>
                    <select
                      value={aiCategory}
                      onChange={(e) => setAiCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                    >
                      {categories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Features (comma-separated)</label>
                    <textarea
                      rows="4"
                      value={aiFeatures}
                      onChange={(e) => setAiFeatures(e.target.value)}
                      placeholder="e.g. 40h battery, Active Noise Cancellation, wireless bluetooth, travel case"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all resize-none"
                    ></textarea>
                    <p className="text-[10px] text-slate-500 mt-1">Separate key features by commas to guide the copywriting tone.</p>
                  </div>
                </div>

              </div>

              {/* AI Output Generation Panels (Cards) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Description Card */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                  <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-md font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        High-Converting Product Description
                      </h4>
                      <p className="text-xs text-slate-500">Beautiful descriptive copy ready to paste into your catalog.</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {aiDescription && (
                        <button
                          onClick={() => handleCopyToClipboard(aiDescription, 'description')}
                          className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold border transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                            copiedDesc
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                              : 'border-slate-800 bg-slate-900/40 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-300 text-slate-400'
                          }`}
                        >
                          {copiedDesc ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleGenerateAsset('description')}
                        disabled={loadingDesc || loadingAll || !aiTitle.trim()}
                        className="py-1.5 px-3.5 rounded-lg text-xs font-semibold bg-purple-600/15 border border-purple-500/25 hover:bg-purple-600 text-purple-300 hover:text-white transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {loadingDesc ? 'Writing Description...' : 'Generate Description'}
                      </button>
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="bg-slate-950/50 border border-slate-950 rounded-xl p-4 min-h-[120px] max-h-[220px] overflow-y-auto relative flex items-center justify-center">
                    {loadingDesc ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-3 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
                        <span className="text-xs text-slate-500 font-medium">Generating engaging copywriting description...</span>
                      </div>
                    ) : aiDescription ? (
                      <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-line text-left w-full">
                        {aiDescription}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs italic text-center">Fill in specs and click Generate above to draft the copywriting.</span>
                    )}
                  </div>

                </div>

                {/* 2. SEO Tags Card */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                  <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-md font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Search-Optimized SEO Keywords
                      </h4>
                      <p className="text-xs text-slate-500">Optimized meta tags to increase organic discoverability.</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {aiSeoTags.length > 0 && (
                        <button
                          onClick={() => handleCopyToClipboard(aiSeoTags.join(', '), 'seoTags')}
                          className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold border transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                            copiedTags
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                              : 'border-slate-800 bg-slate-900/40 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-300 text-slate-400'
                          }`}
                        >
                          {copiedTags ? 'Copied!' : 'Copy Tags'}
                        </button>
                      )}

                      <button
                        onClick={() => handleGenerateAsset('seoTags')}
                        disabled={loadingTags || loadingAll || !aiTitle.trim()}
                        className="py-1.5 px-3.5 rounded-lg text-xs font-semibold bg-purple-600/15 border border-purple-500/25 hover:bg-purple-600 text-purple-300 hover:text-white transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {loadingTags ? 'Optimizing Tags...' : 'Generate SEO Tags'}
                      </button>
                    </div>
                  </div>

                  {/* Body Tags */}
                  <div className="bg-slate-950/50 border border-slate-950 rounded-xl p-4 min-h-[80px] flex items-center justify-center">
                    {loadingTags ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-3 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
                        <span className="text-xs text-slate-500 font-medium">Analysing keyword algorithms...</span>
                      </div>
                    ) : aiSeoTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 justify-start w-full">
                        {aiSeoTags.map((tag, tIdx) => (
                          <span key={tIdx} className="inline-flex py-1 px-3 rounded-xl text-xs font-semibold bg-blue-950/60 border border-blue-900/40 text-blue-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs italic">Generate tags to view keyword tags.</span>
                    )}
                  </div>

                </div>

                {/* 3. Marketing Caption Card */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                  <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-pink-500/5 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-md font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                        Social Promo & Marketing Caption
                      </h4>
                      <p className="text-xs text-slate-500">Catchy social media captions complete with modern hashtags.</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {aiCaption && (
                        <button
                          onClick={() => handleCopyToClipboard(aiCaption, 'marketingCaption')}
                          className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold border transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                            copiedCaption
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                              : 'border-slate-800 bg-slate-900/40 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-300 text-slate-400'
                          }`}
                        >
                          {copiedCaption ? 'Copied!' : 'Copy Caption'}
                        </button>
                      )}

                      <button
                        onClick={() => handleGenerateAsset('marketingCaption')}
                        disabled={loadingCaption || loadingAll || !aiTitle.trim()}
                        className="py-1.5 px-3.5 rounded-lg text-xs font-semibold bg-purple-600/15 border border-purple-500/25 hover:bg-purple-600 text-purple-300 hover:text-white transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {loadingCaption ? 'Drafting Caption...' : 'Generate Caption'}
                      </button>
                    </div>
                  </div>

                  {/* Body Caption */}
                  <div className="bg-slate-950/50 border border-slate-950 rounded-xl p-4 min-h-[90px] flex items-center justify-center">
                    {loadingCaption ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-3 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
                        <span className="text-xs text-slate-500 font-medium">Composing creative marketing caption...</span>
                      </div>
                    ) : aiCaption ? (
                      <div className="text-slate-300 text-xs leading-relaxed text-left w-full whitespace-pre-wrap">
                        {aiCaption}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs italic">Generate marketing caption to view copy.</span>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* --- ADD PRODUCT MODAL/DRAWER --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          
          {/* Modal Content */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 md:p-8 relative z-10 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                Add New Product
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg border border-transparent hover:border-slate-800 transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddProduct} className="space-y-4">
              
              {/* Product Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Mechanical Gaming Keyboard"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Price & Stock & Sales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Stock count *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Sales</label>
                  <input
                    type="number"
                    min="0"
                    value={formSales}
                    onChange={(e) => setFormSales(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description *</label>
                <textarea
                  required
                  rows="3"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter detailed specifications or product details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all resize-none"
                ></textarea>
              </div>

              {/* Error prompt */}
              {formError && (
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-sm font-semibold text-slate-400 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="py-2.5 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? 'Creating...' : 'Create Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          
          {/* Modal Content */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 md:p-8 relative z-10 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                Edit Product
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg border border-transparent hover:border-slate-800 transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              
              {/* Product Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Mechanical Gaming Keyboard"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Price & Stock & Sales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Stock count *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Sales</label>
                  <input
                    type="number"
                    min="0"
                    value={formSales}
                    onChange={(e) => setFormSales(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description *</label>
                <textarea
                  required
                  rows="3"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter detailed specifications or product details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all resize-none"
                ></textarea>
              </div>

              {/* Error prompt */}
              {formError && (
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-sm font-semibold text-slate-400 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="py-2.5 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
