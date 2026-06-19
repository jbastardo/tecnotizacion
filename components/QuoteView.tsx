'use client';

import { ArrowLeft, Send, Share2 } from 'lucide-react';
import { formatBs, formatUsd } from '@/lib/pricing';

interface QuoteViewProps {
  quote: any;
  onBack: () => void;
}

export default function QuoteView({ quote, onBack }: QuoteViewProps) {
  const paymentMethodLabels: Record<string, string> = {
    bs: 'Bolivares',
    cash: 'Efectivo USD',
    binance: 'Binance (USDT)',
    divisas: 'Divisas',
  };

  const items: any[] = quote.items || quote.items_data || [];
  const rates = quote.rates || quote.rates_data || {};
  const discount = quote.discount || rates.discount || 0;
  const originalTotalBs = quote.originalTotalBs || rates.originalTotalBs;
  const originalTotalUsd = quote.originalTotalUsd || rates.originalTotalUsd;
  const hasDiscount = discount > 0;
  const createdAt = quote.createdAt
    ? new Date(quote.createdAt).toLocaleDateString('es-VE')
    : quote.created_at
    ? new Date(quote.created_at).toLocaleDateString('es-VE')
    : '';

  const totals = {
    usd: quote.totalUsd || 0,
    bs: quote.totalBs || 0,
  };

  const buildMessage = () => {
    let msg = `*PRESUPUESTO - TECNOTIZACION*\n`;
    if (quote.quoteNumber) msg += `*N ${String(quote.quoteNumber).padStart(4, '0')}*\n`;
    msg += `━━━━━━━━━━━━━\n\n`;
    msg += `Cliente: ${quote.clientName}\n`;
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
          msg += `   P/U: Bs ${formatBs((p.salePriceBs || 0) + (p.ivaAmount || 0))}\n`;
          msg += `   Subtotal: Bs ${formatBs(p.totalBs || 0)}\n\n`;
        } else {
          msg += `   P/U: $${formatUsd(p.salePriceUsd || 0)}\n`;
          msg += `   Subtotal: $${formatUsd(p.totalUsd || 0)}\n\n`;
        }
      });
    }

    msg += `━━━━━━━━━━━━━\n`;
    if (quote.paymentMethod === 'bs') {
      if (hasDiscount && originalTotalBs) {
        msg += `Subtotal: Bs ${formatBs(Number(originalTotalBs))}\n`;
        msg += `Descuento: ${discount}% (-Bs ${formatBs(Number(originalTotalBs) * (discount / 100))})\n`;
        msg += `*TOTAL: Bs ${formatBs(totals.bs)}*\n`;
      } else {
        msg += `*TOTAL: Bs ${formatBs(totals.bs)}*\n`;
      }
    } else {
      if (hasDiscount && originalTotalUsd) {
        msg += `Subtotal: $${formatUsd(Number(originalTotalUsd))}\n`;
        msg += `Descuento: ${discount}%\n`;
        msg += `*TOTAL: $${formatUsd(totals.usd)}*\n`;
      } else {
        msg += `*TOTAL: $${formatUsd(totals.usd)}*\n`;
      }
    }
    msg += `\nPresupuesto valido por 24 horas.\nGracias por su preferencia!`;
    return msg;
  };

  const openWhatsApp = () => {
    const message = buildMessage();
    const phone = (quote.clientPhone || '').replace(/[^0-9]/g, '');
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.location.href = url;
  };

  const shareOrCopy = async () => {
    const message = buildMessage();
    if (navigator.share) {
      try {
        await navigator.share({ title: `Presupuesto ${quote.clientName}`, text: message });
        return;
      } catch (e) {}
    }
    try {
      await navigator.clipboard.writeText(message);
      alert('Presupuesto copiado al portapapeles');
    } catch {
      alert('No se pudo copiar. Usa el boton de WhatsApp.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-blue-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-blue-700 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">Presupuesto</h2>
        </div>
        <div className="space-y-1">
          {quote.quoteNumber && (
            <p className="text-blue-200 text-xs font-mono">N {String(quote.quoteNumber).padStart(4, '0')}</p>
          )}
          <p className="font-semibold text-2xl">{quote.clientName}</p>
          <p className="text-blue-100 text-sm">Fecha: {createdAt}</p>
          <p className="text-blue-100 text-sm">
            Pago: {paymentMethodLabels[quote.paymentMethod] || quote.paymentMethod}
          </p>
          {quote.paymentMethod === 'bs' && rates?.bcv > 0 && (
            <p className="text-blue-100 text-sm">Tasa BCV: Bs {Number(rates.bcv).toFixed(2)}</p>
          )}
        </div>
      </div>

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
                        <p className="text-sm text-gray-500">Cantidad: {qty}</p>
                      </div>
                      <div className="text-right">
                        {quote.paymentMethod === 'bs' ? (
                          <>
                            <p className="text-sm text-gray-500">
                              P/U: Bs {formatBs((p.salePriceBs || 0) + (p.ivaAmount || 0))}
                            </p>
                            <p className="text-xs text-gray-400">(+IVA 16%)</p>
                            <p className="font-bold text-blue-600">Bs {formatBs(p.totalBs || 0)}</p>
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

        <div className="mt-6 pt-4 border-t-2 border-gray-200">
          {hasDiscount && (
            <div className="mb-2 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>
                  {quote.paymentMethod === 'bs'
                    ? `Bs ${formatBs(Number(originalTotalBs))}`
                    : `$${formatUsd(Number(originalTotalUsd))}`}
                </span>
              </div>
              <div className="flex justify-between text-sm text-red-500">
                <span>Descuento ({discount}%)</span>
                <span>
                  {quote.paymentMethod === 'bs'
                    ? `-Bs ${formatBs(Number(originalTotalBs) * (discount / 100))}`
                    : `-$${formatUsd(Number(originalTotalUsd) * (discount / 100))}`}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-800">TOTAL</span>
            <span className="text-3xl font-bold text-blue-600">
              {quote.paymentMethod === 'bs'
                ? `Bs ${formatBs(totals.bs)}`
                : `$${formatUsd(totals.usd)}`}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2 text-center">Valido por 24 horas</p>
        </div>

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
        Tecnotizacion — Presupuestos Profesionales
      </div>
    </div>
  );
}
