import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that never require auth
const PUBLIC = [
  '/login',
  '/api/auth',
  '/api/health',
  '/api/db-diagnostic',
  '/api/tasas',
  '/api/store',
  '/api/producto-publico',
  '/producto',
  '/manifest.json',
  '/sw.js',
  '/icons/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow internal API calls with x-internal-key (for Tutecnotienda)
  if (pathname.startsWith('/api/')) {
    const internalKey = request.headers.get('x-internal-key');
    if (internalKey && internalKey === process.env.API_KEY) {
      return NextResponse.next();
    }
  }

  const session = request.cookies.get('session')?.value;

  // No session → redirect to login (pages) or 401 (API)
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado. Inicia sesión.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
