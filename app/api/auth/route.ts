import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function hashPassword(password: string): string {
  // Railway nunca tuvo AUTH_SECRET definida → hash histórico es sha256(password + "undefined").
  // Docker-compose pasa AUTH_SECRET="" (string vacío) cuando no está configurada en Coolify,
  // por eso usamos || en lugar de !== undefined para tratar "" igual que undefined.
  const secret = process.env.AUTH_SECRET || 'undefined';
  return crypto.createHash('sha256').update(password + secret).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { action, email, password, name, slug, rememberMe } = await request.json();

    if (action === 'login') {
      const result = await query(
        `SELECT u.id, u.email, u.name, u.role, t.id as tenant_id, t.name as tenant_name, t.slug
         FROM users u JOIN tenants t ON u.tenant_id = t.id
         WHERE u.email = $1 AND u.password_hash = $2`,
        [email, hashPassword(password)]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
      }

      const user = result.rows[0];
      const sessionToken = crypto.randomUUID();

      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
      const sessionExpiry = rememberMe ? "INTERVAL '30 days'" : "INTERVAL '24 hours'";

      await query(
        `INSERT INTO sessions (token, user_id, tenant_id, expires_at)
         VALUES ($1, $2, $3, NOW() + ${sessionExpiry})`,
        [sessionToken, user.id, user.tenant_id]
      );

      const response = NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        tenant: { id: user.tenant_id, name: user.tenant_name, slug: user.slug },
      });

      response.cookies.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge,
        path: '/',
      });

      return response;
    }

    if (action === 'register') {
      if (!email || !password || !name || !slug) {
        return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
      }

      const existing = await query('SELECT id FROM tenants WHERE slug = $1', [slug]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Ese nombre de negocio ya está en uso' }, { status: 409 });
      }

      const tenant = await query(
        `INSERT INTO tenants (name, slug, owner_email) VALUES ($1, $2, $3) RETURNING id, name, slug`,
        [name, slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'), email]
      );

      await query(
        `INSERT INTO users (tenant_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'owner')`,
        [tenant.rows[0].id, email, hashPassword(password), name]
      );

      return NextResponse.json({ success: true, message: 'Cuenta creada. Ya puedes iniciar sesión.' });
    }

    if (action === 'logout') {
      const cookieStore = await cookies();
      const token = cookieStore.get('session')?.value;
      if (token) await query('DELETE FROM sessions WHERE token = $1', [token]).catch(() => {});
      const response = NextResponse.json({ success: true });
      response.cookies.delete('session');
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    // Tables may not exist yet - return graceful error
    if (error?.code === '42P01') {
      return NextResponse.json({ error: 'Sistema de autenticación no configurado aún' }, { status: 503 });
    }
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ user: null });

    const result = await query(
      `SELECT u.id, u.email, u.name, u.role, t.id as tenant_id, t.name as tenant_name, t.slug
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       JOIN tenants t ON s.tenant_id = t.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      const response = NextResponse.json({ user: null });
      response.cookies.delete('session');
      return response;
    }

    const row = result.rows[0];
    return NextResponse.json({
      user: { id: row.id, email: row.email, name: row.name, role: row.role },
      tenant: { id: row.tenant_id, name: row.tenant_name, slug: row.slug },
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
