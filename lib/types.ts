// Shared TypeScript interfaces for the app
export interface Product {
  id: string;
  name: string;
  description?: string;
  costUsd: number;
  profitMargin: number;
  category?: string;
  createdAt?: string;
}

export interface Client {
  id: string;
  rif: string;
  name: string;
  phone?: string;
  email?: string;
  isRevendedor: boolean;
  discountRevendedor: number;
  createdAt?: string;
}

export interface Rates {
  bcv: number;
  promedio: number;
  lastUpdated?: string;
}

export interface ItemPricing {
  costUsd: number;
  costBs: number;
  salePriceUsd: number;
  salePriceBs: number;
  ivaAmount: number;
  subtotalBs: number;
  subtotalUsd: number;
  totalBs: number;
  totalUsd: number;
  effectiveMargin?: number;
}

export interface QuoteItem {
  id: string;
  product: { id?: string; name: string; costUsd: number };
  quantity: number;
  pricing: ItemPricing;
}

export interface Quote {
  id: string;
  quoteNumber?: number;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientRif?: string;
  paymentMethod: 'bs' | 'cash' | 'binance' | 'divisas';
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  totalUsd: number;
  totalBs: number;
  hideIva: boolean;
  notes?: string;
  items?: QuoteItem[];
  rates?: Rates;
  createdAt?: string;
  updatedAt?: string;
}
