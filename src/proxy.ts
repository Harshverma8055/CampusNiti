import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

function getDashboardRoute(role: string): string {
    switch (role) {
        case 'STUDENT': return '/student/dashboard';
        case 'FACULTY': return '/faculty/dashboard';
        case 'MAINTENANCE': return '/maintenance/dashboard';
        case 'ADMIN': return '/admin/dashboard';
        default: return '/login';
    }
}

export async function proxy(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Public routes
    if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/api/auth') || pathname.startsWith('/api/feedback')) {
        if (token && (pathname === '/login' || pathname === '/register')) {
            const payload = await verifyToken(token);
            if (payload) {
                return NextResponse.redirect(new URL(getDashboardRoute(payload.role), request.url));
            }
        }
        return NextResponse.next();
    }

    // Protected routes
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set('token', '', { maxAge: 0 });
        return response;
    }

    // Role-based access
    if (pathname.startsWith('/faculty') && payload.role !== 'FACULTY' && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL(getDashboardRoute(payload.role), request.url));
    }

    if (pathname.startsWith('/student') && payload.role !== 'STUDENT') {
        // Allow Faculty and Admins to view public student profiles
        if (pathname.startsWith('/student/profile/') && (payload.role === 'FACULTY' || payload.role === 'ADMIN')) {
            // allow access
        } else {
            return NextResponse.redirect(new URL(getDashboardRoute(payload.role), request.url));
        }
    }

    if (pathname.startsWith('/maintenance') && payload.role !== 'MAINTENANCE' && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL(getDashboardRoute(payload.role), request.url));
    }

    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL(getDashboardRoute(payload.role), request.url));
    }

    // Redirect root to appropriate dashboard
    if (pathname === '/') {
        return NextResponse.redirect(new URL(getDashboardRoute(payload.role), request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/login', '/register', '/faculty/:path*', '/student/:path*', '/admin/:path*', '/maintenance/:path*'],
};
