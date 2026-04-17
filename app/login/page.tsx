"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  // Menggunakan fullName sebagai pengganti email di form login
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. CARI EMAIL & ROLE BERDASARKAN NAMA LENGKAP
      // Kita mencari ke tabel profiles terlebih dahulu
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("email, role")
        .eq("full_name", fullName)
        .single();

      if (userError || !userData) {
        throw new Error("Nama lengkap tidak ditemukan.");
      }

      // 2. LOGIN MENGGUNAKAN EMAIL YANG DITEMUKAN & PASSWORD
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: password,
      });

      if (authError) {
        throw new Error("Password salah.");
      }

      // 3. REDIRECT BERDASARKAN ROLE
      // Menggunakan data role yang sudah diambil di langkah 1 (lebih efisien)
      if (userData.role === "admin") {
        router.push("/dashboard/admin/pembayaran");
      } else {
        router.push("/dashboard/staff/pembayaran");
      }

      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo & Judul */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-100 mb-2">
            <span className="text-white text-3xl font-bold italic">A</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Selamat Datang</h1>
          <p className="text-sm text-slate-500">
            Masuk ke Sistem Keuangan Al-Fath
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Alert Error */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl font-medium animate-shake">
                ⚠️ {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="Contoh: Naufal Azra"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Mengecek Akses...
                </span>
              ) : (
                "Masuk Sekarang"
              )}
            </button>
          </form>
        </div>

        {/* Link Kembali */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-emerald-600 transition-colors font-medium"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
