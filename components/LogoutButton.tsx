"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    const confirmLogout = confirm("Apakah Anda yakin ingin keluar?");
    if (!confirmLogout) return;

    setLoading(true);
    try {
      // Tambahkan scope global untuk memastikan sesi di semua tab tertutup
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Gunakan window.location agar Middleware benar-benar mendeteksi
      // bahwa session sudah hilang dan membersihkan cookie
      window.location.href = "/login";
    } catch (error: any) {
      console.error("Error logging out:", error.message);
      alert("Gagal keluar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center gap-3 p-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95 disabled:opacity-50 group"
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </div>
      <span>{loading ? "Mengeluarkan..." : "Keluar Sistem"}</span>
    </button>
  );
}
