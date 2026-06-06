export interface ExchangeRates {
  bcv: number;
  promedio: number;
  lastUpdated: string;
}

const DOLAR_API_URL = 'https://dolar.wrservicios.com/api/rates';

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    const response = await fetch(DOLAR_API_URL, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.status}`);
    }

    const data = await response.json();

    return {
      bcv: data.bcv?.monto || data.bcv || 0,
      promedio: data.promedio?.monto || data.promedio || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return {
      bcv: 0,
      promedio: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}
