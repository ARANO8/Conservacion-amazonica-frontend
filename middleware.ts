import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  console.log(
    '[Middleware] Path:',
    request.nextUrl.pathname,
    '| Token Cookie:',
    token
  );
  const { pathname } = request.nextUrl;

  // 1. Proteger rutas que inician con /dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      // Si no hay token, redirigir a login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. Redirigir a dashboard si ya está logueado e intenta entrar a login
  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
