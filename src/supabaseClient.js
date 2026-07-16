import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://acvdwrkqmyumlmgpfvcu.supabase.co'
const supabaseAnonKey = 'sb_publishable_tfN6Pn4A5atFSU8Jlutrpg_EadK5UOX'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
