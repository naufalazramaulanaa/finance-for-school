import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Sidebar from "@/components/sidebar";
import { Header } from "@/components/header";
import LogoutButton from "@/components/LogoutButton"; // Buat tombol logout terpisah

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-black text-emerald-700 tracking-tighter italic">
            AL-FATH
          </h1>
        </div>

        <Sidebar role={profile?.role || "staff"} />

        <div className="mt-auto p-4 border-t border-slate-50">
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        <Header
          name={profile?.full_name || "User"}
          role={profile?.role || "staff"}
        />
        <main className="p-4 md:p-8 lg:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
