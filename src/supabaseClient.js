import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iuhjkndvwaomqvvjsogh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aGprbmR2d2FvbXF2dmpzb2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDA4MjYsImV4cCI6MjA4MzMxNjgyNn0.Hx9EZgxsB1cDlQD_-dEBVVZ4w4K9FdRrWpOcEv7hvH4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)