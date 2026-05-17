'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PapeleraPage() {
  const [equiposBaja, setEquiposBaja] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getEquiposBaja();
  }, []);

  async function getEquiposBaja() {
    setLoading(true);
    // Traemos SOLO los equipos inactivos (borrados lógicamente)
    const { data, error } = await supabase
      .from('equipos')
      .select(`
        *,
        ubicaciones (servicio, area)
      `)
      .eq('activo', false)
      .order('updated_at', { ascending: false }); // Ordenados por el más reciente dado de baja
      
    if (error) {
      console.error('Error al cargar la papelera:', error);
    } else if (data) {
      setEquiposBaja(data);
    }
    setLoading(false);
  }

  // 🔄 FUNCIÓN PARA RESTAURAR EL EQUIPO
  const handleRestore = async (id_equipo: number, cod_patrimonio: string) => {
    const confirmacion = window.confirm(`¿Deseas restaurar y reactivar el equipo patrimonial ${cod_patrimonio}? Volverá al panel principal.`);
    if (!confirmacion) return;

    // Hacemos el contraborrado lógico: activo pasa a true y lo devolvemos a OPERATIVO
    const { error } = await supabase
      .from('equipos')
      .update({ 
        activo: true, 
        estado: 'OPERATIVO' // Al restaurar, vuelve a estar operativo por defecto
      })
      .eq('id_equipo', id_equipo);

    if (error) {
      alert('Error al restaurar el equipo: ' + error.message);
      return;
    }

    alert(`¡Equipo ${cod_patrimonio} restaurado con éxito!`);
    
    // Filtramos el estado local para quitarlo de la papelera inmediatamente
    setEquiposBaja(equiposBaja.filter(eq => eq.id_equipo !== id_equipo));
  };

  // Filtrado por barra de búsqueda
  const equiposFiltrados = equiposBaja.filter((equipo) => {
    return (
      equipo.cod_patrimonio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipo.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipo.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="animate-fadeIn text-gray-900 p-4 max-w-7xl mx-auto">
      
      {/* CABECERA */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🗑️</span> Papelera / Equipos de Baja
          </h2>
          <p className="text-gray-500 text-sm">Historial de activos retirados del inventario principal. Puedes restaurarlos en cualquier momento.</p>
        </div>
        <Link href="/equipos" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all shadow-md font-medium text-sm">
          ⬅️ Volver al Panel
        </Link>
      </div>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <label className="block text-xs font-bold text-gray-500 mb-1">Filtrar en papelera</label>
        <input 
          type="text" 
          placeholder="Buscar por Patrimonio, Marca o Modelo..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white shadow-sm"
        />
      </div>

      {/* TABLA DE ELIMINADOS */}
      <div className="bg-white shadow-sm rounded-xl overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Patrimonio</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Equipo</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Marca/Modelo</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Última Ubicación</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Consultando archivos de baja...</td></tr>
            ) : equiposFiltrados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400 italic">La papelera está vacía. No hay equipos dados de baja.</td></tr>
            ) : (
              equiposFiltrados.map((equipo) => (
                <tr key={equipo.id_equipo} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-red-700">{equipo.cod_patrimonio}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{equipo.tipo_equipo}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{equipo.marca} <span className="text-gray-400 ml-1">{equipo.modelo}</span></td>
                  
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {equipo.ubicaciones ? (
                      <span>{equipo.ubicaciones.servicio} <span className="text-gray-400 text-xs">({equipo.ubicaciones.area})</span></span>
                    ) : (
                      <span className="text-gray-400 italic">No asignada</span>
                    )}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                      {equipo.estado}
                    </span>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button 
                      onClick={() => handleRestore(equipo.id_equipo, equipo.cod_patrimonio)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm text-xs font-bold"
                      title="Restaurar Equipo"
                    >
                      🔄 Restaurar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}