import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'project_one/-/tree/development'
const supabaseAnonKey = 'sb_publishable_bJKUqc2pAMpB3HTF32xbuQ_oOuNuy8V'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)