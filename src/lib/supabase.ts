import { createClient } from '@supabase/supabase-js';

// As chaves públicas do Supabase. O Vite expõe variáveis de ambiente com o prefixo VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
