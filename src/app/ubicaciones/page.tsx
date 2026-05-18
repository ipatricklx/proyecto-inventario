'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false); // 👈 Nuevo estado para la papelera

  useEffect(() => {
    getUbicaciones();
  }, []);

  async function getUbicaciones() {
    setLoading(true);
    const { data, error } = await supabase
      .from('ubicaciones')
      .select('*')
      .order('departamento', { ascending: true })
      .order('servicio', { ascending: true });
      
    if (error) {
      console.error('Error al cargar ubicaciones:', error);
    } else if (data) {
      setUbicaciones(data);
    }
    setLoading(false);
  }

  // 👈 NUEVA FUNCIÓN: Baja lógica en lugar de borrado físico
  const handleDesactivar = async (id: number, nombre: string) => {
    const confirmacion = window.confirm(`¿Estás seguro de desactivar el área de ${nombre}? Ya no se podrán asignar nuevos equipos aquí.`);
    if (!confirmacion) return;

    const { error } = await supabase
      .from('ubicaciones')
      .update({ estado: 'INACTIVO' })
      .eq('id_ubicacion', id);
    
    if (error) {
      alert('Error al desactivar: ' + error.message);
      return;
    }
    
    // Actualizamos el estado local sin recargar la página
    setUbicaciones(ubicaciones.map(u => u.id_ubicacion === id ? { ...u, estado: 'INACTIVO' } : u));
  };

  // 👈 NUEVA FUNCIÓN: Restaurar área
  const handleRestaurar = async (id: number, nombre: string) => {
    const confirmacion = window.confirm(`¿Deseas restaurar el área de ${nombre}? Volverá a estar disponible.`);
    if (!confirmacion) return;

    const { error } = await supabase
      .from('ubicaciones')
      .update({ estado: 'ACTIVO' })
      .eq('id_ubicacion', id);
    
    if (error) {
      alert('Error al restaurar: ' + error.message);
      return;
    }
    
    setUbicaciones(ubicaciones.map(u => u.id_ubicacion === id ? { ...u, estado: 'ACTIVO' } : u));
  };

  // Filtrado de la tabla (por texto Y por estado)
  const filtradas = ubicaciones.filter(u => {
    const term = searchTerm.toLowerCase();
    const coincideTexto = (
      u.departamento?.toLowerCase().includes(term) ||
      u.servicio?.toLowerCase().includes(term) ||
      u.area?.toLowerCase().includes(term)
    );
    // Verificamos si es activo o inactivo según el toggle
    const estadoActual = u.estado || 'ACTIVO';
    const coincideEstado = mostrarInactivos ? estadoActual === 'INACTIVO' : estadoActual === 'ACTIVO';

    return coincideTexto && coincideEstado;
  });

  return (
    <div className="animate-fadeIn text-gray-900 p-4 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Estructura Orgánica</h2>
          <p className="text-gray-500 text-sm">Directorio de departamentos, servicios y áreas del hospital.</p>
        </div>
        <Link href="/ubicaciones/nuevo" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md font-bold text-sm flex items-center gap-2">
          <span>➕</span> Agregar Área
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-2/3">
          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar por Departamento, Servicio o Área</label>
          <input 
            type="text" 
            placeholder="Ej: Cirugía, Emergencia, Urología..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* 👈 TOGGLE DE PAPELERA */}
        <div className="w-full sm:w-auto flex items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={mostrarInactivos} onChange={() => setMostrarInactivos(!mostrarInactivos)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${mostrarInactivos ? 'bg-red-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${mostrarInactivos ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className={`ml-3 text-sm font-bold ${mostrarInactivos ? 'text-red-600' : 'text-gray-500'}`}>
              {mostrarInactivos ? '🗑️ Viendo Inactivos' : 'Ver Inactivos'}
            </span>
          </label>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={mostrarInactivos ? "bg-red-50" : "bg-blue-50"}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Red / Centro</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Departamento</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Servicio</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Área Específica</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Cargando estructura...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No se encontraron áreas.</td></tr>
            ) : (
              filtradas.map((ubi) => (
                <tr key={ubi.id_ubicacion} className={`hover:bg-gray-50 ${mostrarInactivos ? 'opacity-70' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    <p className="font-bold">{ubi.red_asistencial}</p>
                    <p>{ubi.centro_asistencial}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">{ubi.departamento}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-800">{ubi.servicio}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-bold">{ubi.area || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center space-x-2">
                    
                    {!mostrarInactivos ? (
                      <>
                        <Link href={`/ubicaciones/editar/${ubi.id_ubicacion}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100" title="Editar Área">
                          ⚙️
                        </Link>
                        <button onClick={() => handleDesactivar(ubi.id_ubicacion, ubi.area || ubi.servicio)} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100" title="Desactivar (Mandar a papelera)">
                          🗑️
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleRestaurar(ubi.id_ubicacion, ubi.area || ubi.servicio)} className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold" title="Restaurar Área">
                        ♻️ Restaurar
                      </button>
                    )}

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