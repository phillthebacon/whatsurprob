import { createClient } from '@supabase/supabase-js'

// ⚠️ PASTE YOUR VALUES HERE (Step 2 in README)
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
