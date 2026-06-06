'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Send, Edit2 } from 'lucide-react';
import { calculatePricing, formatBs, formatUsd } from '@/lib/pricing';

interface QuoteBuilderProps {
  products: any[];
  clients: any[];
  onQuoteCreated: (quote: any) => void;
}

export default function QuoteBuilder({ products, clients, onQuoteCreated }: QuoteBuilderProps) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bs' | 'cash' | 'binance' | 'divisas'>('bs');
  const [items, setItems] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [rates, setRates] = useState({ bcv: 0, promedio: 0 });
  const [manualBcv, setManualBcv] = useState('');
  const [manualPromedio, setManualPromedio] = useState('');
  const [needsManual, setNeedsManual] = useState(false);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    fetch('/api/tasas')
      .then((res) => res.json())
      .then((data) => {
        if (data.bcv > 0 && data.promedio > 0) {
          setRates(data);
          setNeedsManual(false);
        } else {
          setNeedsManual(true);
        }
        setLoadingRates(false);
      })
      .catch(() => {
        setNeedsManual(true);
        setLoadingRates(false);
      });
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId);
      if (client) {
        setClientName(client.name);
        setClientPhone(client.phone || '');
      }
    }
  }, [selectedClientId, clients]);

  const activeBcv = manualBcv ? parseFloat(manualBcv) : rates.bcv;
  const activePromedio = manualPromedio ? parseFloat(manualPromedio) : rates.promedio;
  const ivaRate = 16;

  const addItem = () => {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;
    if (activeBcv === 0 && paymentMethod === 'bs') {
      alert('Ingresa la tasa BCV para calcular precios en Bs');
      return;
    }

    const qty = parseInt(quantity) || 1;
    const productMargin = product.profitMargin || 45;
    const pricing = calculatePricing({
      costUsd: product.costUsd,
      quantity: qty,
      paymentMethod,
      profitMargin: productMargin,
      bcvRate: activeBcv,
      promedioRate: activePromedio,
      ivaRate,
    });

    setItems([
      ...items,
      {
        id: Date.now().toString(),
        product,
        quantity: qty,
        pricing,
      },
    ]);

    setSelectedProduct('');
    setQuantity('1');
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const totals = items.reduce(
    (acc, item) => ({
      usd: acc.usd + item.pricing.subtotalUsd,
      bs: acc.bs + item.pricing.subtotalBs,
    }),
    { usd: 0, bs: 0 }
  );

  const createQuote = () => {
    const quote = {
      id: Date.now().toString(),
      clientName,
      clientPhone,
      paymentMethod,
      items,
      totals,
      rates: { bcv: activeBcv, promedio: activePromedio },
      createdAt: new Date().toLocaleDateString('es-VE'),
    };

    onQuoteCreated(quote);
  };

  const sendWhatsApp = () => {
    let message = `*PRESUPUESTO - TECNOTIZACIÓN*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Cliente: ${clientName}\n`;
    message += `Fecha: ${new Date().toLocaleDateString('es-VE')}\n`;
    message += `Forma de Pago: ${paymentMethod.toUpperCase()}\n`;
    if (paymentMethod === 'bs') {
      message += `Tasa BCV: Bs ${activeBcv.toFixed(2)}\n`;
    }
    message += `\n*PRODUCTOS:*\n\n`;

    items.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   Cant: ${item.quantity}\n`;
      if (paymentMethod === 'bs') {
        message += `   P/U: Bs ${formatBs(item.pricing.salePriceBs)}\n`;
        message += `   Subtotal: Bs ${formatBs(item.pricing.subtotalBs)}\n`;
      } else {
        message += `   P/U: $${formatUsd(item.pricing.salePriceUsd)}\n`;
        message += `   Subtotal: $${formatUsd(item.pricing.subtotalUsd)}\n`;
      }
      message += `\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    if (paymentMethod === 'bs') {
      message += `*TOTAL: Bs ${formatBs(totals.bs)}*\n`;
    } else {
      message += `*TOTAL: $${formatUsd(totals.usd)}*\n`;
    }
    message += `\nPresupuesto válido por 7 días.\n`;
    message += `¡Gracias por su preferencia!`;

    const phone = clientPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Nuevo Presupuesto</h2>
        </div>

        <div className="space-y-4">
          {clients.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente Guardado
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Nuevo cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone || 'Sin tel.'}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono (WhatsApp)
            </label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="584121234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forma de Pago *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="bs">Bolívares (BCV)</option>
              <option value="cash">Efectivo USD</option>
              <option value="binance">Binance (USDT)</option>
              <option value="divisas">Divisas</option>
            </select>
          </div>

          {loadingRates ? (
            <p className="text-sm text-gray-500">Cargando tasas...</p>
          ) : needsManual || activeBcv === 0 ? (
            <div className="bg-amber-50 p-3 rounded-lg text-sm space-y-2">
              <p className="font-medium text-amber-800">Ingresa tasas manualmente:</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-amber-700">BCV</label>
                  <input
                    type="number"
                    value={manualBcv}
                    onChange={(e) => setManualBcv(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 rounded text-sm"
                    placeholder="Ej: 85.50"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-xs text-amber-700">Promedio</label>
                  <input
                    type="number"
                    value={manualPromedio}
                    onChange={(e) => setManualPromedio(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 rounded text-sm"
                    placeholder="Ej: 89.20"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-medium">Tasas actuales:</p>
              <p>BCV: Bs {rates.bcv.toFixed(2)}</p>
              <p>Promedio: Bs {rates.promedio.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Agregar Productos</h3>
        
        <div className="space-y-3">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccionar producto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - ${formatUsd(p.costUsd)} (utilidad: {p.profitMargin || 45}%)
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
            <button
              onClick={addItem}
              disabled={!selectedProduct}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Agregar
            </button>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Items del Presupuesto</h3>
          
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                    <p className="text-xs text-gray-500">Utilidad: {item.product.profitMargin || 45}%</p>
                    {paymentMethod === 'bs' ? (
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">
                          P/U: Bs {formatBs(item.pricing.salePriceBs)}
                        </p>
                        <p className="text-xs text-gray-500">
                          (${formatUsd(item.pricing.salePriceUsd)} × Bs {activeBcv.toFixed(2)} + IVA)
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        P/U: ${formatUsd(item.pricing.salePriceUsd)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {paymentMethod === 'bs' ? (
                        <p className="font-bold text-blue-600">
                          Bs {formatBs(item.pricing.subtotalBs)}
                        </p>
                      ) : (
                        <p className="font-bold text-blue-600">
                          ${formatUsd(item.pricing.subtotalUsd)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">TOTAL:</span>
              {paymentMethod === 'bs' ? (
                <span className="text-2xl font-bold text-blue-600">
                  Bs {formatBs(totals.bs)}
                </span>
              ) : (
                <span className="text-2xl font-bold text-blue-600">
                  ${formatUsd(totals.usd)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {items.length > 0 && clientName && (
        <div className="space-y-3">
          <button
            onClick={sendWhatsApp}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-6 h-6" />
            Enviar por WhatsApp
          </button>
          <button
            onClick={createQuote}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Guardar Presupuesto
          </button>
        </div>
      )}
    </div>
  );
}
