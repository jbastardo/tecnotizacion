export interface PricingInput {
  costUsd: number;
  quantity: number;
  paymentMethod: 'bs' | 'cash' | 'binance' | 'divisas';
  profitMargin: number;
  bcvRate: number;
  promedioRate: number;
  ivaRate: number;
}

export interface PricingResult {
  costUsd: number;
  costBs: number;
  salePriceUsd: number;
  salePriceBs: number;
  subtotalUsd: number;
  subtotalBs: number;
  ivaAmount: number;
  totalUsd: number;
  totalBs: number;
  profitUsd: number;
  profitBs: number;
  profitMargin: number;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const { costUsd, quantity, paymentMethod, profitMargin, bcvRate, promedioRate, ivaRate } = input;

  const totalCostUsd = costUsd * quantity;
  const profitMultiplier = 1 + (profitMargin / 100);

  let salePriceUsd = costUsd * profitMultiplier;
  let salePriceBs = 0;
  let costBs = 0;
  let ivaAmount = 0;

  if (paymentMethod === 'bs') {
    salePriceBs = salePriceUsd * bcvRate;
    ivaAmount = salePriceBs * (ivaRate / 100);
    salePriceBs += ivaAmount;
    costBs = costUsd * bcvRate;
  }

  const subtotalUsd = salePriceUsd * quantity;
  const subtotalBs = salePriceBs * quantity;
  const totalUsd = subtotalUsd;
  const totalBs = subtotalBs;
  const profitUsd = subtotalUsd - totalCostUsd;
  const profitBs = paymentMethod === 'bs' ? subtotalBs - (costBs * quantity) : profitUsd;

  return {
    costUsd: totalCostUsd,
    costBs: paymentMethod === 'bs' ? costBs * quantity : 0,
    salePriceUsd,
    salePriceBs,
    subtotalUsd,
    subtotalBs,
    ivaAmount: paymentMethod === 'bs' ? ivaAmount * quantity : 0,
    totalUsd,
    totalBs,
    profitUsd,
    profitBs,
    profitMargin,
  };
}

export function formatBs(amount: number): string {
  return amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
