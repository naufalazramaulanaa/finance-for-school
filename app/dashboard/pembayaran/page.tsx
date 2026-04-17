"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function FormPembayaran() {
  // Fix Error: Tambahkan type <any[]> pada useState
  const [jenisBayar, setJenisBayar] = useState<any[]>([]);
  const [siswa, setSiswa] = useState<any[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState("");
  const [inputBayar, setInputBayar] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: jb } = await supabase.from("jenis_pembayaran").select("*");
      const { data: sw } = await supabase
        .from("siswa")
        .select("*, kelas(nama_kelas)");
      setJenisBayar(jb || []);
      setSiswa(sw || []);
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswa) return alert("Pilih siswa terlebih dahulu!");

    setLoading(true);

    const noTrans = `TRX-${Date.now()}`;
    // Hitung total dengan memastikan input adalah angka
    const total = Object.values(inputBayar).reduce(
      (a, b) => a + (parseInt(b) || 0),
      0,
    );

    if (total <= 0) {
      alert("Masukkan nominal pembayaran minimal pada satu kategori.");
      setLoading(false);
      return;
    }

    const { data: trx, error } = await supabase
      .from("transaksi")
      .insert([
        {
          no_transaksi: noTrans,
          siswa_id: selectedSiswa,
          total_bayar: total,
        },
      ])
      .select()
      .single();

    if (trx) {
      // Filter hanya input yang ada nominalnya agar tidak insert detail kosong
      const details = Object.entries(inputBayar)
        .filter(([_, nominal]) => parseInt(nominal) > 0)
        .map(([id, nominal]) => ({
          transaksi_id: trx.id,
          jenis_pembayaran_id: id,
          nominal: parseInt(nominal),
        }));

      const { error: errDetail } = await supabase
        .from("transaksi_detail")
        .insert(details);

      if (!errDetail) {
        alert("Pembayaran Berhasil!");
        window.open(`/dashboard/pembayaran/print/${trx.id}`, "_blank");
        setInputBayar({}); // Reset form
        setSelectedSiswa("");
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900">Input Pembayaran</h1>
        <p className="text-slate-500">
          Silakan pilih siswa dan masukkan nominal tagihan yang dibayar.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Kolom Kiri: Pilih Siswa */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <label className="block text-sm font-bold text-emerald-800 mb-3 uppercase tracking-wider">
              Informasi Siswa
            </label>
            <div className="relative">
              <select
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-3.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none"
                value={selectedSiswa}
                onChange={(e) => setSelectedSiswa(e.target.value)}
                required
              >
                <option value="">-- Cari Nama Siswa --</option>
                {siswa.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_siswa} ({s.kelas?.nama_kelas})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-100 text-white">
            <p className="text-emerald-100 text-sm font-medium">
              Total yang harus dibayar:
            </p>
            <h2 className="text-3xl font-bold mt-1">
              Rp{" "}
              {Object.values(inputBayar)
                .reduce((a, b) => a + (parseInt(b) || 0), 0)
                .toLocaleString("id-ID")}
            </h2>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Pembayaran */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">
                Rincian Kategori Tagihan
              </h3>
            </div>

            <div className="p-6 space-y-5">
              {jenisBayar.length === 0 ? (
                <p className="text-center text-slate-400 py-4 italic">
                  Memuat kategori pembayaran...
                </p>
              ) : (
                jenisBayar.map((j: any) => (
                  <div
                    key={j.id}
                    className="group flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/30 transition-all"
                  >
                    <label className="md:w-1/3 font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                      {j.nama_pembayaran}
                    </label>
                    <div className="flex-grow relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                        Rp
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full bg-white border-slate-200 rounded-xl p-3 pl-12 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={inputBayar[j.id] || ""}
                        onChange={(e) =>
                          setInputBayar({
                            ...inputBayar,
                            [j.id]: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2 text-lg"
              >
                {loading ? "Memproses..." : "✅ Simpan & Cetak Kwitansi"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
