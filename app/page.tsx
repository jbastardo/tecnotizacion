'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Settings, Package } from 'lucide-react';
import ProductForm from '@/components/ProductForm';
import QuoteBuilder from '@/components/QuoteBuilder';
import QuoteView from '@/components/QuoteView';

type View = 'home' | 'products' | 'builder' | 'quote';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuote, setCurrentQuote] = useState<any>(null);

  const fetchProducts = useCallback(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductAdded = () => {
    fetchProducts();
    setCurrentView('home');
  };

  const handleQuoteCreated = (quote: any) => {
    setCurrentQuote(quote);
    setCurrentView('quote');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Tecnotización</h1>
          <p className="text-blue-100 text-sm">Presupuestos Profesionales</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-24">
        {currentView === 'home' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentView('products')}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-3"
              >
                <Package className="w-10 h-10 text-blue-600" />
                <span className="font-semibold text-gray-800">Productos</span>
              </button>
              <button
                onClick={() => setCurrentView('builder')}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-3"
              >
                <FileText className="w-10 h-10 text-green-600" />
                <span className="font-semibold text-gray-800">Presupuesto</span>
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Productos registrados: {loading ? 'Cargando...' : products.length}</p>
                <p>Presupuestos creados: 0</p>
              </div>
            </div>

            {products.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Productos</h2>
                <div className="space-y-2">
                  {products.map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">{p.name}</p>
                        {p.category && <p className="text-xs text-gray-500">{p.category}</p>}
                      </div>
                      <p className="text-sm font-semibold text-blue-600">${parseFloat(p.costUsd).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'products' && (
          <ProductForm onProductAdded={handleProductAdded} />
        )}

        {currentView === 'builder' && (
          <QuoteBuilder
            products={products}
            onQuoteCreated={handleQuoteCreated}
          />
        )}

        {currentView === 'quote' && currentQuote && (
          <QuoteView quote={currentQuote} onBack={() => setCurrentView('home')} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-around p-3">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center gap-1 ${
              currentView === 'home' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Inicio</span>
          </button>
          <button
            onClick={() => setCurrentView('products')}
            className={`flex flex-col items-center gap-1 ${
              currentView === 'products' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <Package className="w-6 h-6" />
            <span className="text-xs">Productos</span>
          </button>
          <button
            onClick={() => setCurrentView('builder')}
            className={`flex flex-col items-center gap-1 ${
              currentView === 'builder' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs">Nuevo</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 text-gray-500"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs">Ajustes</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
