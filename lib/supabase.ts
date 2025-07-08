import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  })
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// For server-side operations that need elevated permissions
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
) 