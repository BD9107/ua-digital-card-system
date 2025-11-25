import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING')
    throw new Error('Your project\'s URL and Key are required to create a Supabase client!\n\nCheck your Supabase project\'s API settings to find these values\n\nhttps://supabase.com/dashboard/project/_/settings/api')
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
