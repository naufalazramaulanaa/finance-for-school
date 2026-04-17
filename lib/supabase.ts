import { createBrowserClient } from '@supabase/ssr'

// Eksekusi fungsi tersebut dan simpan ke variabel 'supabase'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)