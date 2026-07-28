'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Save, CheckCircle, Upload, X } from 'lucide-react';

interface ProductFormProps {
  onProductAdded: () => void;
  onBack: () => void;
}

export default function ProductForm({ onProductAdded, onBack }: ProductFormProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [costUsd, setCostUsd] = useState('');
  const [profitMargin, setProfitMargin] = useState('45');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const salePrice = costUsd && profitMargin
    ? parseFloat(costUsd) / (1 - parseFloat(profitMargin) / 100)
    : 0;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Imagen muy grande (máx 2MB)'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setImageUrl(url);
    } else {
      alert('Error al subir la imagen');
    }
    setUploading(false);
    e.target.value = '';
  };

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
        body: JSON.stringify({ name, sku, description, costUsd: cost, profitMargin: margin, category, imageUrl }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setName(''); setSku(''); setDescription(''); setCostUsd(''); setProfitMargin('45');
          setCategory(''); setImageUrl(''); setSaved(false);
          onProductAdded();
        }, 800);
      } else {
        alert('Error al guardar');
      }
    } catch { alert('Error de conexión'); }
    finally { setSaving(false); }
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
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Código)</label>
          <input type="text" value={sku} onChange={(e) => setSku(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: LPTP-001" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto del producto</label>
          {imageUrl ? (
            <div className="relative inline-block">
              <img src={imageUrl} alt="Vista previa" className="w-24 h-24 rounded-lg object-cover border" />
              <button type="button" onClick={() => setImageUrl('')}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Foto</span>
                </>
              )}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
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
            <p className="text-green-800 font-medium">Precio de venta:</p>
            <p className="text-green-700 text-lg font-bold">${salePrice.toFixed(2)} USD</p>
          </div>
        )}

        <button type="submit" disabled={saving || saved || uploading}
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
