'use client';

// force-dynamic: evita el prerender estático — la página usa window.location en useEffect
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProductShowcase() {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { setError('Producto no encontrado'); setLoading(false); return; }

    fetch(`/api/producto-publico?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProduct(data);
        setLoading(false);
      })
      .catch(() => { setError('Error al cargar'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <p className="text-gray-500">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <a href="/" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-sm font-medium text-blue-600">Tecnotización</span>
          </a>
        </div>

        {product.imageUrl && (
          <div className="relative w-full bg-black">
            <img src={product.imageUrl} alt={product.name}
              className="w-full h-64 object-cover" />
          </div>
        )}

        <div className="bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          {product.category && (
            <p className="text-sm text-gray-500 mt-1">{product.category}</p>
          )}

          <div className="mt-6 space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-green-600">
                ${product.salePriceUsd.toFixed(2)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                USD
              </span>
            </div>
          </div>

          {product.description && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Descripción</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `*${product.name}*\n\n💰 Precio: $${product.salePriceUsd.toFixed(2)} USD\n${product.description ? `\n📝 ${product.description}` : ''}\n\n📱 Consulta por Tecnotización`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-500 text-white text-center py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
