'use client';

import { ArrowLeft, Send, Share2 } from 'lucide-react';
import { formatBs, formatUsd } from '@/lib/pricing';

interface QuoteViewProps {
  quote: any;
  onBack: () => void;
}

export default function QuoteView({ quote, onBack }: QuoteViewProps) {
  const paymentMethodLabels: Record<string, string> = {
    bs: 'Bolívares (BCV)',
    cash: 'Efectivo USD',
    binance: 'Binance (USDT)',
    divisas: 'Divisas',
  };

  const items: any[] = quote.items || quote.items_data || [];
  const totals = quote.totals || { usd: quote.totalUsd || 0, bs: quote.totalBs || 0 };
  const rates = quote.rates || quote.rates_data || {};
  const hideIva = quote.hideIva || false;
  const clientRif = quote.clientRif || '';
  const displayTotals = hideIva && quote.paymentMethod === 'bs'
    ? { ...totals, bs: items.reduce((acc: number, item: any) => acc + ((item.pricing?.subtotalBs) || 0), 0) }
    : totals;
  const createdAt = quote.createdAt
    ? new Date(quote.createdAt).toLocaleDateString('es-VE')
    : quote.created_at
    ? new Date(quote.created_at).toLocaleDateString('es-VE')
    : '';

  const buildMessage = () => {
    let msg = `*PRESUPUESTO - TECNOTIZACIÓN*\n`;
    if (quote.quoteNumber) msg += `*N° ${String(quote.quoteNumber).padStart(4, '0')}*\n`;
    msg += `━━━━━━━━━━━━━\n\n`;
    msg += `Cliente: ${quote.clientName}\n`;
    if (clientRif) msg += `RIF: ${clientRif}\n`;
    msg += `Fecha: ${createdAt}\n`;
    msg += `Pago: ${paymentMethodLabels[quote.paymentMethod] || quote.paymentMethod}\n`;
    if (quote.paymentMethod === 'bs' && rates?.bcv > 0) {
      msg += `Tasa BCV: Bs ${Number(rates.bcv).toFixed(2)}\n`;
    }

    if (items.length > 0) {
      msg += `\n*PRODUCTOS:*\n\n`;
      items.forEach((item: any, i: number) => {
        const name = item.product?.name || '';
        const qty = item.quantity || 1;
        const p = item.pricing || {};
        msg += `${i + 1}. ${name}\n   Cant: ${qty}\n`;
        if (quote.paymentMethod === 'bs') {
          if (!hideIva) {
            msg += `   P/U: Bs ${formatBs((p.salePriceBs || 0) + (p.ivaAmount || 0))}\n`;
            msg += `   Subtotal: Bs ${formatBs(p.totalBs || 0)}\n\n`;
          } else {
            msg += `   P/U: Bs ${formatBs(p.salePriceBs || 0)}\n`;
            msg += `   Subtotal: Bs ${formatBs(p.subtotalBs || 0)}\n\n`;
          }
        } else {
          msg += `   P/U: $${formatUsd(p.salePriceUsd || 0)}\n`;
          msg += `   Subtotal: $${formatUsd(p.totalUsd || 0)}\n\n`;
        }
      });
    }

    msg += `━━━━━━━━━━━━━\n`;
    msg += quote.paymentMethod === 'bs'
      ? `*TOTAL: Bs ${formatBs(displayTotals.bs)}*\n`
      : `*TOTAL: $${formatUsd(displayTotals.usd)}*\n`;
    if (!hideIva && quote.paymentMethod === 'bs') msg += 'Precios incluyen IVA 16%\n';
    msg += `\nPresupuesto válido por 7 días.\n¡Gracias por su preferencia!`;
    return msg;
  };

  const openWhatsApp = () => {
    const message = buildMessage();
    const phone = (quote.clientPhone || '').replace(/[^0-9]/g, '');
    // Use api.whatsapp.com which is more reliable on mobile for opening the app
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    // window.location.href triggers the app intent on mobile (not blocked)
    window.location.href = url;
  };

  const shareOrCopy = async () => {
    const message = buildMessage();
    // Use Web Share API on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ title: `Presupuesto ${quote.clientName}`, text: message });
        return;
      } catch (e) {
        // User cancelled or share failed, fall through to clipboard
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(message);
      alert('Presupuesto copiado al portapapeles');
    } catch {
      alert('No se pudo copiar. Usa el botón de WhatsApp.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-blue-700 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">Presupuesto</h2>
        </div>
        <div className="space-y-1">
          {quote.quoteNumber && (
            <p className="text-blue-200 text-xs font-mono">N° {String(quote.quoteNumber).padStart(4, '0')}</p>
          )}
          <p className="font-semibold text-2xl">{quote.clientName}</p>
          {clientRif && (
            <p className="text-blue-100 text-sm">RIF: {clientRif}</p>
          )}
          <p className="text-blue-100 text-sm">Fecha: {createdAt}</p>
          <p className="text-blue-100 text-sm">
            Pago: {paymentMethodLabels[quote.paymentMethod] || quote.paymentMethod}
          </p>
          {quote.paymentMethod === 'bs' && rates?.bcv > 0 && (
            <p className="text-blue-100 text-sm">Tasa BCV: Bs {Number(rates.bcv).toFixed(2)}</p>
          )}
          {hideIva && quote.paymentMethod === 'bs' && (
            <p className="text-blue-100 text-sm">IVA no visible en este presupuesto</p>
          )}
          {items.length > 0 && items[0]?.pricing?.effectiveMargin != null && items[0].pricing.effectiveMargin < (items[0].product?.profitMargin || 45) && (
            <p className="text-amber-200 text-xs mt-1">Precios con descuento revendedor aplicado</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {items.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos</h3>
            <div className="space-y-4">
              {items.map((item: any, index: number) => {
                const name = item.product?.name || '';
                const qty = item.quantity || 1;
                const p = item.pricing || {};
                return (
                  <div key={item.id || index} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{name}</h4>
                        <p className="text-sm text-gray-500">Cantidad: {qty}
                          {p.effectiveMargin != null && p.effectiveMargin < 45 && (
                            <span className="text-amber-600 ml-2">· Utilidad: {p.effectiveMargin}%</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        {quote.paymentMethod === 'bs' ? (
                          <>
                            {!hideIva ? (
                              <>
                                <p className="text-sm text-gray-500">
                                  P/U: Bs {formatBs((p.salePriceBs || 0) + (p.ivaAmount || 0))}
                                </p>
                                <p className="text-xs text-gray-400">(+IVA 16%)</p>
                                <p className="font-bold text-blue-600">Bs {formatBs(p.totalBs || 0)}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-gray-500">
                                  P/U: Bs {formatBs(p.salePriceBs || 0)}
                                </p>
                                <p className="font-bold text-blue-600">Bs {formatBs(p.subtotalBs || 0)}</p>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-500">P/U: ${formatUsd(p.salePriceUsd || 0)}</p>
                            <p className="font-bold text-blue-600">${formatUsd(p.totalUsd || 0)}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm mb-4">Sin detalle de productos</p>
        )}

        {/* Total */}
        <div className="mt-6 pt-4 border-t-2 border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-800">TOTAL:</span>
            <span className="text-3xl font-bold text-blue-600">
              {quote.paymentMethod === 'bs'
                ? `Bs ${formatBs(displayTotals.bs)}`
                : `$${formatUsd(displayTotals.usd)}`}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2 text-center">Válido por 7 días</p>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={openWhatsApp}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 active:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-6 h-6" />
            Enviar por WhatsApp
          </button>
          <button
            onClick={shareOrCopy}
            className="w-full bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Compartir / Copiar
          </button>
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-3 text-center text-xs text-gray-400">
        Tecnotización — Presupuestos Profesionales
      </div>
    </div>
  );
}
