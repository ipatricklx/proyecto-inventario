'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [equipos, setEquipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getEquipos();
  }, []);

  async function getEquipos() {
    const { data } = await supabase.from('equipos').select('*');
    if (data) setEquipos(data);
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* BARRA SUPERIOR */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">🏥 Inventario Hospital</h1>
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Panel de Equipos</h2>
            <p className="text-gray-500">Listado general de activos tecnológicos</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-shadow shadow-sm font-medium">
            + Nuevo Equipo
          </button>
        </div>

        {/* TABLA */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cod. Patrimonio</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Serie</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Cargando equipos...</td></tr>
              ) : equipos.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No hay equipos registrados.</td></tr>
              ) : (
                equipos.map((equipo) => (
                  <tr key={equipo.id_equipo} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{equipo.cod_patrimonio}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{equipo.tipo_equipo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{equipo.marca} - {equipo.modelo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{equipo.numero_serie}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${equipo.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {equipo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}