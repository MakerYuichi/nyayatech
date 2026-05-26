import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — only instantiated on first use, not at build time.
// This prevents "supabaseUrl is required" errors during Next.js static build.
let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars not set')
    _client = createClient(url, key)
  }
  return _client
}

// Convenience proxy — works exactly like the old `supabase` export
// but defers createClient until the first property access (runtime only).
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  },
})
