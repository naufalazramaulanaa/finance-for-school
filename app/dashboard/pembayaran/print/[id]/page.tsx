"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PrintKwitansi() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getInvoiceData() {
      if (!params.id) return;

      // 1. Ambil data utama transaksi & profil siswa
      const { data: trx } = await supabase
        .from("transaksi")
        .select("*, siswa(nama_siswa, no_induk, kelas(nama_kelas))")
        .eq("id", params.id)
        .single();

      // 2. Ambil rincian item pembayaran (PENTING: Pastikan join ke jenis_pembayaran)
      const { data: dtl } = await supabase
        .from("transaksi_detail")
        .select("*, jenis_pembayaran(nama_pembayaran)")
        .eq("transaksi_id", params.id);

      setData(trx);
      setDetails(dtl || []);
      setLoading(false);

      // Trigger cetak otomatis
      setTimeout(() => {
        window.print();
      }, 1000);
    }
    getInvoiceData();
  }, [params.id]);

  if (loading)
    return (
      <div className="p-10 text-center font-bold">Menyiapkan Kwitansi...</div>
    );
  if (!data)
    return <div className="p-10 text-center">Data tidak ditemukan.</div>;

  // Komponen Kwitansi Tunggal
  const KwitansiCard = ({ label }: { label: string }) => (
    <div className="w-full border-2 border-dashed border-slate-400 p-8 relative min-h-[48%] flex flex-col justify-between overflow-hidden bg-white">
      {/* Label Pembeda */}
      <div className="absolute top-4 right-4 bg-slate-100 px-3 py-1 rounded border border-slate-300 text-[10px] font-black uppercase text-slate-600 tracking-widest">
        {label}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-black text-black">
            KWITANSI PEMBAYARAN
          </h1>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-tighter">
            SD NEGERI CONTOH PEKANBARU
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-black uppercase">
            NO: {data.no_transaksi}
          </p>
          <p className="text-xs font-bold text-slate-500 uppercase">
            {new Date(data.created_at).toLocaleDateString("id-ID", {
              dateStyle: "full",
            })}
          </p>
        </div>
      </div>

      {/* Info Siswa */}
      <div className="grid grid-cols-2 gap-4 my-6 py-4 bg-slate-50 px-4 rounded-lg border border-slate-200">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Nama Siswa
          </p>
          <p className="text-lg font-black text-black uppercase">
            {data.siswa?.nama_siswa}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Kelas / No. Induk
          </p>
          <p className="text-md font-bold text-black">
            {data.siswa?.kelas?.nama_kelas} / {data.siswa?.no_induk}
          </p>
        </div>
      </div>

      {/* Tabel Rincian Pembayaran */}
      <div className="flex-grow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-300">
              <th className="py-2 text-[10px] font-black text-black uppercase tracking-wider">
                Item Pembayaran
              </th>
              <th className="py-2 text-[10px] font-black text-black uppercase tracking-wider text-right">
                Nominal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {details.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 text-sm font-bold text-slate-800 uppercase italic">
                  - {item.jenis_pembayaran?.nama_pembayaran}
                </td>
                <td className="py-3 text-sm font-black text-black text-right">
                  Rp {item.nominal.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black bg-slate-50">
              <td className="py-3 px-2 text-sm font-black text-black uppercase">
                Total Terbayar
              </td>
              <td className="py-3 px-2 text-xl font-black text-emerald-600 text-right">
                Rp {data.total_bayar.toLocaleString("id-ID")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-between items-end">
        <div className="italic text-[9px] text-slate-400 w-1/2 leading-tight">
          * Kwitansi ini adalah bukti pembayaran yang sah. <br />* Dicetak
          secara sistem pada {new Date().toLocaleString("id-ID")}. <br />* Harap
          disimpan baik-baik.
        </div>
        <div className="text-center w-48">
          <p className="text-[10px] font-bold text-black mb-12 uppercase">
            Petugas Keuangan,
          </p>
          <div className="border-b-2 border-black w-full mb-1"></div>
          <p className="text-[10px] font-black uppercase text-black italic">
            Staff Administrasi
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="print-area mx-auto bg-white flex flex-col justify-between overflow-hidden">
        {/* Bagian Atas: Untuk Wali Murid */}
        <div className="receipt-section">
          <KwitansiCard label="Arsip Wali Murid" />
        </div>

        {/* Garis Potong Tengah */}
        <div className="cut-line flex justify-center items-center relative h-12 print:h-8">
          <div className="w-full border-t-2 border-dashed border-slate-300"></div>
          <span className="absolute bg-white px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] print:text-black">
            Gunting Di Sini
          </span>
        </div>

        {/* Bagian Bawah: Untuk Staff */}
        <div className="receipt-section">
          <KwitansiCard label="Arsip Staff Sekolah" />
        </div>
      </div>

      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            padding: 12mm !important;
            margin: 0 !important;
          }

          .receipt-section {
            height: 48%;
            display: flex;
            flex-direction: column;
          }

          /* Hilangkan elemen browser mengganggu */
          header,
          footer,
          nav {
            display: none !important;
          }
        }

        /* Preview Mode */
        .print-area {
          width: 210mm;
          height: 297mm;
          padding: 15mm;
          border: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
}
