import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

function mapRow(row: any) {
  return {
    id: row.id,
    quoteNumber: row.quote_number || null,
    clientName: row.client_name,
    clientRif: row.client_rif || '',
    clientPhone: row.client_phone,
    clientEmail: row.client_email,
    paymentMethod: row.payment_method,
    status: row.status,
    totalUsd: parseFloat(row.total_usd) || 0,
    totalBs: parseFloat(row.total_bs) || 0,
    hideIva: row.hide_iva || false,
    notes: row.notes,
    items: row.items_data || [],
    rates: row.rates_data || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const result = await query(
      `SELECT id, quote_number, client_name, client_rif, client_phone, client_email, payment_method,
       status, total_usd, total_bs, hide_iva, notes, items_data, rates_data, created_at, updated_at
       FROM quotes WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [session.tenantId]
    );
    return NextResponse.json(result.rows.map(mapRow));
  } catch (error: any) {
    if (error?.code === '42703') {
      try {
        const result = await query(
          `SELECT id, client_name, client_phone, client_email, payment_method,
           status, total_usd, total_bs, notes, items_data, rates_data, created_at, updated_at
           FROM quotes WHERE tenant_id = $1 ORDER BY created_at DESC`,
          [session.tenantId]
        );
        return NextResponse.json(result.rows.map((r: any) => mapRow({ ...r, quote_number: null, client_rif: '', hide_iva: false })));
      } catch { return NextResponse.json([]); }
    }
    console.error('Error fetching quotes:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { clientName, clientRif, clientPhone, clientEmail, paymentMethod, totalUsd, totalBs, hideIva, notes, items, rates, status } = body;

    if (!clientName) return NextResponse.json({ error: 'clientName required' }, { status: 400 });

    const result = await query(
      `INSERT INTO quotes (tenant_id, client_name, client_rif, client_phone, client_email, payment_method, total_usd, total_bs, hide_iva, notes, items_data, rates_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, quote_number, client_name, client_rif, client_phone, client_email, payment_method, status, total_usd, total_bs, hide_iva, notes, items_data, rates_data, created_at, updated_at`,
      [session.tenantId, clientName, clientRif || null, clientPhone || null, clientEmail || null, paymentMethod, totalUsd || 0, totalBs || 0, hideIva || false, notes || null, JSON.stringify(items || []), JSON.stringify(rates || {}), status || 'draft']
    );

    return NextResponse.json(mapRow(result.rows[0]), { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id, status } = await request.json();
    const result = await query(
      `UPDATE quotes SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3
       RETURNING id, quote_number, client_name, client_rif, client_phone, client_email, payment_method, status, total_usd, total_bs, hide_iva, notes, items_data, rates_data, created_at, updated_at`,
      [status, id, session.tenantId]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapRow(result.rows[0]));
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await request.json();
    await query('DELETE FROM quotes WHERE id = $1 AND tenant_id = $2', [id, session.tenantId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
  }
}
