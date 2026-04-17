import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900 p-6 relative overflow-hidden">
      
      {/* Dekorasi Latar Belakang (Opsional agar terlihat modern) */}
      <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-200 rounded-full blur-3xl opacity-50"></div>

      {/* Konten Utama */}
      <div className="z-10 flex flex-col items-center text-center space-y-6">
        {/* Ikon/Logo Sederhana */}
        <div className="w-20 h-20 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-300">
          <span className="text-white text-4xl font-bold">A</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            E-Keuangan <span className="text-emerald-600">Al-Fath</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
            Sistem manajemen iuran dan SPP siswa yang modern, cepat, dan transparan.
          </p>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
          <Link 
            href="/dashboard/pembayaran" 
            className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all text-center"
          >
            Masuk ke Dashboard
          </Link>
          
          <Link 
            href="/login" 
            className="px-8 py-4 bg-white text-emerald-700 font-bold rounded-2xl border-2 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-center"
          >
            Halaman Login
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-10 flex flex-col items-center gap-2">
        <div className="flex gap-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
          <span>Efisien</span>
          <span>•</span>
          <span>Aman</span>
          <span>•</span>
          <span>Terintegrasi</span>
        </div>
        <p className="text-slate-400 text-sm mt-2">
          © 2026 SD IT AL FATH PEKANBARU
        </p>
      </footer>
    </div>
  );
}