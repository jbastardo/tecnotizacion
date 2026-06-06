'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Save, X } from 'lucide-react';

interface ProductListProps {
  onBack: () => void;
}

export default function ProductList({ onBack }: ProductListProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const startEdit = (product: any) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      description: product.description || '',
      costUsd: product.costUsd,
      profitMargin: product.profitMargin,
      category: product.category || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;

    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6 text-center">Cargando...</div>;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Productos</h2>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No hay productos registrados</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === p.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nombre"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Descripción"
                    rows={2}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={editForm.costUsd}
                      onChange={(e) => setEditForm({ ...editForm, costUsd: parseFloat(e.target.value) })}
                      className="px-3 py-2 border rounded-lg"
                      placeholder="Costo USD"
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={editForm.profitMargin}
                      onChange={(e) => setEditForm({ ...editForm, profitMargin: parseFloat(e.target.value) })}
                      className="px-3 py-2 border rounded-lg"
                      placeholder="Margen %"
                      step="1"
                    />
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="px-3 py-2 border rounded-lg"
                      placeholder="Categoría"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> Guardar
                    </button>
                    <button onClick={cancelEdit} className="px-4 bg-gray-200 py-2 rounded-lg flex items-center gap-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">{p.name}</h3>
                    {p.category && <p className="text-xs text-gray-500">{p.category}</p>}
                    <p className="text-sm text-gray-600 mt-1">
                      Costo: ${p.costUsd.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
