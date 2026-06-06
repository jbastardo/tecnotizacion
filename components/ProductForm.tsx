'use client';

import { useState } from 'react';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';

interface ProductFormProps {
  onProductAdded: () => void;
  onBack: () => void;
}

export default function ProductForm({ onProductAdded, onBack }: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [costUsd, setCostUsd] = useState('');
  const [profitMargin, setProfitMargin] = useState('45');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const salePrice = costUsd && profitMargin
    ? parseFloat(costUsd) / (1 - parseFloat(profitMargin) / 100)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(costUsd);
    const margin = parseFloat(profitMargin);
    if (isNaN(cost) || cost <= 0) return alert('El costo debe ser mayor a 0');
    if (isNaN(margin) || margin <= 0 || margin >= 100) return alert('El margen debe estar entre 1 y 99%');

    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, costUsd: cost, profitMargin: margin, category }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setName(''); setDescription(''); setCostUsd(''); setProfitMargin('45'); setCategory('');
          setSaved(false);
          onProductAdded();
        }, 800);
      } else {
        alert('Error al guardar el producto');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Agregar Producto</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Laptop HP 15" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descripción opcional" rows={2} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Computadoras" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo (USD) *</label>
            <input type="number" value={costUsd} onChange={(e) => setCostUsd(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00" step="0.01" min="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Margen (%) *</label>
            <input type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)}
              className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="45" step="1" min="1" max="99" required />
          </div>
        </div>

        {salePrice > 0 && (
          <div className="bg-green-50 p-3 rounded-lg text-sm border border-green-200">
            <p className="text-green-800 font-medium">Vista previa de precio de venta:</p>
            <p className="text-green-700 text-lg font-bold">${salePrice.toFixed(2)} USD</p>
            <p className="text-green-600 text-xs">Utilidad: ${(salePrice - parseFloat(costUsd || '0')).toFixed(2)} ({profitMargin}% del precio de venta)</p>
          </div>
        )}

        <button type="submit" disabled={saving || saved}
          className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
          }`}>
          {saved ? <><CheckCircle className="w-5 h-5" /> Guardado!</> :
           saving ? 'Guardando...' : <><Save className="w-5 h-5" /> Guardar Producto</>}
        </button>
      </form>
    </div>
  );
}
