"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "staff",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (!error) setUsers(data || []);
    setLoading(false);
  }

  function openEditModal(user: any) {
    setEditingId(user.id);
    setFormData({
      email: user.email || "",
      full_name: user.full_name || "",
      role: user.role || "staff",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ email: "", full_name: "", role: "staff" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
        })
        .eq("id", editingId);

      if (!error) {
        fetchUsers();
        closeModal();
      } else {
        alert("Gagal update: " + error.message);
      }
    } else {
      const { error } = await supabase.from("profiles").insert([
        {
          full_name: formData.full_name,
          role: formData.role,
          email: formData.email,
        },
      ]);

      if (!error) {
        fetchUsers();
        closeModal();
      } else {
        alert("Gagal menambah: " + error.message);
      }
    }
    setLoading(false);
  }

  async function deleteUser(id: string) {
    if (confirm("Hapus pengguna ini secara permanen?")) {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (!error) setUsers(users.filter((u) => u.id !== id));
      else alert("Gagal hapus: " + error.message);
    }
  }

  return (
    <div className="space-y-6"> {/* Menghapus animate-in sementara untuk cek posisi */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Manajemen Pengguna
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Kelola identitas dan hak akses staf operasional.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          ➕ Tambah User
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b">
                <th className="px-8 py-5">Identitas Staf</th>
                <th className="px-8 py-5">Status Akses</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    {/* Perubahan Utama: Menambahkan 'relative' dan 'shrink-0' */}
                    <div className="flex items-center gap-4 relative"> 
                      <div className="shrink-0 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-inner">
                        {u.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-base truncate">{u.full_name}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      u.role === "admin" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="bg-slate-100 hover:bg-slate-900 hover:text-white p-2.5 rounded-xl transition-all"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="bg-red-50 hover:bg-red-600 text-red-500 hover:text-white p-2.5 rounded-xl transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tetap sama */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {editingId ? "Update Data Staf" : "Tambah Staf Baru"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-black text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nama Lengkap</label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-black"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Email Aktif</label>
                <input
                  required
                  type="email"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-black"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Role Akses</label>
                <select
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-emerald-500 font-bold text-black"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="staff">Staff (Operasional)</option>
                  <option value="admin">Admin (Penuh)</option>
                </select>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest"
                >
                  {loading ? "Memproses..." : editingId ? "Simpan Perubahan" : "Daftarkan Staf"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}