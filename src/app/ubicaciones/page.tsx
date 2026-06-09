'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import useSWR from 'swr';

// 🌟 1. INTERFACES PARA TIPADO ESTRICTO
interface Ubicacion {
  id_ubicacion: number;
  red_asistencial: string;
  centro_asistencial: string;
  departamento: string;
  servicio: string;
  area: string | null;
  estado: 'ACTIVO' | 'INACTIVO' | null;
}

interface UbicacionesResponse {
  data: Ubicacion[];
  count: number;
}

const ITEMS_POR_PAGINA = 10;

// 🌟 2. HOOK DE DEBOUNCE (Se mantiene igual)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// 🌟 3. FETCHER DE SWR (Recibe el array de dependencias como argumentos)
const fetchUbicaciones = async ([_key, search, inactivos, page]: [string, string, boolean, number]): Promise<UbicacionesResponse> => {
  let query = supabase
    .from('ubicaciones')
    .select('*', { count: 'exact' });
    
  if (search) {
    query = query.or(`departamento.ilike.%${search}%,servicio.ilike.%${search}%,area.ilike.%${search}%`);
  }

  if (inactivos) {
    query = query.eq('estado', 'INACTIVO');
  } else {
    query = query.or('estado.eq.ACTIVO,estado.is.null');
  }

  const from = (page - 1) * ITEMS_POR_PAGINA;
  const to = from + ITEMS_POR_PAGINA - 1;
  
  query = query
    .range(from, to)
    .order('departamento', { ascending: true })
    .order('servicio', { ascending: true });

  const { data, error, count } = await query;
    
  if (error) throw new Error(error.message);
  
  return { 
    data: (data as Ubicacion[]) || [], 
    count: count || 0 
  };
};

export default function UbicacionesPage() {
  // Estados para los filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Resetear a página 1 si cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [debouncedSearch, mostrarInactivos]);

  // 🌟 4. USO DE SWR CON ARRAY KEY Y KEEP_PREVIOUS_DATA
  const { data: response, error, isLoading, mutate } = useSWR<UbicacionesResponse>(
    ['ubicaciones', debouncedSearch, mostrarInactivos, paginaActual], // Array como llave
    fetchUbicaciones,
    {
      keepPreviousData: true, // Mantiene la data actual en pantalla mientras hace fetch de la nueva página
      revalidateOnFocus: false, // Opcional: evita refrescar si el usuario cambia de pestaña rápido para no perder su posición
    }
  );

  const ubicaciones = response?.data || [];
  const totalUbicaciones = response?.count || 0;
  const totalPaginas = Math.ceil(totalUbicaciones / ITEMS_POR_PAGINA);

  // 🌟 5. ACCIONES (Usan mutate() en lugar de getUbicaciones())
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
    
    mutate(); // Recargar la data de la página actual
  };

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
    
    mutate(); // Recargar la data de la página actual
  };

  if (error) {
    return <div className="p-4 text-red-500 text-center font-bold">Error al cargar la estructura: {error.message}</div>;
  }

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
        
        {/* PAPELERA */}
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

      <div className="bg-white shadow-sm rounded-t-xl overflow-x-auto border border-gray-200 relative">
        {/* Indicador visual suave de recarga durante el keepPreviousData */}
        {isLoading && <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse z-10"></div>}

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
            {isLoading && ubicaciones.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400 animate-pulse">Cargando estructura...</td></tr>
            ) : ubicaciones.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No se encontraron áreas.</td></tr>
            ) : (
              ubicaciones.map((ubi) => (
                <tr key={ubi.id_ubicacion} className={`hover:bg-gray-50 transition-opacity ${mostrarInactivos ? 'opacity-70' : ''} ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
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

      {/* CONTROLES DE PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div className="bg-white px-4 py-3 border border-t-0 border-gray-200 rounded-b-xl flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando página <span className="font-medium">{paginaActual}</span> de <span className="font-medium">{totalPaginas}</span> 
                {' '} ({totalUbicaciones} resultados)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1 || isLoading}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas || isLoading}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}