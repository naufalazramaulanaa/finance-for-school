"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function KasirPembayaranSiswa() {
  const [siswa, setSiswa] = useState<any[]>([]);
  const [jenisBayar, setJenisBayar] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]); // State untuk tabel riwayat
  const [selectedSiswaId, setSelectedSiswaId] = useState("");
  const [detailSiswa, setDetailSiswa] = useState<any>(null);
  const [inputNominal, setInputNominal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [lastTrxId, setLastTrxId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
    fetchHistory();
  }, []);

  async function fetchInitialData() {
    const { data: ds } = await supabase.from("siswa").select("*, kelas(nama_kelas)");
    const { data: djb } = await supabase.from("jenis_pembayaran").select("*");
    setSiswa(ds || []);
    setJenisBayar(djb || []);
  }

  // Ambil data riwayat transaksi terbaru
  async function fetchHistory() {
    const { data, error } = await supabase
      .from("transaksi")
      .select("*, siswa(nama_siswa, no_induk, kelas(nama_kelas))")
      .order("created_at", { ascending: false })
      .limit(10); // Ambil 10 transaksi terakhir
    
    if (error) console.error(error);
    else setHistory(data || []);
  }

  useEffect(() => {
    if (selectedSiswaId) {
      const s = siswa.find((item) => item.id === selectedSiswaId);
      setDetailSiswa(s);
    } else {
      setDetailSiswa(null);
    }
  }, [selectedSiswaId, siswa]);

  const totalBayar = Object.values(inputNominal).reduce((a, b) => a + (parseInt(b) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswaId || totalBayar <= 0) return alert("Pilih siswa dan masukkan nominal!");

    setLoading(true);
    const noTrans = `TRX-${Date.now()}`;

    const { data: trx, error: errTrx } = await supabase
      .from("transaksi")
      .insert([{ 
        no_transaksi: noTrans, 
        siswa_id: selectedSiswaId, 
        total_bayar: totalBayar,
        tanggal_bayar: new Date().toISOString()
      }])
      .select().single();

    if (errTrx) {
      alert("Gagal simpan transaksi: " + errTrx.message);
      setLoading(false);
      return;
    }

    const details = Object.entries(inputNominal)
      .filter(([_, nominal]) => parseInt(nominal) > 0)
      .map(([id, nominal]) => ({
        transaksi_id: trx.id,
        jenis_pembayaran_id: id,
        nominal: parseInt(nominal)
      }));

    const { error: errDetail } = await supabase.from("transaksi_detail").insert(details);

    if (errDetail) {
      alert("Gagal simpan detail: " + errDetail.message);
    } else {
      alert("Pembayaran Berhasil Disimpan!");
      setLastTrxId(trx.id);
      setSelectedSiswaId("");
      setInputNominal({});
      fetchHistory(); // Refresh tabel history setelah simpan
    }
    setLoading(false);
  };

  const handleDeleteTrx = async (id: string) => {
    if (confirm("Hapus transaksi ini? Tindakan ini tidak dapat dibatalkan.")) {
      const { error } = await supabase.from("transaksi").delete().eq("id", id);
      if (error) alert(error.message);
      else fetchHistory();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 p-4">
      {/* SEKSI INPUT PEMBAYARAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: Identitas */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Cari & Pilih Siswa</label>
            <input 
              list="daftar-siswa"
              placeholder="Ketik nama siswa..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 text-black font-semibold"
              onChange={(e) => {
                const val = e.target.value;
                const found = siswa.find(s => s.nama_siswa === val);
                if (found) setSelectedSiswaId(found.id);
              }}
            />
            <datalist id="daftar-siswa">
              {siswa.map(s => <option key={s.id} value={s.nama_siswa} />)}
            </datalist>
              
            {detailSiswa && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Profil Terpilih</p>
                <h3 className="font-black text-black text-xl mt-1">{detailSiswa.nama_siswa}</h3>
                <div className="mt-2 space-y-1">
                    <p className="text-sm text-black font-medium">No. Induk: <span className="font-bold">{detailSiswa.no_induk || '-'}</span></p>
                    <p className="text-sm text-black font-medium">Kelas: <span className="font-bold">{detailSiswa.kelas?.nama_kelas}</span></p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Bayar</p>
            <h2 className="text-4xl font-black mt-2 text-emerald-400">Rp {totalBayar.toLocaleString("id-ID")}</h2>
            <button 
              onClick={handleSubmit}
              disabled={loading || !selectedSiswaId || totalBayar === 0}
              className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 py-4 rounded-xl font-black transition-all active:scale-95"
            >
              {loading ? "MENYIMPAN..." : "SIMPAN PEMBAYARAN"}
            </button>
          </div>
        </div>

        {/* KOLOM KANAN: Input Nominal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-black text-slate-700 uppercase text-xs tracking-widest">
              Rincian Kategori Tagihan
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {jenisBayar.map((jb) => (
                <div key={jb.id} className="space-y-2 group">
                  <label className="text-sm font-bold text-black">{jb.nama_pembayaran}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black font-bold text-sm">Rp</span>
                    <input 
                      type="number"
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-black font-black text-lg transition-all"
                      value={inputNominal[jb.id] || ""}
                      onChange={(e) => setInputNominal({ ...inputNominal, [jb.id]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEKSI TABEL DAFTAR PEMBAYARAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Riwayat Pembayaran Terbaru</h3>
          <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">10 Data Terakhir</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Waktu / No. Trans</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Siswa</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Kelas</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Total Bayar</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-black">{new Date(h.created_at).toLocaleDateString('id-ID')}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{h.no_transaksi}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-black uppercase">{h.siswa?.nama_siswa}</p>
                    <p className="text-[10px] text-slate-500 font-bold">NI: {h.siswa?.no_induk}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">
                      {h.siswa?.kelas?.nama_kelas}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black text-black">Rp {h.total_bayar.toLocaleString('id-ID')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => window.open(`/dashboard/pembayaran/print/${h.id}`, '_blank')}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        title="Cetak Kwitansi"
                      >
                        🖨️
                      </button>
                      <button 
                        onClick={() => handleDeleteTrx(h.id)}
                        className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Hapus"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">Belum ada transaksi hari ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}