import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      'SELECT id, rif, name, phone, email, created_at FROM clients ORDER BY name ASC'
    );
    return NextResponse.json(result.rows.map((r: any) => ({
      id: r.id,
      rif: r.rif || '',
      name: r.name,
      phone: r.phone || '',
      email: r.email || '',
      createdAt: r.created_at,
    })));
  } catch (error: any) {
    // rif column may not exist yet
    if (error?.code === '42703') {
      try {
        const result = await query(
          'SELECT id, name, phone, email, created_at FROM clients ORDER BY name ASC'
        );
        return NextResponse.json(result.rows.map((r: any) => ({
          id: r.id, rif: '', name: r.name, phone: r.phone || '', email: r.email || '', createdAt: r.created_at,
        })));
      } catch (e) {
        return NextResponse.json([]);
      }
    }
    console.error('Error fetching clients:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rif, name, phone, email } = body;

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    try {
      const result = await query(
        `INSERT INTO clients (rif, name, phone, email) VALUES ($1, $2, $3, $4)
         ON CONFLICT (rif) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email
         RETURNING id, rif, name, phone, email, created_at`,
        [rif || '', name, phone || null, email || null]
      );
      return NextResponse.json({
        id: result.rows[0].id, rif: result.rows[0].rif || '', name: result.rows[0].name,
        phone: result.rows[0].phone || '', email: result.rows[0].email || '', createdAt: result.rows[0].created_at,
      }, { status: 201 });
    } catch (rifError: any) {
      // rif column doesn't exist - fallback without rif
      const result = await query(
        `INSERT INTO clients (name, phone, email) VALUES ($1, $2, $3)
         RETURNING id, name, phone, email, created_at`,
        [name, phone || null, email || null]
      );
      return NextResponse.json({
        id: result.rows[0].id, rif: rif || '', name: result.rows[0].name,
        phone: result.rows[0].phone || '', email: result.rows[0].email || '', createdAt: result.rows[0].created_at,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, rif, name, phone, email } = body;

    if (!id || !name) return NextResponse.json({ error: 'id and name are required' }, { status: 400 });

    try {
      const result = await query(
        `UPDATE clients SET rif = $1, name = $2, phone = $3, email = $4 WHERE id = $5
         RETURNING id, rif, name, phone, email, created_at`,
        [rif || '', name, phone || null, email || null, id]
      );
      if (result.rows.length === 0) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      return NextResponse.json({
        id: result.rows[0].id, rif: result.rows[0].rif || '', name: result.rows[0].name,
        phone: result.rows[0].phone || '', email: result.rows[0].email || '', createdAt: result.rows[0].created_at,
      });
    } catch {
      // fallback without rif
      const result = await query(
        `UPDATE clients SET name = $1, phone = $2, email = $3 WHERE id = $4
         RETURNING id, name, phone, email, created_at`,
        [name, phone || null, email || null, id]
      );
      if (result.rows.length === 0) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      return NextResponse.json({
        id: result.rows[0].id, rif: rif || '', name: result.rows[0].name,
        phone: result.rows[0].phone || '', email: result.rows[0].email || '', createdAt: result.rows[0].created_at,
      });
    }
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await query('DELETE FROM clients WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
