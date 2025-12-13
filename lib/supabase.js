import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = 'https://urntwznaqnaxofylqnfa.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybnR3em5hcW5heG9meWxxbmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjI0MTYsImV4cCI6MjA3OTM5ODQxNn0.Vac4_xiOTa6dTdEv_MoRp1nE_LpvuDdw072Isdnzfz8'
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'implicit',
      detectSessionInUrl: true,
      autoRefreshToken: true,
      persistSession: true
    }
  })
}
