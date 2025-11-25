import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fallback to hardcoded values if env vars not available (development only)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urntwznaqnaxofylqnfa.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybnR3em5hcW5heG9meWxxbmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjI0MTYsImV4cCI6MjA3OTM5ODQxNn0.Vac4_xiOTa6dTdEv_MoRp1nE_LpvuDdw072Isdnzfz8'
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    throw new Error('Your project\'s URL and Key are required to create a Supabase client!')
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
