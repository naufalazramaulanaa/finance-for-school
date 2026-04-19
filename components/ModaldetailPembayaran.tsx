"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabase";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  details: any[];
}

export default function ModalDetailPembayaran({
  isOpen,
  onClose,
  data,
  details,
}: ModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);
    }
    if (isOpen) fetchUser();
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const handlePrintLangsung = () => {
    window.open(`/dashboard/pembayaran/print/${data.id}`, "_blank");
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("pdf-capture-area");
    if (!element) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("pdf-capture-area");
          if (el) {
            el.style.color = "#000000";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Kwitansi-${data.no_transaksi}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Gagal membuat PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const KwitansiPDFBlock = ({ label }: { label: string }) => (
    <div
      style={{
        padding: "12mm 15mm",
        border: "1px solid #000000",
        marginBottom: label === "UNTUK SISWA" ? "8mm" : "0",
        position: "relative",
        height: "128mm", // Tinggi aman agar 2 kwitansi tidak kepotong di A4
        backgroundColor: "#ffffff",
        color: "#000000",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "2px solid #000000",
          paddingBottom: "4mm",
          marginBottom: "5mm",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
            KWITANSI PEMBAYARAN
          </h1>
          <p style={{ fontSize: "11px", margin: 0 }}>
            SD NEGERI CONTOH PEKANBARU
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              fontSize: "9px",
              background: "#000000",
              color: "#ffffff",
              padding: "2px 8px",
              borderRadius: "3px",
              fontWeight: "bold",
            }}
          >
            {label}
          </span>
          <p
            style={{
              margin: "3mm 0 0 0",
              fontSize: "11px",
              fontWeight: "bold",
            }}
          >
            {data.no_transaksi}
          </p>
        </div>
      </div>

      {/* Info Siswa */}
      <div style={{ marginBottom: "5mm", fontSize: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "30mm", padding: "2px 0" }}>Nama Siswa</td>
              <td style={{ padding: "2px 0" }}>
                : <strong>{data.siswa?.nama_siswa}</strong>
              </td>
              <td style={{ textAlign: "right", padding: "2px 0" }}>
                Kelas: <strong>{data.siswa?.kelas?.nama_kelas}</strong>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "2px 0" }}>Tanggal Bayar</td>
              <td style={{ padding: "2px 0" }} colSpan={2}>
                :{" "}
                {new Date(data.created_at).toLocaleDateString("id-ID", {
                  dateStyle: "full",
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tabel Item */}
      <div style={{ flexGrow: 1 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "11px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px",
                  border: "1px solid #000000",
                }}
              >
                ITEM PEMBAYARAN
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "10px",
                  border: "1px solid #000000",
                }}
              >
                NOMINAL
              </th>
            </tr>
          </thead>
          <tbody>
            {details.map((item, idx) => (
              <tr key={idx}>
                <td
                  style={{ padding: "8px 10px", border: "1px solid #000000" }}
                >
                  {item.jenis_pembayaran?.nama_pembayaran}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    textAlign: "right",
                    border: "1px solid #000000",
                  }}
                >
                  Rp {item.nominal?.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr
              style={{
                fontWeight: "bold",
                fontSize: "13px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #000000",
                  textAlign: "center",
                }}
              >
                TOTAL TERBAYAR
              </td>
              <td
                style={{
                  padding: "10px",
                  border: "1px solid #000000",
                  textAlign: "right",
                }}
              >
                Rp {data.total_bayar?.toLocaleString("id-ID")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Tanda Tangan */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10mm",
          fontSize: "11px",
        }}
      >
        <div style={{ textAlign: "center", width: "45mm" }}>
          <p>Wali Murid,</p>
          <div
            style={{ marginTop: "15mm", borderBottom: "1px solid #000000" }}
          ></div>
        </div>
        <div style={{ textAlign: "center", width: "55mm" }}>
          <p>Pekanbaru, {new Date().toLocaleDateString("id-ID")}</p>
          <p style={{ fontWeight: "bold" }}>Bendahara Sekolah,</p>
          <div
            style={{ marginTop: "15mm", borderBottom: "1px solid #000000" }}
          ></div>
          <p
            style={{
              marginTop: "2mm",
              fontWeight: "bold",
              fontStyle: "italic",
              textTransform: "uppercase",
            }}
          >
            {user?.user_metadata?.full_name || user?.email || "Administrator"}
          </p>
        </div>
      </div>

      {label === "UNTUK SISWA" && (
        <div
          style={{
            position: "absolute",
            bottom: "-6mm",
            left: 0,
            width: "100%",
            textAlign: "center",
            color: "#000000",
            fontSize: "8px",
            borderTop: "1px dashed #000000",
            paddingTop: "1mm",
          }}
        >
          GUNTING DI SINI
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 text-center border-b">
          <h3 className="font-bold text-gray-800 uppercase">
            Detail Pembayaran
          </h3>
          <p className="text-xs text-emerald-600 font-bold">
            {data.no_transaksi}
          </p>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border flex items-center gap-4">
            <div className="bg-emerald-500 text-white p-2 rounded-lg">👤</div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">
                Siswa
              </p>
              <p className="font-bold text-gray-800">
                {data.siswa?.nama_siswa} (Kelas {data.siswa?.kelas?.nama_kelas})
              </p>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-white text-[10px] uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {details.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">
                      {item.jenis_pembayaran?.nama_pembayaran}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      Rp {item.nominal?.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-50 font-bold text-emerald-700">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right text-base">
                    Rp {data.total_bayar?.toLocaleString("id-ID")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-3 bg-gray-50">
          <button
            onClick={handlePrintLangsung}
            className="flex flex-col items-center p-3 bg-white border rounded-xl hover:border-emerald-500"
          >
            <span className="text-xl">🖨️</span>
            <span className="text-[10px] font-bold uppercase mt-1">Print</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex flex-col items-center p-3 bg-white border rounded-xl hover:border-blue-500 disabled:opacity-50"
          >
            <span className="text-xl">📥</span>
            <span className="text-[10px] font-bold uppercase mt-1">
              {isGenerating ? "Proses..." : "Simpan PDF"}
            </span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 text-[10px] font-bold text-gray-400 border-t hover:text-red-500 uppercase"
        >
          Kembali
        </button>
      </div>

      <div
        id="pdf-capture-area"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "210mm",
          backgroundColor: "#ffffff",
          padding: "5mm",
          boxSizing: "border-box",
        }}
      >
        <KwitansiPDFBlock label="UNTUK SISWA" />
        <KwitansiPDFBlock label="ARSIP SEKOLAH" />
      </div>
    </div>
  );
}
