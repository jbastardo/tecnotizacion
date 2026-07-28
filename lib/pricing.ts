export interface PricingInput {
  costUsd: number;
  quantity: number;
  paymentMethod: 'bs' | 'cash' | 'binance' | 'divisas';
  profitMargin: number;
  bcvRate: number;
  promedioRate: number;
  discountRevendedor?: number;
}

export interface PricingResult {
  costUsd: number;
  costBs: number;
  salePriceUsd: number;
  salePriceBs: number;
  ivaAmount: number;
  subtotalBs: number;
  subtotalUsd: number;
  totalBs: number;
  totalUsd: number;
  bcvEquivalent: number;
  utilidadBs: number;
  tasaEfectiva: number;
  effectiveMargin: number;
}

export interface MarginValidation {
  valid: boolean;
  effectiveMargin: number;
  minRequired: number;
  originalMargin: number;
  discount: number;
}

export function validateMargin(profitMargin: number, discountRevendedor: number): MarginValidation {
  const effectiveMargin = profitMargin - discountRevendedor;
  const minRequired = 15;
  return {
    valid: effectiveMargin >= minRequired,
    effectiveMargin,
    minRequired,
    originalMargin: profitMargin,
    discount: discountRevendedor,
  };
}

export function calculatePricing(input: PricingInput): PricingResult {
  const { costUsd, quantity, paymentMethod, profitMargin, bcvRate, promedioRate, discountRevendedor } = input;

  const effectiveMargin = discountRevendedor ? profitMargin - discountRevendedor : profitMargin;
  const marginDecimal = effectiveMargin / 100;
  const salePriceUsd = costUsd / (1 - marginDecimal);

  if (paymentMethod === 'bs') {
    const tasaCompra = promedioRate;
    const tasaVenta = promedioRate;
    const costBs = costUsd * tasaCompra;
    const salePriceBs = salePriceUsd * tasaVenta;
    const ivaAmount = salePriceBs * 0.16;
    const totalBs = salePriceBs + ivaAmount;
    const bcvEquivalent = salePriceUsd * bcvRate;
    const utilidadBs = (salePriceBs - costBs) * quantity;
    const tasaEfectiva = bcvRate;

    return {
      costUsd: costUsd * quantity,
      costBs: costBs * quantity,
      salePriceUsd,
      salePriceBs,
      ivaAmount,
      subtotalBs: salePriceBs * quantity,
      subtotalUsd: salePriceUsd * quantity,
      totalBs: totalBs * quantity,
      totalUsd: salePriceUsd * quantity,
      bcvEquivalent: bcvEquivalent * quantity,
      utilidadBs,
      tasaEfectiva,
      effectiveMargin,
    };
  }

  return {
    costUsd: costUsd * quantity,
    costBs: 0,
    salePriceUsd,
    salePriceBs: 0,
    ivaAmount: 0,
    subtotalBs: 0,
    subtotalUsd: salePriceUsd * quantity,
    totalBs: 0,
    totalUsd: salePriceUsd * quantity,
    bcvEquivalent: 0,
    utilidadBs: 0,
    tasaEfectiva: 0,
    effectiveMargin,
  };
}

export function formatBs(amount: number | null | undefined): string {
  const num = amount ?? 0;
  return num.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatUsd(amount: number | null | undefined): string {
  const num = amount ?? 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
