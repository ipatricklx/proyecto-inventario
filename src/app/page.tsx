import { supabase } from "../lib/supabase";

export default async function Home() {
  // Intentamos traer todos los registros de tu tabla 'equipos'
  const { data: equipos, error } = await supabase.from("equipos").select("*");

  return (
    <main className="p-10 font-sans">
      <h1 className="text-3xl font-bold mb-6">Estado de la Conexión</h1>

      {/* Si hay un error, mostramos una alerta roja */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">¡Error de conexión! </strong>
          <span className="block sm:inline">{error.message}</span>
        </div>
      )}

      {/* Si NO hay error y la variable equipos existe, mostramos una alerta verde */}
      {!error && equipos && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">¡Conectado a Supabase con éxito! </strong>
          <span className="block sm:inline">Tu código se está comunicando con la base de datos.</span>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-2">Datos en la tabla "equipos":</h2>
      
      {/* Mostramos lo que devolvió la base de datos en formato JSON */}
      <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto">
        {JSON.stringify(equipos, null, 2)}
      </pre>
    </main>
  );
}