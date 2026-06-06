'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Save, X, Plus } from 'lucide-react';

interface ClientManagerProps {
  onBack: () => void;
}

export default function ClientManager({ onBack }: ClientManagerProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = () => {
    fetch('/api/clientes')
      .then((res) => res.json())
      .then((data) => {
        setClients(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const addClient = async () => {
    if (!newClient.name) return;

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });

      if (res.ok) {
        setNewClient({ name: '', phone: '', email: '' });
        setShowAdd(false);
        fetchClients();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar');
    }
  };

  const startEdit = (client: any) => {
    setEditingId(client.id);
    setEditForm({ name: client.name, phone: client.phone || '', email: client.email || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      const res = await fetch('/api/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchClients();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar');
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;

    try {
      const res = await fetch('/api/clientes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) fetchClients();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="p-6 text-center">Cargando...</div>;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Clientes</h2>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg space-y-3">
          <input
            type="text"
            value={newClient.name}
            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Nombre *"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="tel"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              placeholder="Teléfono"
            />
            <input
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              placeholder="Email"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addClient} className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Guardar
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 bg-gray-200 py-2 rounded-lg flex items-center gap-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No hay clientes registrados</p>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <div key={c.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === c.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nombre"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="px-3 py-2 border rounded-lg"
                      placeholder="Teléfono"
                    />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="px-3 py-2 border rounded-lg"
                      placeholder="Email"
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
                    <h3 className="font-semibold text-gray-800">{c.name}</h3>
                    <p className="text-sm text-gray-500">{c.phone || 'Sin teléfono'} · {c.email || 'Sin email'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteClient(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
