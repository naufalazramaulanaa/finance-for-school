"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function MasterKelasPage() {
  const [listKelas, setListKelas] = useState<any[]>([]);
  const [namaKelas, setNamaKelas] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchKelas();
  }, []);

  const fetchKelas = async () => {
    const { data, error } = await supabase
      .from("kelas")
      .select("*")
      .order("nama_kelas", { ascending: true });

    if (error) console.error(error.message);
    setListKelas(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKelas) return;

    setLoading(true);
    let error;

    if (editingId) {
      const { error: err } = await supabase
        .from("kelas")
        .update({ nama_kelas: namaKelas })
        .eq("id", editingId);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("kelas")
        .insert([{ nama_kelas: namaKelas }]);
      error = err;
    }

    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      setNamaKelas("");
      setEditingId(null);
      fetchKelas();
    }
    setLoading(false);
  };

  const handleEdit = (item: any) => {
    setNamaKelas(item.nama_kelas);
    setEditingId(item.id);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (
      confirm(
        `Hapus kelas ${nama}? Ini mungkin berdampak pada data siswa di kelas tersebut.`,
      )
    ) {
      const { error } = await supabase.from("kelas").delete().eq("id", id);
      if (error) alert(error.message);
      else fetchKelas();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Manajemen Kelas
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Kelola daftar kelas yang tersedia untuk pendaftaran siswa.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow w-full">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">
              Nama Kelas Baru
            </label>
            <input
              type="text"
              required
              value={namaKelas}
              onChange={(e) => setNamaKelas(e.target.value)}
              placeholder="Contoh: X IPA 1, XII TKJ 2..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="submit"
              disabled={loading}
              className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:bg-slate-200"
            >
              {loading ? "..." : editingId ? "Update Kelas" : "Tambah Kelas"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setNamaKelas("");
                }}
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
                <th className="px-8 py-5">Nama Kelas</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listKelas.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-xs"
                  >
                    Belum ada data kelas.
                  </td>
                </tr>
              ) : (
                listKelas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-black text-xs">
                          {item.nama_kelas?.substring(0, 1).toUpperCase()}
                        </div>
                        <span className="font-black text-slate-900 text-base italic uppercase">
                          {item.nama_kelas}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-slate-100 hover:bg-slate-900 hover:text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-90"
                          title="Edit Kelas"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.nama_kelas)}
                          className="bg-red-50 hover:bg-red-600 text-red-500 hover:text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-90"
                          title="Hapus Kelas"
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