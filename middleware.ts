import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Inisialisasi response awal
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Inisialisasi Supabase Client dengan penanganan cookie yang benar
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // 3. Ambil user session
  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  // PROTEKSI 1: Belum login mencoba masuk dashboard
  if (!user && url.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // PROTEKSI 2: Sudah login mencoba masuk halaman login lagi
  if (user && url.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard/pembayaran', request.url))
  }

  // PROTEKSI 3: Pengecekan Role
  // middleware.ts (Bagian logika proteksi role)

if (user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const isLoginPage = url.pathname === '/login'
  const isRootDashboard = url.pathname === '/dashboard'

  // Jika Admin login atau buka root dashboard, arahkan ke menu adminnya
  if (role === 'admin' && (isLoginPage || isRootDashboard)) {
    return NextResponse.redirect(new URL('/dashboard/admin/pembayaran', request.url))
  }

  // Jika Staff mencoba masuk ke folder admin, kembalikan ke pembayaran staff
  if (role === 'staff' && url.pathname.startsWith('/dashboard/admin')) {
    return NextResponse.redirect(new URL('/dashboard/pembayaran', request.url))
  }
}

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}