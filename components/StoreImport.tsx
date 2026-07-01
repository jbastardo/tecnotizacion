'use client';

import { useState } from 'react';
import { ArrowLeft, Search, Download, Loader2, ShoppingBag } from 'lucide-react';

interface StoreImportProps {
  onBack: () => void;
}

export default function StoreImport({ onBack }: StoreImportProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const searchStore = async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/store-products?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  const importProduct = async (product: any) => {
    setImportingId(product.sku);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: product.sku, name: product.name, costUsd: product.costUsd,
          category: product.category || 'Importado', imageUrl: product.imageUrl,
          description: product.description, profitMargin: 45,
        }),
      });
      if (res.ok) {
        setProducts(products.map((p: any) =>
          p.sku === product.sku ? { ...p, imported: true } : p
        ));
      }
    } catch { alert('Error al importar'); }
    finally { setImportingId(null); }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Buscar en Tu Tecno Tienda</h2>
      </div>

      <div className="flex gap-2 mb-4">
        <input type="text" value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchStore()}
          placeholder="Buscar: hikvision, ubiquiti, mikrotik..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
        <button onClick={searchStore} disabled={loading || query.length < 2}
          className="bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-300 flex items-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 py-4">Buscando productos...</p>}

      {!loading && searched && products.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No se encontraron productos para "{query}" en Tu Tecno Tienda
        </p>
      )}

      {products.length > 0 && (
        <div className="space-y-3">
          {products.map((p: any) => (
            <div key={p.sku} className="border border-gray-200 rounded-lg p-4 flex gap-3">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{p.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">SKU: {p.sku}</p>
                <p className="text-sm font-bold text-green-600 mt-1">${p.costUsd.toFixed(2)} USD</p>
              </div>
              <div className="flex-shrink-0 flex items-center">
                {p.imported ? (
                  <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded-lg">✓ En catálogo</span>
                ) : (
                  <button onClick={() => importProduct(p)} disabled={importingId === p.sku}
                    className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-1">
                    {importingId === p.sku ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    Importar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
