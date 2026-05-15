import { createClient } from '@supabase/supabase-js';

// Usamos el signo "!" al final para decirle a TypeScript que estamos 
// seguros de que estas variables existen en nuestro archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Creamos y exportamos el cliente para usarlo en toda la aplicación
export const supabase = createClient(supabaseUrl, supabaseAnonKey);