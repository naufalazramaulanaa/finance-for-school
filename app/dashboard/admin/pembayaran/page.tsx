"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function MasterPembayaranAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [nama, setNama] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    const { data, error } = await supabase
      .from("jenis_pembayaran")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil data:", error.message);
      return;
    }
    setList(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // Menambahkan preventDefault agar lebih aman
    if (!nama) return;
    setLoading(true);

    if (editingId) {
      const { error } = await supabase
        .from("jenis_pembayaran")
        .update({ nama_pembayaran: nama })
        .eq("id", editingId);

      if (error) alert(error.message);
      setEditingId(null);
    } else {
      const { error } = await supabase
        .from("jenis_pembayaran")
        .insert([{ nama_pembayaran: nama }]);

      if (error) alert(error.message);
    }

    setNama("");
    fetchList();
    setLoading(false);
  }

  const handleEdit = (item: any) => {
    setNama(item.nama_pembayaran);
    setEditingId(item.id);
  };

  const cancelEdit = () => {
    setNama("");
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Master Data Pembayaran
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Kelola jenis tagihan untuk mempermudah Staff saat input transaksi.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-4 items-end"
        >
          <div className="flex-grow w-full">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">
              {editingId
                ? "Edit Nama Pembayaran"
                : "Nama Kategori Pembayaran Baru"}
            </label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
              placeholder="Contoh: SPP, Uang Gedung, Seragam..."
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="submit"
              disabled={loading}
              className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:bg-slate-200"
            >
              {loading ? "..." : editingId ? "Simpan Perubahan" : "Tambah Data"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-slate-100 text-slate-500 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b">
                <th className="px-8 py-5">Nama Pembayaran</th>
                <th className="px-8 py-5">Dibuat Pada</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-xs"
                  >
                    Belum ada data pembayaran.
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px]">
                          💰
                        </div>
                        <span className="font-black text-slate-900 text-base uppercase">
                          {item.nama_pembayaran}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-slate-100 hover:bg-slate-900 hover:text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-90"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={async () => {
                            if (
                              confirm(
                                `Hapus "${item.nama_pembayaran}"? Ini tidak bisa dibatalkan.`,
                              )
                            ) {
                              await supabase
                                .from("jenis_pembayaran")
                                .delete()
                                .eq("id", item.id);
                              fetchList();
                            }
                          }}
                          className="bg-red-50 hover:bg-red-600 text-red-500 hover:text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-90"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
