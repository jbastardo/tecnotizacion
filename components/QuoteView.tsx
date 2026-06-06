'use client';

import { ArrowLeft, Send, Download } from 'lucide-react';
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

  const items = quote.items || [];
  const totals = quote.totals || { usd: quote.totalUsd || 0, bs: quote.totalBs || 0 };

  const generateWhatsAppMessage = () => {
    let message = `*PRESUPUESTO - TECNOTIZACIÓN*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Cliente: ${quote.clientName}\n`;
    message += `Fecha: ${quote.createdAt}\n`;
    message += `Forma de Pago: ${paymentMethodLabels[quote.paymentMethod]}\n`;
    if (quote.paymentMethod === 'bs' && quote.rates) {
      message += `Tasa BCV: Bs ${quote.rates.bcv.toFixed(2)}\n`;
    }
    message += `\n*PRODUCTOS:*\n\n`;

    items.forEach((item: any, index: number) => {
      const name = item.product?.name || item.productName || 'Producto';
      const qty = item.quantity || 1;
      message += `${index + 1}. ${name}\n`;
      message += `   Cant: ${qty}\n`;
      if (quote.paymentMethod === 'bs') {
        const saleBs = item.pricing?.salePriceBs ?? item.salePriceBs ?? 0;
        const iva = item.pricing?.ivaAmount ?? 0;
        const totalBs = item.pricing?.totalBs ?? item.subtotalBs ?? (saleBs + iva) * qty;
        message += `   P/U: Bs ${formatBs(saleBs + iva)}\n`;
        message += `   Subtotal: Bs ${formatBs(totalBs)}\n`;
      } else {
        const saleUsd = item.pricing?.salePriceUsd ?? item.salePriceUsd ?? 0;
        const totalUsd = item.pricing?.totalUsd ?? item.subtotalUsd ?? saleUsd * qty;
        message += `   P/U: $${formatUsd(saleUsd)}\n`;
        message += `   Subtotal: $${formatUsd(totalUsd)}\n`;
      }
      message += `\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    if (quote.paymentMethod === 'bs') {
      message += `*TOTAL: Bs ${formatBs(totals.bs)}*\n`;
    } else {
      message += `*TOTAL: $${formatUsd(totals.usd)}*\n`;
    }
    message += `\nPresupuesto válido por 7 días.\n`;
    message += `¡Gracias por su preferencia!`;

    return message;
  };

  const sendWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const phone = quote.clientPhone?.replace(/[^0-9]/g, '') || '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-blue-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-blue-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">Presupuesto</h2>
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-2xl">{quote.clientName}</p>
          <p className="text-blue-100">Fecha: {quote.createdAt}</p>
          <p className="text-blue-100">
            Forma de Pago: {paymentMethodLabels[quote.paymentMethod]}
          </p>
          {quote.status && (
            <p className="text-blue-100">Estado: {quote.status}</p>
          )}
          {quote.paymentMethod === 'bs' && quote.rates && (
            <p className="text-blue-100">Tasa BCV: Bs {quote.rates.bcv.toFixed(2)}</p>
          )}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle de Productos</h3>
        
        <div className="space-y-4">
          {items.map((item: any, index: number) => {
            const name = item.product?.name || item.productName || 'Producto';
            const qty = item.quantity || 1;
            return (
            <div key={item.id || index} className="border-b border-gray-200 pb-4 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">{name}</h4>
                  <p className="text-sm text-gray-600">Cantidad: {qty}</p>
                </div>
                <div className="text-right">
                  {quote.paymentMethod === 'bs' ? (
                    <>
                      <p className="text-sm text-gray-600">
                        P/U: Bs {formatBs((item.pricing?.salePriceBs ?? item.salePriceBs ?? 0) + (item.pricing?.ivaAmount ?? 0))}
                      </p>
                      <p className="font-bold text-blue-600">
                        Bs {formatBs(item.pricing?.totalBs ?? item.subtotalBs ?? 0)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        P/U: ${formatUsd(item.pricing?.salePriceUsd ?? item.salePriceUsd ?? 0)}
                      </p>
                      <p className="font-bold text-blue-600">
                        ${formatUsd(item.pricing?.totalUsd ?? item.subtotalUsd ?? 0)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t-2 border-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-800">TOTAL:</span>
            {quote.paymentMethod === 'bs' ? (
              <span className="text-3xl font-bold text-blue-600">
                Bs {formatBs(totals.bs)}
              </span>
            ) : (
              <span className="text-3xl font-bold text-blue-600">
                ${formatUsd(totals.usd)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Presupuesto válido por 7 días
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={sendWhatsApp}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-6 h-6" />
            Enviar por WhatsApp
          </button>
          <button
            onClick={() => window.print()}
            className="w-full bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-500">
        <p>Tecnotización - Presupuestos Profesionales</p>
      </div>
    </div>
  );
}
