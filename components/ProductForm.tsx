'use client';

import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

interface ProductFormProps {
  onProductAdded: () => void;
}

export default function ProductForm({ onProductAdded }: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [costUsd, setCostUsd] = useState('');
  const [profitMargin, setProfitMargin] = useState('45');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          costUsd: parseFloat(costUsd),
          profitMargin: parseFloat(profitMargin) || 45,
          category,
        }),
      });

      if (res.ok) {
        setName('');
        setDescription('');
        setCostUsd('');
        setProfitMargin('45');
        setCategory('');
        onProductAdded();
      } else {
        alert('Error al guardar el producto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Agregar Producto</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Producto *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Laptop HP 15"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descripción opcional del producto"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Computadoras"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio de Costo (USD) *
            </label>
            <input
              type="number"
              value={costUsd}
              onChange={(e) => setCostUsd(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Margen de Utilidad (%) *
            </label>
            <input
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="45"
              step="1"
              min="0"
              max="1000"
              required
            />
          </div>
        </div>

        {costUsd && profitMargin && (
          <div className="bg-green-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-green-800">Vista previa:</p>
            <p className="text-green-700">
              Precio de venta: $
              {(parseFloat(costUsd) * (1 + parseFloat(profitMargin) / 100)).toFixed(2)}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
}
