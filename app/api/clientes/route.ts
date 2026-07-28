import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const result = await query(
      'SELECT id, rif, name, phone, email, is_revendedor, discount_revendedor, created_at FROM clients WHERE tenant_id = $1 ORDER BY name ASC',
      [session.tenantId]
    );
    return NextResponse.json(result.rows.map((r: any) => ({
      id: r.id, rif: r.rif || '', name: r.name,
      phone: r.phone || '', email: r.email || '',
      isRevendedor: r.is_revendedor || false,
      discountRevendedor: parseFloat(r.discount_revendedor) || 0,
      createdAt: r.created_at,
    })));
  } catch (error: any) {
    if (error?.code === '42703') {
      const result = await query(
        'SELECT id, name, phone, email, created_at FROM clients WHERE tenant_id = $1 ORDER BY name ASC',
        [session.tenantId]
      );
      return NextResponse.json(result.rows.map((r: any) => ({
        id: r.id, rif: '', name: r.name, phone: r.phone || '', email: r.email || '',
        isRevendedor: false, discountRevendedor: 0,
        createdAt: r.created_at,
      })));
    }
    console.error('Error fetching clients:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { rif, name, phone, email, isRevendedor, discountRevendedor } = await request.json();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    try {
      const result = await query(
        `INSERT INTO clients (tenant_id, rif, name, phone, email, is_revendedor, discount_revendedor) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, rif, name, phone, email, is_revendedor, discount_revendedor, created_at`,
        [session.tenantId, rif || '', name, phone || null, email || null, isRevendedor || false, discountRevendedor || 0]
      );
      const r = result.rows[0];
      return NextResponse.json({ id: r.id, rif: r.rif || '', name: r.name, phone: r.phone || '', email: r.email || '', isRevendedor: r.is_revendedor || false, discountRevendedor: parseFloat(r.discount_revendedor) || 0, createdAt: r.created_at }, { status: 201 });
    } catch {
      const result = await query(
        `INSERT INTO clients (tenant_id, name, phone, email) VALUES ($1, $2, $3, $4)
         RETURNING id, name, phone, email, created_at`,
        [session.tenantId, name, phone || null, email || null]
      );
      const r = result.rows[0];
      return NextResponse.json({ id: r.id, rif: rif || '', name: r.name, phone: r.phone || '', email: r.email || '', isRevendedor: false, discountRevendedor: 0, createdAt: r.created_at }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id, rif, name, phone, email, isRevendedor, discountRevendedor } = await request.json();
    if (!id || !name) return NextResponse.json({ error: 'id and name required' }, { status: 400 });

    try {
      const result = await query(
        `UPDATE clients SET rif = $1, name = $2, phone = $3, email = $4, is_revendedor = $5, discount_revendedor = $6 WHERE id = $7 AND tenant_id = $8
         RETURNING id, rif, name, phone, email, is_revendedor, discount_revendedor, created_at`,
        [rif || '', name, phone || null, email || null, isRevendedor || false, discountRevendedor || 0, id, session.tenantId]
      );
      if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const r = result.rows[0];
      return NextResponse.json({ id: r.id, rif: r.rif || '', name: r.name, phone: r.phone || '', email: r.email || '', isRevendedor: r.is_revendedor || false, discountRevendedor: parseFloat(r.discount_revendedor) || 0, createdAt: r.created_at });
    } catch {
      const result = await query(
        `UPDATE clients SET name = $1, phone = $2, email = $3 WHERE id = $4 AND tenant_id = $5
         RETURNING id, name, phone, email, created_at`,
        [name, phone || null, email || null, id, session.tenantId]
      );
      if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const r = result.rows[0];
      return NextResponse.json({ id: r.id, rif: rif || '', name: r.name, phone: r.phone || '', email: r.email || '', isRevendedor: false, discountRevendedor: 0, createdAt: r.created_at });
    }
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await query('DELETE FROM clients WHERE id = $1 AND tenant_id = $2', [id, session.tenantId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
