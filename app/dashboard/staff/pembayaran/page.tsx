"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import ModalDetailPembayaran from "@/components/ModaldetailPembayaran";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// Custom styling untuk SweetAlert agar matching dengan UI kamu
const toastConfig = {
  customClass: {
    popup: "rounded-[2rem] border-none shadow-2xl font-sans",
    confirmButton:
      "bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase transition-all outline-none border-none mx-2",
    cancelButton:
      "bg-slate-200 hover:bg-slate-300 text-slate-600 px-6 py-3 rounded-xl font-black text-xs uppercase transition-all outline-none border-none mx-2",
    title: "text-xl font-black tracking-tighter text-slate-800",
    htmlContainer: "text-xs font-bold text-slate-400 uppercase tracking-wide",
  },
  buttonsStyling: false,
};

export default function KasirPembayaranSiswa() {
  // --- States ---
  const [siswa, setSiswa] = useState<any[]>([]);
  const [kelas, setKelas] = useState<any[]>([]);
  const [jenisBayar, setJenisBayar] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isModalFormOpen, setIsModalFormOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<
    "kasir" | "filterSiswa" | "filterKelas" | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterSiswaId, setFilterSiswaId] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const itemsPerPage = 5;
  const [selectedSiswaId, setSelectedSiswaId] = useState("");
  const [searchKasir, setSearchKasir] = useState("");
  const [searchFilterSiswa, setSearchFilterSiswa] = useState("");
  const [inputNominal, setInputNominal] = useState<Record<string, string>>({});
  const [modalDetail, setModalDetail] = useState<any>(null);
  const [rincianTransaksi, setRincianTransaksi] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const init = async () => {
      const [{ data: ds }, { data: dk }, { data: djb }] = await Promise.all([
        supabase
          .from("siswa")
          .select("*, kelas(nama_kelas)")
          .order("nama_siswa", { ascending: true }),
        supabase.from("kelas").select("*"),
        supabase.from("jenis_pembayaran").select("*"),
      ]);
      setSiswa(ds || []);
      setKelas(dk || []);
      setJenisBayar(djb || []);
    };
    init();
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      let query = supabase
        .from("transaksi")
        .select(
          `*, siswa!inner(nama_siswa, no_induk, kelas!inner(id, nama_kelas))`,
          { count: "exact" },
        );
      if (selectedKelas) query = query.eq("siswa.kelas.id", selectedKelas);
      if (filterSiswaId) query = query.eq("siswa_id", filterSiswaId);
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      setHistory(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterSiswaId, selectedKelas]);

  useEffect(() => {
    if (isMounted) fetchHistory();
  }, [fetchHistory, isMounted]);

  // --- ACTIONS WITH COOL ALERTS ---

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswaId || totalBayar <= 0) return;
    setLoading(true);

    try {
      const { data: trx, error: insError } = await supabase
        .from("transaksi")
        .insert([
          {
            no_transaksi: `TRX-${Date.now()}`,
            siswa_id: selectedSiswaId,
            total_bayar: totalBayar,
            tanggal_bayar: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insError) throw insError;

      const details = Object.entries(inputNominal)
        .filter(([_, v]) => parseInt(v) > 0)
        .map(([id, v]) => ({
          transaksi_id: trx.id,
          jenis_pembayaran_id: id,
          nominal: parseInt(v),
        }));

      if (details.length > 0) {
        const { error: detError } = await supabase
          .from("transaksi_detail")
          .insert(details);
        if (detError) throw detError;
      }

      // Cool Success Alert
      MySwal.fire({
        ...toastConfig,
        title: "BERHASIL DISIMPAN",
        text: "Transaksi pembayaran telah tercatat ke sistem.",
        icon: "success",
        iconColor: "#10b981",
      });

      closeModalForm();
      fetchHistory();
    } catch (err: any) {
      MySwal.fire({
        ...toastConfig,
        title: "GAGAL MENYIMPAN",
        text: err.message,
        icon: "error",
        iconColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareEdit = (trx: any) => {
    // Cool Maintenance Alert
    MySwal.fire({
      ...toastConfig,
      title: "UNDER MAINTENANCE",
      html: "Fitur <b>Update</b> sedang diperbaiki untuk mencegah duplikasi data rincian.",
      icon: "warning",
      iconColor: "#f59e0b",
      confirmButtonText: "SAYA MENGERTI",
    });
  };

  const handleDelete = async (id: string) => {
    // Cool Confirmation Alert
    MySwal.fire({
      ...toastConfig,
      title: "HAPUS TRANSAKSI?",
      text: "Data yang dihapus tidak dapat dipulihkan kembali.",
      icon: "question",
      iconColor: "#ef4444",
      showCancelButton: true,
      confirmButtonText: "YA, HAPUS",
      cancelButtonText: "BATAL",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase
          .from("transaksi")
          .delete()
          .eq("id", id);
        if (error) {
          MySwal.fire({
            ...toastConfig,
            title: "GAGAL",
            text: "Terjadi kesalahan saat menghapus",
            icon: "error",
          });
        } else {
          fetchHistory();
          MySwal.fire({
            ...toastConfig,
            title: "TERHAPUS",
            text: "Data berhasil dibersihkan.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      }
    });
  };

  const closeModalForm = () => {
    setIsModalFormOpen(false);
    setSelectedSiswaId("");
    setSearchKasir("");
    setInputNominal({});
  };

  const handleShowDetail = async (trx: any) => {
    const { data } = await supabase
      .from("transaksi_detail")
      .select(`*, jenis_pembayaran(nama_pembayaran)`)
      .eq("transaksi_id", trx.id);
    setRincianTransaksi(data || []);
    setModalDetail(trx);
  };

  const filteredSiswaKasir = siswa.filter((s) =>
    s.nama_siswa.toLowerCase().includes(searchKasir.toLowerCase()),
  );
  const filteredSiswaTable = siswa.filter((s) =>
    s.nama_siswa.toLowerCase().includes(searchFilterSiswa.toLowerCase()),
  );
  const detailSiswa = siswa.find((s) => s.id === selectedSiswaId);
  const totalBayar = Object.values(inputNominal).reduce(
    (a, b) => a + (parseInt(b) || 0),
    0,
  );

  if (!isMounted) return null;

  return (
    <div
      className="max-w-6xl mx-auto space-y-6 p-4 bg-slate-50 min-h-screen text-slate-900"
      ref={containerRef}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">
            Manajemen Pembayaran
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
            Sistem Manajemen Keuangan
          </p>
        </div>
        <button
          onClick={() => setIsModalFormOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          + Transaksi Baru
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">
            History Log
          </h3>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Filter Kelas */}
            <div className="relative md:w-44">
              <div
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === "filterKelas" ? null : "filterKelas",
                  )
                }
                className="p-3 bg-slate-50 rounded-xl text-[11px] font-black uppercase flex justify-between items-center cursor-pointer border border-transparent hover:border-slate-200"
              >
                <span>
                  {kelas.find((k) => k.id === selectedKelas)?.nama_kelas ||
                    "Semua Kelas"}
                </span>
                <span
                  className={`transition-transform ${openDropdown === "filterKelas" ? "rotate-180" : ""}`}
                >
                  ▼
                </span>
              </div>
              {openDropdown === "filterKelas" && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden">
                  <div className="max-h-40 overflow-y-auto custom-scroll">
                    <div
                      onClick={() => {
                        setSelectedKelas("");
                        setOpenDropdown(null);
                      }}
                      className="px-5 py-3 text-[11px] font-black uppercase hover:bg-emerald-50 cursor-pointer"
                    >
                      Semua Kelas
                    </div>
                    {kelas.map((k) => (
                      <div
                        key={k.id}
                        onClick={() => {
                          setSelectedKelas(k.id);
                          setOpenDropdown(null);
                        }}
                        className="px-5 py-3 text-[11px] font-black uppercase hover:bg-emerald-50 cursor-pointer"
                      >
                        {k.nama_kelas}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Nama */}
            <div className="relative md:w-64">
              <div
                onClick={() => setOpenDropdown("filterSiswa")}
                className="flex items-center bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
              >
                <span className="pl-3 text-[10px]">🔍</span>
                <input
                  type="text"
                  className="w-full p-3 bg-transparent font-bold outline-none text-[11px]"
                  placeholder={
                    siswa.find((s) => s.id === filterSiswaId)?.nama_siswa ||
                    "Cari Nama Siswa..."
                  }
                  value={searchFilterSiswa}
                  onChange={(e) => {
                    setSearchFilterSiswa(e.target.value);
                    setOpenDropdown("filterSiswa");
                  }}
                />
              </div>
              {openDropdown === "filterSiswa" && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden">
                  <div className="max-h-52 overflow-y-auto custom-scroll">
                    <div
                      onClick={() => {
                        setFilterSiswaId("");
                        setSearchFilterSiswa("");
                        setOpenDropdown(null);
                      }}
                      className="px-5 py-3 text-[11px] font-black uppercase hover:bg-emerald-50 cursor-pointer italic text-slate-400"
                    >
                      Reset Filter
                    </div>
                    {filteredSiswaTable.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setFilterSiswaId(s.id);
                          setSearchFilterSiswa(s.nama_siswa);
                          setOpenDropdown(null);
                        }}
                        className="px-5 py-3 cursor-pointer hover:bg-emerald-50 text-[11px] font-black uppercase"
                      >
                        {s.nama_siswa}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLE BODY */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                <th className="px-8 py-5">No Transaksi / Waktu</th>
                <th className="px-8 py-5">Siswa & Kelas</th>
                <th className="px-8 py-5 text-right">Nominal</th>
                <th className="px-8 py-5 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((h) => (
                <tr
                  key={h.id}
                  className="hover:bg-slate-50/80 transition-all group"
                >
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800 text-xs tracking-tighter">
                      {h.no_transaksi}
                    </p>
                    <p className="text-[10px] text-slate-400 font-black uppercase">
                      {new Date(h.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-black text-xs uppercase text-slate-700">
                      {h.siswa?.nama_siswa}
                    </p>
                    <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                      {h.siswa?.kelas?.nama_kelas}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-emerald-600 text-sm">
                    Rp {h.total_bayar.toLocaleString("id-ID")}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleShowDetail(h)}
                        className="p-2 bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => prepareEdit(h)}
                        className="p-2 bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="p-2 bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
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

        {/* PAGINATION */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Rec: {totalCount} Data
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black disabled:opacity-30 active:scale-95 transition-all"
            >
              PREV
            </button>
            <span className="text-[10px] font-black px-4">{currentPage}</span>
            <button
              disabled={
                currentPage >= Math.ceil(totalCount / itemsPerPage) || loading
              }
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black disabled:opacity-30 active:scale-95 transition-all"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>

      {/* MODAL FORM */}
      {/* MODAL FORM (INSERT ONLY) */}
      {isModalFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={closeModalForm}
          ></div>

          <div className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* HEADER MODAL */}
            <div className="p-8 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-800">
                  Input Pembayaran
                </h2>
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                  Registrasi transaksi baru ke sistem
                </p>
              </div>
              <button
                onClick={closeModalForm}
                className="bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 w-12 h-12 rounded-2xl flex items-center justify-center transition-all group"
              >
                <span className="text-2xl group-hover:rotate-90 transition-transform">
                  ✕
                </span>
              </button>
            </div>

            <div className="p-8 pt-2 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto custom-scroll">
              {/* PANEL KIRI: SISWA & TOTAL (Col 5) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="relative group">
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-2 tracking-widest">
                    Pilih Nama Siswa
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full p-5 pl-14 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-[1.8rem] font-bold outline-none transition-all shadow-sm text-slate-700"
                      placeholder="Ketik nama siswa..."
                      value={searchKasir}
                      onChange={(e) => {
                        setSearchKasir(e.target.value);
                        setOpenDropdown("kasir");
                      }}
                    />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl">
                      👤
                    </span>
                  </div>

                  {openDropdown === "kasir" && (
                    <div className="absolute z-[70] w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-[1.8rem] max-h-60 overflow-y-auto custom-scroll p-2">
                      {filteredSiswaKasir.length > 0 ? (
                        filteredSiswaKasir.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedSiswaId(s.id);
                              setSearchKasir(s.nama_siswa);
                              setOpenDropdown(null);
                            }}
                            className="px-5 py-4 cursor-pointer hover:bg-emerald-50 rounded-2xl font-black text-xs uppercase border-b border-slate-50 last:border-0 transition-all flex justify-between items-center group"
                          >
                            <span>{s.nama_siswa}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-1 rounded-lg group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                              {s.kelas?.nama_kelas}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-[10px] font-black uppercase text-slate-400">
                          Siswa tidak ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-10 bg-slate-900 rounded-[2.8rem] text-center shadow-2xl shadow-slate-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] relative z-10">
                    Grand Total Tagihan
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4 relative z-10">
                    <span className="text-2xl font-black text-emerald-500/50 italic">
                      Rp
                    </span>
                    <p className="text-6xl font-black text-emerald-400 tracking-tighter">
                      {totalBayar.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={loading || !selectedSiswaId || totalBayar === 0}
                    className="w-full mt-10 p-6 rounded-[1.5rem] font-black text-[13px] uppercase tracking-widest bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-20 disabled:grayscale transition-all relative z-10"
                  >
                    {loading ? "Memproses Data..." : "Konfirmasi & Simpan"}
                  </button>
                </div>
              </div>

              {/* PANEL KANAN: ITEM PEMBAYARAN (Col 7) */}
              <div className="lg:col-span-7">
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 ml-2 tracking-widest">
                  Detail Item Pembayaran
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[55vh] lg:max-h-none overflow-y-auto pr-2 custom-scroll">
                  {jenisBayar.map((jb) => (
                    <div key={jb.id} className="group relative">
                      <div className="absolute -top-2 left-4 z-10 bg-white px-3">
                        <span className="text-[9px] font-black text-slate-400 group-focus-within:text-emerald-500 uppercase tracking-tighter transition-colors">
                          {jb.nama_pembayaran}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full p-5 pl-12 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] font-black outline-none focus:bg-white focus:border-emerald-500/20 transition-all text-sm shadow-inner appearance-none"
                          placeholder="0"
                          value={inputNominal[jb.id] || ""}
                          onChange={(e) =>
                            setInputNominal({
                              ...inputNominal,
                              [jb.id]: e.target.value,
                            })
                          }
                        />
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">
                          Rp
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State Tagihan */}
                {jenisBayar.length === 0 && (
                  <div className="h-40 border-2 border-dashed border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 font-black uppercase text-[10px]">
                    Tidak ada kategori pembayaran
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER INFO */}
            <div className="p-6 bg-slate-50 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Pastikan nominal yang diinput sudah sesuai dengan bukti bayar
                siswa
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS Tambahan untuk menghilangkan arrow di input number */}
      <style jsx global>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      <ModalDetailPembayaran
        isOpen={!!modalDetail}
        onClose={() => setModalDetail(null)}
        data={modalDetail}
        details={rincianTransaksi}
      />

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
