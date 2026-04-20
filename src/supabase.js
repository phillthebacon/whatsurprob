import { createClient } from '@supabase/supabase-js'

// ⚠️ PASTE YOUR VALUES HERE (Step 2 in README)
const SUPABASE_URL = 'https://vmmfutpbzdpmdflwcxbq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbWZ1dHBiemRwbWRmbHdjeGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE2MzksImV4cCI6MjA5MDc1NzYzOX0.a2cbZJO1tr1pxmwbNTqBYrWL9D79962PCECZGa1OfQk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
