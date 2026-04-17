"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const menuAdmin = [
    {
      name: "Jenis Pembayaran",
      href: "/dashboard/admin/pembayaran",
      icon: "⚙️",
    },
    { name: "Manajemen Kelas", href: "/dashboard/admin/kelas", icon: "🏫" }, // Menu baru
    { name: "Manajemen User", href: "/dashboard/admin/users", icon: "👤" },
  ];

  const menuStaff = [
    {
      name: "Input Pembayaran",
      href: "/dashboard/staff/pembayaran",
      icon: "💳",
    },
    { name: "Data Siswa", href: "/dashboard/staff/siswa", icon: "👥" },
  ];

  // Tentukan menu berdasarkan role
  const menus = role === "admin" ? menuAdmin : menuStaff;

  return (
    <nav className="mt-4 px-4 space-y-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
        Menu {role}
      </p>
      {menus.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-all ${
            pathname === item.href
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
          }`}
        >
          <span>{item.icon}</span>
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
