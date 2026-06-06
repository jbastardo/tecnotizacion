import { NextResponse } from 'next/server';
import { fetchExchangeRates } from '@/lib/exchange-rates';

export async function GET() {
  try {
    const rates = await fetchExchangeRates();
    if (rates.bcv > 0 && rates.promedio > 0) {
      return NextResponse.json(rates);
    }
  } catch (error) {
    console.error('Error fetching rates from API:', error);
  }

  return NextResponse.json({
    bcv: 0,
    promedio: 0,
    lastUpdated: new Date().toISOString(),
    needsManual: true,
  });
}
