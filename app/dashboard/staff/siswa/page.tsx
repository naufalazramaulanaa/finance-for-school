"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SiswaPage() {
  const [siswa, setSiswa] = useState<any[]>([]);
  const [kelas, setKelas] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: "",
    no_induk: "",
    nama_siswa: "",
    kelas_id: "",
  });

  useEffect(() => {
    fetchSiswa();
    fetchKelas();
  }, []);

  const fetchSiswa = async () => {
    const { data } = await supabase
      .from("siswa")
      .select("*, kelas(nama_kelas)")
      .order("nama_siswa", { ascending: true });
    setSiswa(data || []);
  };

  const fetchKelas = async () => {
    const { data } = await supabase
      .from("kelas")
      .select("*")
      .order("nama_kelas");
    setKelas(data || []);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.no_induk || !form.nama_siswa || !form.kelas_id) {
      alert("Mohon lengkapi semua data");
      return;
    }

    setLoading(true);

    const payload = {
      no_induk: form.no_induk,
      nama_siswa: form.nama_siswa,
      kelas_id: form.kelas_id,
    };

    let error;
    if (form.id) {
      const { error: updateError } = await supabase
        .from("siswa")
        .update(payload)
        .eq("id", form.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("siswa")
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      closeModal();
      fetchSiswa();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus siswa ${nama}?`)) {
      const { error } = await supabase.from("siswa").delete().eq("id", id);
      if (error) {
        alert("Gagal menghapus: " + error.message);
      } else {
        fetchSiswa();
      }
    }
  };

  const openModal = (data: any = null) => {
    if (data) {
      setForm({
        id: data.id,
        no_induk: data.no_induk,
        nama_siswa: data.nama_siswa,
        kelas_id: data.kelas_id,
      });
    } else {
      setForm({ id: "", no_induk: "", nama_siswa: "", kelas_id: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm({ id: "", no_induk: "", nama_siswa: "", kelas_id: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Data Siswa
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Kelola informasi identitas dan penempatan kelas siswa.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          ➕ Tambah Siswa
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b">
                <th className="px-8 py-5">Siswa & No. Induk</th>
                <th className="px-8 py-5">Kelas</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {siswa.length > 0 ? (
                siswa.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="shrink-0 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-inner uppercase">
                          {s.nama_siswa?.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-base truncate uppercase italic">
                            {s.nama_siswa}
                          </p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                            NI: {s.no_induk}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        {s.kelas?.nama_kelas || "Tanpa Kelas"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModal(s)}
                          className="bg-slate-100 hover:bg-slate-900 hover:text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-90"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.nama_siswa)}
                          className="bg-red-50 hover:bg-red-600 text-red-500 hover:text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-90"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-xs"
                  >
                    Belum ada data siswa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {form.id ? "Update Data Siswa" : "Tambah Siswa Baru"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-black text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                  Nomor Induk Siswa
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-black"
                  value={form.no_induk}
                  onChange={(e) =>
                    setForm({ ...form, no_induk: e.target.value })
                  }
                  placeholder="Contoh: 2024001"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-black uppercase"
                  value={form.nama_siswa}
                  onChange={(e) =>
                    setForm({ ...form, nama_siswa: e.target.value })
                  }
                  placeholder="Masukkan nama lengkap..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                  Penempatan Kelas
                </label>
                <select
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-black cursor-pointer"
                  value={form.kelas_id}
                  onChange={(e) =>
                    setForm({ ...form, kelas_id: e.target.value })
                  }
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelas.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-emerald-100"
                >
                  {loading
                    ? "Memproses..."
                    : form.id
                      ? "Simpan Perubahan"
                      : "Daftarkan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
