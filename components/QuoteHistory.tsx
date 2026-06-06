'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckCircle, XCircle, Clock, Trash2, Eye } from 'lucide-react';
import { formatBs, formatUsd } from '@/lib/pricing';

interface QuoteHistoryProps {
  onBack: () => void;
  onViewQuote: (quote: any) => void;
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusIcons: Record<string, any> = {
  draft: Clock,
  sent: Send,
  approved: CheckCircle,
  rejected: XCircle,
};

export default function QuoteHistory({ onBack, onViewQuote }: QuoteHistoryProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = () => {
    fetch('/api/quotes')
      .then((res) => res.json())
      .then((data) => {
        setQuotes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) fetchQuotes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteQuote = async (id: string) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;

    try {
      const res = await fetch('/api/quotes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) fetchQuotes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredQuotes = filter === 'all' ? quotes : quotes.filter((q) => q.status === filter);

  if (loading) return <div className="p-6 text-center">Cargando...</div>;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Presupuestos</h2>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'draft', 'sent', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Todos' : statusLabels[f]}
          </button>
        ))}
      </div>

      {filteredQuotes.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No hay presupuestos</p>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((q) => {
            const StatusIcon = statusIcons[q.status] || Clock;
            return (
              <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{q.clientName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[q.status]}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {statusLabels[q.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      RIF: {q.clientRif || 'N/A'} · {q.paymentMethod === 'bs' ? `Bs ${formatBs(q.totalBs ?? 0)}` : `$${formatUsd(q.totalUsd ?? 0)}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(q.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onViewQuote(q)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Ver"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {q.status === 'draft' && (
                      <button
                        onClick={() => updateStatus(q.id, 'sent')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Marcar enviado"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {q.status === 'sent' && (
                      <>
                        <button
                          onClick={() => updateStatus(q.id, 'approved')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Aprobado"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(q.id, 'rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Rechazado"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteQuote(q.id)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
