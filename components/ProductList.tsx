'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Edit2, Trash2, Save, X, Upload, Download, FileSpreadsheet, Share2 } from 'lucide-react';

interface ProductListProps {
  onBack: () => void;
}

export default function ProductList({ onBack }: ProductListProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = () => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditForm({
      name: p.name, sku: p.sku || '', description: p.description || '', costUsd: p.costUsd,
      profitMargin: p.profitMargin, category: p.category || '', imageUrl: p.imageUrl || '',
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async () => {
    const res = await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, ...editForm }),
    });
    if (res.ok) { setEditingId(null); fetchProducts(); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await fetch('/api/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchProducts();
  };

  const handlePhotoUpload = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Imagen muy grande (máx 2MB)'); return; }

    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const { url } = await res.json();
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, imageUrl: url }),
      });
      fetchProducts();
    } else {
      alert('Error al subir imagen');
    }
    e.target.value = '';
  };

  const handleExport = () => {
    window.location.href = '/api/products/export';
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/products/import', { method: 'POST', body: fd });
    const data = await res.json();
    setImporting(false);
    if (res.ok) {
      alert(`¡${data.imported} productos importados!`);
      fetchProducts();
    } else {
      alert('Error al importar. Revisa el formato del archivo.');
    }
    e.target.value = '';
  };

  const handleShareProduct = (p: any) => {
    const pageUrl = `${window.location.origin}/producto?id=${p.id}`;
    const message = `*${p.name}*\n💰 $${(p.costUsd / (1 - (p.profitMargin || 45) / 100)).toFixed(2)} USD\n\n${p.description || ''}\n\nInfo: ${pageUrl}`;
    window.location.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Mis Productos</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
            title="Exportar Excel">
            <Download className="w-4 h-4" />
          </button>
          <label className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 cursor-pointer transition-colors"
            title="Importar Excel">
            <FileSpreadsheet className="w-4 h-4" />
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {importing && <p className="text-sm text-purple-600 mb-3">Importando productos...</p>}

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No hay productos</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === p.id ? (
                <div className="space-y-3">
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium" placeholder="Nombre" />
                  <input type="text" value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium" placeholder="SKU (codigo)" />
                  <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900" placeholder="Descripcion" rows={2} />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" value={editForm.costUsd} onChange={(e) => setEditForm({ ...editForm, costUsd: parseFloat(e.target.value) })}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium" placeholder="Costo" step="0.01" />
                    <input type="number" value={editForm.profitMargin} onChange={(e) => setEditForm({ ...editForm, profitMargin: parseFloat(e.target.value) })}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium" placeholder="Margen %" />
                    <input type="text" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium" placeholder="Categoria" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> Guardar
                    </button>
                    <button onClick={cancelEdit} className="px-4 bg-gray-200 py-2 rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex gap-3">
                    <label className="relative cursor-pointer flex-shrink-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                          <Upload className="w-5 h-5" />
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => handlePhotoUpload(p.id, e)} />
                    </label>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                          {p.category && <p className="text-xs text-gray-500">{p.category}</p>}
                          <p className="text-sm text-gray-800 font-medium mt-1">
                            Costo: ${p.costUsd.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => handleShareProduct(p)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Compartir WhatsApp">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => startEdit(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteProduct(p.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
