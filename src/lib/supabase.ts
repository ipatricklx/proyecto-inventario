import { createBrowserClient } from '@supabase/ssr'

// Creamos una variable fuera de la función para guardar la instancia
let client: ReturnType<typeof createBrowserClient> | undefined;

export const supabase = (() => {
  // Si ya existe el cliente en el navegador, no creamos otro, devolvemos el mismo
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
})();