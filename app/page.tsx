'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Package, Users, ClipboardList, LogOut } from 'lucide-react';
import ProductForm from '@/components/ProductForm';
import ProductList from '@/components/ProductList';
import ClientManager from '@/components/ClientManager';
import QuoteBuilder from '@/components/QuoteBuilder';
import QuoteView from '@/components/QuoteView';
import QuoteHistory from '@/components/QuoteHistory';

type View = 'home' | 'products' | 'productList' | 'clients' | 'builder' | 'history' | 'viewQuote';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingQuote, setViewingQuote] = useState<any>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clientes');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchClients();
  }, [fetchProducts, fetchClients]);

  const handleProductAdded = () => {
    fetchProducts();
    setCurrentView('home');
  };

  const handleProductListBack = () => {
    fetchProducts(); // refresh in case of edits/deletes
    setCurrentView('home');
  };

  const handleClientsBack = () => {
    fetchClients(); // refresh in case of changes
    setCurrentView('home');
  };

  const handleViewQuote = (quote: any) => {
    setViewingQuote(quote);
    setCurrentView('viewQuote');
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Tecnotización</h1>
            <p className="text-blue-100 text-sm">Presupuestos Profesionales</p>
          </div>
          <button onClick={handleLogout} title="Cerrar sesión"
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-24">

        {currentView === 'home' && (
          <div className="space-y-4 mt-2">
            {/* Primary action - full width */}
            <button onClick={() => { fetchProducts(); fetchClients(); setCurrentView('builder'); }}
              className="w-full bg-blue-600 text-white p-5 rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center gap-4">
              <FileText className="w-10 h-10 text-blue-200 flex-shrink-0" />
              <div className="text-left">
                <p className="font-bold text-lg">Nuevo Presupuesto</p>
                <p className="text-blue-200 text-sm">Crear y enviar por WhatsApp</p>
              </div>
            </button>

            {/* Secondary actions grid */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCurrentView('history')}
                className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2">
                <ClipboardList className="w-9 h-9 text-indigo-600" />
                <span className="font-semibold text-gray-800 text-sm">Presupuestos</span>
              </button>
              <button onClick={() => setCurrentView('clients')}
                className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2">
                <Users className="w-9 h-9 text-orange-600" />
                <span className="font-semibold text-gray-800 text-sm">Clientes</span>
              </button>
              <button onClick={() => setCurrentView('products')}
                className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2">
                <Plus className="w-9 h-9 text-green-600" />
                <span className="font-semibold text-gray-800 text-sm">Agregar Producto</span>
              </button>
              <button onClick={() => setCurrentView('productList')}
                className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2">
                <Package className="w-9 h-9 text-purple-600" />
                <span className="font-semibold text-gray-800 text-sm">Ver Productos</span>
              </button>
            </div>

            {/* Summary */}
            <div className="bg-white p-5 rounded-xl shadow-md">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumen</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{loading ? '—' : products.length}</p>
                  <p className="text-sm text-gray-500">Productos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{clients.length}</p>
                  <p className="text-sm text-gray-500">Clientes</p>
                </div>
              </div>
            </div>

            {/* Recent products - no margin shown */}
            {products.length > 0 && (
              <div className="bg-white p-5 rounded-xl shadow-md">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Productos Recientes
                </h2>
                <div className="divide-y divide-gray-100">
                  {products.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-2.5">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                        {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
                      </div>
                      <p className="text-sm font-semibold text-blue-600">
                        ${(p.costUsd ?? 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                {products.length > 4 && (
                  <button onClick={() => setCurrentView('productList')}
                    className="mt-2 text-sm text-blue-600 hover:underline w-full text-center">
                    Ver todos ({products.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {currentView === 'products' && (
          <ProductForm
            onProductAdded={handleProductAdded}
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'productList' && (
          <ProductList onBack={handleProductListBack} />
        )}

        {currentView === 'clients' && (
          <ClientManager onBack={handleClientsBack} />
        )}

        {currentView === 'history' && (
          <QuoteHistory onBack={() => setCurrentView('home')} onViewQuote={handleViewQuote} />
        )}

        {currentView === 'builder' && (
          <QuoteBuilder
            products={products}
            clients={clients}
            onBack={() => setCurrentView('home')}
            onSaved={() => setCurrentView('history')}
          />
        )}

        {currentView === 'viewQuote' && viewingQuote && (
          <QuoteView
            quote={viewingQuote}
            onBack={() => setCurrentView('history')}
          />
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-around p-2">
          {[
            { view: 'home' as View, label: 'Inicio', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            ), action: () => setCurrentView('home') },
            { view: 'builder' as View, label: 'Nuevo', icon: <Plus className="w-6 h-6" />, action: () => { fetchProducts(); fetchClients(); setCurrentView('builder'); } },
            { view: 'history' as View, label: 'Presupuestos', icon: <ClipboardList className="w-6 h-6" />, action: () => setCurrentView('history') },
            { view: 'productList' as View, label: 'Productos', icon: <Package className="w-6 h-6" />, action: () => { fetchProducts(); setCurrentView('productList'); } },
            { view: 'clients' as View, label: 'Clientes', icon: <Users className="w-6 h-6" />, action: () => { fetchClients(); setCurrentView('clients'); } },
          ].map(({ view, label, icon, action }) => (
            <button key={view} onClick={action}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ${
                currentView === view ? 'text-blue-600' : 'text-gray-500'
              }`}>
              {icon}
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
