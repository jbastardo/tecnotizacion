'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Send, Loader2, CheckCircle } from 'lucide-react';
import { calculatePricing, formatBs, formatUsd } from '@/lib/pricing';

interface QuoteBuilderProps {
  products: any[];
  clients: any[];
  onBack: () => void;
  onSaved: () => void;
}

export default function QuoteBuilder({ products, clients, onBack, onSaved }: QuoteBuilderProps) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bs' | 'cash' | 'binance' | 'divisas'>('bs');
  const [items, setItems] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [rates, setRates] = useState({ bcv: 0, promedio: 0, lastUpdated: '' });
  const [loadingRates, setLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/tasas')
      .then((res) => res.json())
      .then((data) => {
        if (data.bcv > 0 && data.promedio > 0) {
          setRates(data);
          setRatesError(false);
        } else {
          setRatesError(true);
        }
        setLoadingRates(false);
      })
      .catch(() => { setRatesError(true); setLoadingRates(false); });
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find((c: any) => c.id === selectedClientId);
      if (client) {
        setClientName(client.name);
        setClientPhone(client.phone || '');
      }
    }
  }, [selectedClientId, clients]);

  const activeBcv = rates.bcv;
  const activePromedio = rates.promedio;

  const addItem = () => {
    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;
    if (paymentMethod === 'bs' && activeBcv === 0) {
      alert('Las tasas aún no cargaron. Espera un momento.');
      return;
    }
    const qty = Math.max(1, parseInt(quantity) || 1);
    const pricing = calculatePricing({
      costUsd: product.costUsd,
      quantity: qty,
      paymentMethod,
      profitMargin: product.profitMargin || 45,
      bcvRate: activeBcv,
      promedioRate: activePromedio,
    });
    setItems([...items, { id: Date.now().toString(), product, quantity: qty, pricing }]);
    setSelectedProduct('');
    setQuantity('1');
  };

  const removeItem = (id: string) => setItems(items.filter((item) => item.id !== id));

  const totals = items.reduce(
    (acc, item) => ({ usd: acc.usd + item.pricing.totalUsd, bs: acc.bs + item.pricing.totalBs }),
    { usd: 0, bs: 0 }
  );

  const saveQuote = async (status: 'draft' | 'sent') => {
    if (!clientName) { alert('Ingresa el nombre del cliente'); return false; }
    if (items.length === 0) { alert('Agrega al menos un producto'); return false; }

    setSaving(true);
    try {
      // Auto-save new client if not selected from list
      if (!selectedClientId && clientName) {
        await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: clientName, phone: clientPhone }),
        }).catch(() => {});
      }

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          paymentMethod,
          totalUsd: totals.usd,
          totalBs: totals.bs,
          status,
          rates: { bcv: activeBcv, promedio: activePromedio },
          items: items.map((item) => ({
            id: item.id,
            product: { id: item.product?.id, name: item.product?.name, costUsd: item.product?.costUsd },
            quantity: item.quantity,
            pricing: item.pricing,
          })),
        }),
      });

      if (res.ok) {
        return true;
      } else {
        const err = await res.json();
        alert('Error al guardar: ' + (err.error || 'Error desconocido'));
        return false;
      }
    } catch (e) {
      alert('Error de conexión al guardar el presupuesto');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const ok = await saveQuote('draft');
    if (ok) onSaved();
  };

  const handleSendWhatsApp = async () => {
    if (!clientName) { alert('Ingresa el nombre del cliente'); return; }
    if (items.length === 0) { alert('Agrega al menos un producto'); return; }

    let message = `*PRESUPUESTO - TECNOTIZACIÓN*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Cliente: ${clientName}\n`;
    message += `Fecha: ${new Date().toLocaleDateString('es-VE')}\n`;
    message += `Forma de Pago: ${
      paymentMethod === 'bs' ? 'Bolívares (BCV)' :
      paymentMethod === 'cash' ? 'Efectivo USD' :
      paymentMethod === 'binance' ? 'Binance (USDT)' : 'Divisas'}\n`;
    if (paymentMethod === 'bs') message += `Tasa BCV: Bs ${activeBcv.toFixed(2)}\n`;
    message += `\n*PRODUCTOS:*\n\n`;

    items.forEach((item, i) => {
      message += `${i + 1}. ${item.product.name}\n   Cant: ${item.quantity}\n`;
      if (paymentMethod === 'bs') {
        message += `   P/U: Bs ${formatBs(item.pricing.salePriceBs + item.pricing.ivaAmount)}\n`;
        message += `   (Bs ${formatBs(item.pricing.salePriceBs)} + IVA 16%)\n`;
        message += `   Subtotal: Bs ${formatBs(item.pricing.totalBs)}\n\n`;
      } else {
        message += `   P/U: $${formatUsd(item.pricing.salePriceUsd)}\n`;
        message += `   Subtotal: $${formatUsd(item.pricing.totalUsd)}\n\n`;
      }
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += paymentMethod === 'bs'
      ? `*TOTAL: Bs ${formatBs(totals.bs)}*\n`
      : `*TOTAL: $${formatUsd(totals.usd)}*\n`;
    message += `\nPresupuesto válido por 7 días.\n¡Gracias por su preferencia!`;

    const phone = clientPhone.replace(/[^0-9]/g, '');
    const waUrl = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    // Save first, then redirect to WhatsApp
    const ok = await saveQuote('sent');

    // Use location.href for reliable app launch on mobile (no popup blocker issues)
    window.location.href = waUrl;

    if (ok) setTimeout(() => onSaved(), 1000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Nuevo Presupuesto</h2>
        </div>

        <div className="space-y-4">
          {/* Client selector */}
          {clients.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente guardado</label>
              <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">-- Nuevo cliente --</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}{c.rif ? ` · ${c.rif}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
            <input type="text" value={clientName}
              onChange={(e) => { setClientName(e.target.value); setSelectedClientId(''); }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre completo" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
            <input type="tel" value={clientPhone}
              onChange={(e) => { setClientPhone(e.target.value); setSelectedClientId(''); }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="584121234567" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago *</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="bs">Bolívares (BCV)</option>
              <option value="cash">Efectivo USD</option>
              <option value="binance">Binance (USDT)</option>
              <option value="divisas">Divisas</option>
            </select>
          </div>

          {/* Rates display */}
          {loadingRates ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando tasas del día...
            </div>
          ) : ratesError || activeBcv === 0 ? (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800">
              No se pudieron cargar las tasas automáticamente.
            </div>
          ) : (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-blue-800">Tasas del día:</p>
              <div className="flex gap-4 mt-1">
                <span className="text-blue-700">BCV: <strong>Bs {activeBcv.toFixed(2)}</strong></span>
                <span className="text-blue-700">Promedio: <strong>Bs {activePromedio.toFixed(2)}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add products */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Agregar Productos</h3>
        <div className="space-y-3">
          <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Seleccionar producto...</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} — ${formatUsd(p.costUsd)}</option>
            ))}
          </select>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-20 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                min="1" />
            </div>
            <button onClick={addItem} disabled={!selectedProduct}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5">
              <Plus className="w-5 h-5" /> Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Items del Presupuesto</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.product.name}</h4>
                    <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                    {paymentMethod === 'bs' ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-sm text-gray-600">
                          P/U: Bs {formatBs(item.pricing.salePriceBs + item.pricing.ivaAmount)}
                          <span className="text-xs text-gray-400"> (incluye IVA 16%)</span>
                        </p>
                        <p className="text-sm font-semibold text-blue-600">
                          Subtotal: Bs {formatBs(item.pricing.totalBs)}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-sm text-gray-600">P/U: ${formatUsd(item.pricing.salePriceUsd)}</p>
                        <p className="text-sm font-semibold text-blue-600">
                          Subtotal: ${formatUsd(item.pricing.totalUsd)}
                        </p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">TOTAL:</span>
              <span className="text-2xl font-bold text-blue-600">
                {paymentMethod === 'bs' ? `Bs ${formatBs(totals.bs)}` : `$${formatUsd(totals.usd)}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {items.length > 0 && clientName && (
        <div className="space-y-3 pb-2">
          <button onClick={handleSendWhatsApp} disabled={saving}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            Enviar por WhatsApp
          </button>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Guardar Presupuesto
          </button>
        </div>
      )}
    </div>
  );
}
