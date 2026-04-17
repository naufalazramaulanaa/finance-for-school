export function Header({ name, role }: { name: string; role: string }) {
  return (
    <header className="bg-white border-b border-slate-100 p-4 flex justify-between items-center shadow-sm">
      <div className="md:hidden font-bold text-emerald-700">E-AlFath</div>
      <div className="hidden md:block text-slate-400 text-sm">
        Sistem Pembayaran v1.0
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900 leading-none">
            {name}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">
            {role}
          </p>
        </div>
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-700">
          {name.charAt(0)}
        </div>
      </div>
    </header>
  );
}
