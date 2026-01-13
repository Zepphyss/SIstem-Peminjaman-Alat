import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_dont_use_in_prod";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ambil token dari cookie
  const token = request.cookies.get("token")?.value;

  // Paths yang dilindungi
  const protectedPaths = ["/admin", "/dashboard"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // Jika mengakses halaman login tapi sudah punya token valid -> redirect ke dashboard/admin
  if (pathname === "/login" && token) {
    try {
      await jwtVerify(token, encodedSecret);
      // Asumsi: kita bisa cek role dari token jika perlu redirect spesifik
      // Untuk kesederhanaan, redirect ke home atau admin default
      return NextResponse.redirect(new URL("/admin", request.url));
    } catch (e) {
      // Token tidak valid, biarkan akses login
    }
  }

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, encodedSecret);

      // Role based protection (opsional: cek payload.role jika perlu)
      // Contoh: if (pathname.startsWith('/admin') && payload.role !== 'admin') ...
    } catch (error) {
      // Token unverified/expired
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login"],
};
