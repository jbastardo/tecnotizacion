'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Send, Loader2, CheckCircle, Percent } from 'lucide-react';
import { calculatePricing, validateMargin, formatBs, formatUsd } from '@/lib/pricing';

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
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('0');
  const [clientIsRevendedor, setClientIsRevendedor] = useState(false);
  const [clientDiscountRevendedor, setClientDiscountRevendedor] = useState(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.product-search-container')) {
        setShowProductList(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    fetch('/api/tasas')
      .then((res) => res.json())
      .then((data) => {
        if (data.bcv > 0 && data.promedio > 0) { setRates(data); setRatesError(false); }
        else { setRatesError(true); }
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
        setClientIsRevendedor(client.isRevendedor || false);
        setClientDiscountRevendedor(client.discountRevendedor || 0);
      }
    } else {
      setClientIsRevendedor(false);
      setClientDiscountRevendedor(0);
    }
  }, [selectedClientId, clients]);

  const activeBcv = rates.bcv;
  const activePromedio = rates.promedio;

  const filteredProducts = productSearch
    ? products.filter((p: any) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
      ).slice(0, 10)
    : products.slice(0, 5);

  const selectProductItem = (productId: string) => {
    setSelectedProduct(productId);
    setProductSearch('');
    setShowProductList(false);
  };

  const addItem = () => {
    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;
    if (paymentMethod === 'bs' && activePromedio === 0) { alert('Las tasas aun no cargaron'); return; }
    const qty = Math.max(1, parseInt(quantity) || 1);
    const discount = clientIsRevendedor ? clientDiscountRevendedor : 0;
    const profitMargin = product.profitMargin || 45;

    if (discount > 0) {
      const validation = validateMargin(profitMargin, discount);
      if (!validation.valid) {
        alert(`No es posible aplicar ${discount}% de descuento. El margen original es ${profitMargin}% y el descuento dejaria la utilidad en ${validation.effectiveMargin}%, por debajo del minimo del ${validation.minRequired}%.`);
        return;
      }
    }

    const pricing = calculatePricing({
      costUsd: product.costUsd, quantity: qty, paymentMethod,
      profitMargin, bcvRate: activeBcv, promedioRate: activePromedio,
      discountRevendedor: discount,
    });
    setItems([...items, { id: Date.now().toString(), product, quantity: qty, pricing }]);
    setSelectedProduct(''); setQuantity('1');
  };

  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));

  const totals = items.reduce(
    (acc, item) => ({ usd: acc.usd + item.pricing.totalUsd, bs: acc.bs + item.pricing.totalBs }),
    { usd: 0, bs: 0 }
  );

  const discountPct = Math.max(0, Math.min(100, parseFloat(discountPercent) || 0));
  const discountBs = totals.bs * (discountPct / 100);
  const discountUsd = totals.usd * (discountPct / 100);
  const finalBs = totals.bs - discountBs;
  const finalUsd = totals.usd - discountUsd;

  const minMarginViolation = discountPct > 0 && items.length > 0
    ? items.find((item) => {
        const cost = item.pricing.costUsd;
        const revenue = item.pricing.totalUsd;
        if (revenue <= 0 || cost <= 0) return false;
        const discountedRevenue = revenue * (1 - discountPct / 100);
        if (discountedRevenue <= cost) return true;
        const effMargin = ((discountedRevenue - (cost / (item.quantity || 1))) / (discountedRevenue / (item.quantity || 1))) * 100;
        return effMargin < 15;
      })
    : undefined;

  const saveQuote = async (status: 'draft' | 'sent') => {
    if (!clientName) { alert('Ingresa el nombre del cliente'); return false; }
    if (items.length === 0) { alert('Agrega al menos un producto'); return false; }
    setSaving(true);
    try {
      if (!selectedClientId && clientName) {
        fetch('/api/clientes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: clientName, phone: clientPhone }),
        }).catch(() => {});
      }
      const res = await fetch('/api/quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName, clientPhone, paymentMethod,
          totalUsd: discountUsd || totals.usd, totalBs: discountBs || totals.bs, status,
          discount: discountPct > 0 ? discountPct : undefined,
          originalTotalUsd: discountPct > 0 ? totals.usd : undefined,
          originalTotalBs: discountPct > 0 ? totals.bs : undefined,
          rates: { bcv: activeBcv, promedio: activePromedio },
          items: items.map((item) => ({
            id: item.id, quantity: item.quantity, pricing: item.pricing,
            product: { id: item.product?.id, name: item.product?.name, costUsd: item.product?.costUsd },
          })),
        }),
      });
      if (res.ok) return true;
      const err = await res.json();
      alert('Error al guardar: ' + (err.error || 'Error desconocido'));
      return false;
    } catch { alert('Error de conexion'); return false; }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (minMarginViolation) {
      alert('El descuento aplicado reduce la ganancia por debajo del 15% minimo. Reduce el descuento para continuar.');
      return;
    }
    const ok = await saveQuote('draft'); if (ok) onSaved(); };

  const handleSendWhatsApp = async () => {
    if (!clientName) { alert('Ingresa el nombre del cliente'); return; }
    if (items.length === 0) { alert('Agrega al menos un producto'); return; }
    if (minMarginViolation) {
      alert('El descuento aplicado reduce la ganancia por debajo del 15% minimo. Reduce el descuento para continuar.');
      return;
    }

    let message = '*PRESUPUESTO - TECNOTIZACION*\n';
    message += '━━━━━━━━━━━━━\n\n';
    message += `Cliente: ${clientName}\n`;
    message += `Fecha: ${new Date().toLocaleDateString('es-VE')}\n`;
    message += `Pago: ${paymentMethod === 'bs' ? 'Bolivares' : paymentMethod === 'cash' ? 'Efectivo USD' : paymentMethod === 'binance' ? 'Binance (USDT)' : 'Divisas'}\n`;
    if (paymentMethod === 'bs') {
      message += `Tasa BCV: Bs ${activeBcv.toFixed(2)}\n`;
    }
    if (clientIsRevendedor && clientDiscountRevendedor > 0) {
      message += `Descuento revendedor: ${clientDiscountRevendedor}%\n`;
    }
    message += '\n*PRODUCTOS:*\n\n';

    items.forEach((item, i) => {
      message += `${i + 1}. ${item.product.name}\n   Cant: ${item.quantity}\n`;
      if (paymentMethod === 'bs') {
        message += `   P/U: Bs ${formatBs(item.pricing.salePriceBs + item.pricing.ivaAmount)}\n`;
        message += `   Subtotal: Bs ${formatBs(item.pricing.totalBs)}\n\n`;
      } else {
        message += `   P/U: $${formatUsd(item.pricing.salePriceUsd)}\n`;
        message += `   Subtotal: $${formatUsd(item.pricing.totalUsd)}\n\n`;
      }
    });

    message += '━━━━━━━━━━━━━\n';
    if (paymentMethod === 'bs') {
      if (discountPct > 0) {
        message += `Subtotal: Bs ${formatBs(totals.bs)}\n`;
        message += `Descuento: ${discountPct}% (-Bs ${formatBs(discountBs)})\n`;
        message += `*TOTAL: Bs ${formatBs(finalBs)}*\n`;
      } else {
        message += `*TOTAL: Bs ${formatBs(totals.bs)}*\n`;
      }
    } else {
      if (discountPct > 0) {
        message += `Subtotal: $${formatUsd(totals.usd)}\n`;
        message += `Descuento: ${discountPct}% (-$${formatUsd(discountUsd)})\n`;
        message += `*TOTAL: $${formatUsd(finalUsd)}*\n`;
      } else {
        message += `*TOTAL: $${formatUsd(totals.usd)}*\n`;
      }
    }
    message += '\nPresupuesto valido por 24 horas.\nGracias por su preferencia!';

    const phone = clientPhone.replace(/[^0-9]/g, '');
    const waUrl = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    const ok = await saveQuote('sent');
    window.location.href = waUrl;
    if (ok) setTimeout(() => onSaved(), 1000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Nuevo Presupuesto</h2>
        </div>

        <div className="space-y-4">
          {clients.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente guardado</label>
              <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">-- Nuevo cliente --</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}{c.rif ? ` · ${c.rif}` : ''}{c.isRevendedor ? ' (R)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
            <input type="text" value={clientName}
              onChange={(e) => { setClientName(e.target.value); setSelectedClientId(''); setClientIsRevendedor(false); setClientDiscountRevendedor(0); }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre completo" required />
          </div>

          {clientIsRevendedor && (
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Cliente revendedor — Descuento sobre ganancia: <strong>{clientDiscountRevendedor}%</strong>
              <span className="block text-xs text-amber-600 mt-0.5">Utilidad minima requerida: 15%</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input type="tel" value={clientPhone}
              onChange={(e) => { setClientPhone(e.target.value); setSelectedClientId(''); setClientIsRevendedor(false); setClientDiscountRevendedor(0); }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="584121234567" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago *</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="bs">Bolivares</option>
              <option value="cash">Efectivo USD</option>
              <option value="binance">Binance (USDT)</option>
              <option value="divisas">Divisas</option>
            </select>
          </div>

          {loadingRates ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando tasas...
            </div>
          ) : ratesError || activeBcv === 0 ? (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800">
              No se pudieron cargar las tasas.
            </div>
          ) : (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-blue-800">Tasa BCV del dia:</p>
              <span className="text-blue-700 text-lg font-bold">Bs {activeBcv.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Agregar Productos</h3>
        <div className="space-y-3">
          <div className="relative product-search-container">
            <input type="text" value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setShowProductList(true); }}
              onFocus={() => setShowProductList(true)}
              placeholder="Buscar por nombre, SKU o categoria..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            {showProductList && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map((p: any) => (
                  <button key={p.id} onClick={() => selectProductItem(p.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 ${selectedProduct === p.id ? 'bg-blue-50' : ''}`}>
                    <div className="font-medium text-gray-800 text-sm">{p.name}</div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-xs text-gray-500">{p.sku ? `${p.sku} · ` : ''}{p.category || ''}</span>
                      <span className="text-xs font-semibold text-blue-600">${(p.costUsd ?? 0).toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedProduct && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              {products.find((p: any) => p.id === selectedProduct)?.name}
            </p>
          )}
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-20 px-3 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center" min="1" />
            </div>
            <button onClick={addItem} disabled={!selectedProduct}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5">
              <Plus className="w-5 h-5" /> Agregar
            </button>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Items</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.product.name}</h4>
                    <p className="text-sm text-gray-500">Cantidad: {item.quantity}
                      {clientIsRevendedor && clientDiscountRevendedor > 0 && (
                        <span className="text-amber-600 ml-2">· Utilidad: {item.pricing.effectiveMargin}%</span>
                      )}
                    </p>
                    {paymentMethod === 'bs' ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-sm text-gray-600">P/U: Bs {formatBs(item.pricing.salePriceBs + item.pricing.ivaAmount)} <span className="text-xs text-gray-400">(+IVA 16%)</span></p>
                        <p className="text-sm font-semibold text-blue-600">Subtotal: Bs {formatBs(item.pricing.totalBs)}</p>
                      </div>
                    ) : (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-sm text-gray-600">P/U: ${formatUsd(item.pricing.salePriceUsd)}</p>
                        <p className="text-sm font-semibold text-blue-600">Subtotal: ${formatUsd(item.pricing.totalUsd)}</p>
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

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center gap-3 mb-3">
              <Percent className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Descuento (%)</label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center text-gray-900 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                min="0"
                max="100"
                step="0.5"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>

            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm font-semibold text-gray-900">
                {paymentMethod === 'bs' ? `Bs ${formatBs(totals.bs)}` : `$${formatUsd(totals.usd)}`}
              </span>
            </div>

            {discountPct > 0 && (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-red-600">Descuento ({discountPct}%)</span>
                  <span className="text-sm font-semibold text-red-600">
                    {paymentMethod === 'bs' ? `-Bs ${formatBs(discountBs)}` : `-$${formatUsd(discountUsd)}`}
                  </span>
                </div>
                {minMarginViolation && (
                  <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    El descuento reduce la ganancia por debajo del 15% minimo requerido. Reduce el descuento para poder enviar.
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center mt-2 pt-3 border-t-2 border-gray-200">
              <span className="text-lg font-bold text-gray-800">TOTAL</span>
              <span className="text-2xl font-bold text-blue-600">
                {paymentMethod === 'bs'
                  ? `Bs ${formatBs(discountPct > 0 ? finalBs : totals.bs)}`
                  : `$${formatUsd(discountPct > 0 ? finalUsd : totals.usd)}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {items.length > 0 && clientName && (
        <div className="space-y-3 pb-2">
          <button onClick={handleSendWhatsApp} disabled={saving || !!minMarginViolation}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            Enviar por WhatsApp
          </button>
          <button onClick={handleSave} disabled={saving || !!minMarginViolation}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Guardar Presupuesto
          </button>
        </div>
      )}
    </div>
  );
}
