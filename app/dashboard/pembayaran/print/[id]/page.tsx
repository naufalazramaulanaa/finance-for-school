"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PrintKwitansi() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null); // State untuk user login
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getInvoiceData() {
      if (!params.id) return;

      // 1. Ambil data User yang sedang login
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // 2. Ambil data utama transaksi & profil siswa
      const { data: trx } = await supabase
        .from("transaksi")
        .select("*, siswa(nama_siswa, no_induk, kelas(nama_kelas))")
        .eq("id", params.id)
        .single();

      // 3. Ambil rincian item pembayaran
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

  if (loading) return <div className="p-10 text-center font-bold">Menyiapkan Kwitansi...</div>;
  if (!data) return <div className="p-10 text-center">Data tidak ditemukan.</div>;

  // Komponen Kwitansi Tunggal sesuai Desain Gambar
  const KwitansiCard = ({ label }: { label: string }) => (
    <div className="w-full border border-black p-6 relative bg-white text-black font-sans" style={{ height: '135mm' }}>
      
      {/* Badge Atas Kanan */}
      <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded text-[10px] font-bold uppercase">
        {label}
      </div>

      {/* Header */}
      <div className="border-b border-black pb-2 mb-4">
        <h1 className="text-xl font-bold tracking-tight">KWITANSI PEMBAYARAN</h1>
        <div className="flex justify-between items-end">
          <p className="text-xs font-semibold">SD NEGERI CONTOH PEKANBARU</p>
          <p className="text-xs font-bold">{data.no_transaksi}</p>
        </div>
      </div>

      {/* Info Siswa */}
      <div className="grid grid-cols-2 text-xs mb-4">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-24">Nama Siswa</span>
            <span className="font-bold">: {data.siswa?.nama_siswa}</span>
          </div>
          <div className="flex">
            <span className="w-24">Tanggal Bayar</span>
            <span>: {new Date(data.created_at).toLocaleDateString("id-ID", { dateStyle: "full" })}</span>
          </div>
        </div>
        <div className="text-right">
          <p>Kelas: <span className="font-bold">{data.siswa?.kelas?.nama_kelas}</span></p>
        </div>
      </div>

      {/* Tabel Rincian sesuai Gambar */}
      <table className="w-full border-collapse border border-black text-xs">
        <thead>
          <tr className="bg-gray-100 uppercase">
            <th className="border border-black px-3 py-2 text-left w-2/3">Item Pembayaran</th>
            <th className="border border-black px-3 py-2 text-right">Nominal</th>
          </tr>
        </thead>
        <tbody>
          {details.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-black px-3 py-2">{item.jenis_pembayaran?.nama_pembayaran}</td>
              <td className="border border-black px-3 py-2 text-right">Rp {item.nominal.toLocaleString("id-ID")}</td>
            </tr>
          ))}
          {/* Baris Kosong untuk Filler jika data sedikit (Opsional) */}
          {[...Array(Math.max(0, 4 - details.length))].map((_, i) => (
            <tr key={`empty-${i}`} className="h-8">
              <td className="border border-black px-3 py-2"></td>
              <td className="border border-black px-3 py-2 text-right"></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-50 text-sm">
            <td className="border border-black px-3 py-2 text-center uppercase tracking-widest">Total Bayar</td>
            <td className="border border-black px-3 py-2 text-right bg-gray-100">
              Rp {data.total_bayar.toLocaleString("id-ID")}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Tanda Tangan */}
      <div className="mt-8 flex justify-between text-xs">
        <div className="text-center w-40">
          <p className="mb-16">Orang Tua / Wali Siswa</p>
          <div className="border-b border-black w-full"></div>
        </div>
        <div className="text-center w-48">
          <p>Pekanbaru, {new Date().toLocaleDateString("id-ID")}</p>
          <p className="font-bold mb-16">Bendahara Sekolah</p>
          <div className="border-b border-black w-full"></div>
          {/* Menampilkan nama user yang login */}
          <p className="mt-1 font-bold italic uppercase">{user?.user_metadata?.full_name || user?.email || 'Administrator'}</p>
        </div>
      </div>
    </div>
  );

  // ... (Bagian import dan logic data fetch tetap sama)

  return (
    <div className="min-h-screen bg-white">
      {/* Container utama print-area */}
      <div className="print-area mx-auto bg-white flex flex-col justify-between">
        
        {/* Bagian Atas */}
        <KwitansiCard label="Untuk Siswa" />

        {/* Garis Potong */}
        <div className="relative h-10 flex items-center justify-center no-print">
          <div className="w-full border-t border-dashed border-gray-400"></div>
          <span className="absolute bg-white px-4 text-[9px] text-gray-400 uppercase tracking-widest">
            Potong di sini
          </span>
        </div>

        {/* Bagian Bawah */}
        <KwitansiCard label="Arsip Sekolah" />
      </div>

      {/* Tambahkan CSS ini untuk memaksa elemen lain hilang saat print */}
      <style jsx global>{`
        /* Sembunyikan Navigasi, Sidebar, dan Header Dashboard saat Print */
        @media print {
          /* Sembunyikan elemen di luar print-area */
          body * {
            visibility: hidden;
          }
          
          /* Tampilkan hanya container print-area */
          .print-area, .print-area * {
            visibility: visible;
          }

          /* Atur posisi print-area agar pas di kertas A4 */
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
          }

          /* Pastikan tidak ada background warna dari sistem dashboard */
          body {
            background: white !important;
          }

          /* Hilangkan link URL dan header/footer bawaan browser */
          @page {
            size: A4;
            margin: 0;
          }
        }

        /* Tampilan di Layar (Preview) */
        .print-area {
          width: 210mm;
          min-height: 297mm;
          padding: 10mm;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
