'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AlertTriangle, Trash2, RotateCcw, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function PapeleraEquiposPage() {
  const [eliminados, setEliminados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ==========================================
  // ESTADOS: BUSCADOR, FILTROS Y PAGINACIÓN
  // ==========================================
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_POR_PAGINA = 10;

  // Efecto: Debounce para la barra de búsqueda (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Efecto: Si cambia la búsqueda o el filtro, volvemos a la página 1
  useEffect(() => {
    setPaginaActual(1);
  }, [debouncedSearch, tipoFiltro]);

  // Efecto: Cargar datos cuando cambia la búsqueda, filtro o la página
  useEffect(() => {
    cargarEliminados();
  }, [debouncedSearch, tipoFiltro, paginaActual]);

  async function cargarEliminados() {
    setLoading(true);
    
    // Calcular rangos para la paginación de Supabase
    const from = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const to = from + ITEMS_POR_PAGINA - 1;

    let query = supabase
      .from('equipos')
      .select('*, ubicaciones(servicio, area)', { count: 'exact' }) 
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(from, to);

    // 1. Aplicar filtro de Tipo usando ilike para evitar problemas de mayúsculas/minúsculas
    if (tipoFiltro) {
      query = query.ilike('tipo_equipo', tipoFiltro);
    }

    // 2. Aplicar buscador de texto
    if (debouncedSearch) {
      const searchClean = debouncedSearch.trim();
      query = query.or(
        `cod_patrimonio.ilike.%${searchClean}%,cod_patrimonio_verde.ilike.%${searchClean}%,numero_serie.ilike.%${searchClean}%,marca.ilike.%${searchClean}%,modelo.ilike.%${searchClean}%,nombre_red_pc.ilike.%${searchClean}%`
      );
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Error al cargar la papelera:', error);
    } else {
      setEliminados(data || []);
      setTotalItems(count || 0);
    }
    setLoading(false);
  }

  const totalPaginas = Math.ceil(totalItems / ITEMS_POR_PAGINA);

  const calcularDiasRestantes = (fechaEliminadoStr: string) => {
    if (!fechaEliminadoStr) return 0;
    const fechaEliminado = new Date(fechaEliminadoStr);
    const fechaLimite = new Date(fechaEliminado.getTime() + 30 * 24 * 60 * 60 * 1000);
    const hoy = new Date();
    
    const diferenciaTiempo = fechaLimite.getTime() - hoy.getTime();
    const dias = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
    return dias > 0 ? dias : 0;
  };

  const handleRestaurar = async (id: number, patrimonio: string) => {
    const confirmacion = window.confirm(`¿Deseas restaurar el equipo ${patrimonio || 'sin patrimonio'} al inventario activo?`);
    if (!confirmacion) return;

    const { error } = await supabase
      .from('equipos')
      .update({ deleted_at: null })
      .eq('id_equipo', id);

    if (error) {
      alert('Error al restaurar: ' + error.message);
    } else {
      cargarEliminados();
    }
  };

  const handleBorrarDefinitivo = async (id: number, patrimonio: string) => {
    const confirmacion = window.confirm(`⚠️ ADVERTENCIA CRÍTICA: ¿Estás seguro de eliminar PERMANENTEMENTE el equipo ${patrimonio || 'seleccionado'}? Esta acción no se puede deshacer.`);
    if (!confirmacion) return;

    const { error } = await supabase
      .from('equipos')
      .delete()
      .eq('id_equipo', id);

    if (error) {
      alert('Error al eliminar permanentemente: ' + error.message);
    } else {
      cargarEliminados(); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900">
      
      {/* CABECERA */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-red-800 flex items-center gap-2">
            <Trash2 className="w-6 h-6" /> Papelera de Equipos
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Los elementos aquí se eliminarán definitivamente después de 30 días.
          </p>
        </div>
        <Link href="/equipos" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 shadow-sm transition">
          Volver a Inventario
        </Link>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm shadow-sm transition"
            placeholder="Buscar por SBN, serie, hostname, marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="block w-full pl-10 pr-8 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm shadow-sm appearance-none cursor-pointer"
          >
            <option value="">Todos los Tipos</option>
            <option value="CPU">CPU</option>
            <option value="LAPTOP">Laptop</option>
            <option value="NOTEBOOK">Notebook</option>
          </select>
        </div>
      </div>

      {/* LISTA DE ELEMENTOS */}
      {loading ? (
        <div className="text-center py-10 text-gray-500 font-medium animate-pulse">Cargando elementos...</div>
      ) : eliminados.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
          {searchTerm || tipoFiltro ? 'No se encontraron equipos que coincidan con tu búsqueda o filtro.' : 'La papelera está vacía.'}
        </div>
      ) : (
        <div className="space-y-4">
          {eliminados.map((item) => {
            const diasQuedan = calcularDiasRestantes(item.deleted_at);

            return (
              <div key={item.id_equipo} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 hover:shadow-md transition">
                
                {/* CABECERA DE LA TARJETA */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      {item.tipo_equipo || 'Equipo Informático'} 
                      <span className="text-gray-400 font-normal text-sm hidden sm:inline">
                        | {item.marca || 'Sin marca'} {item.modelo ? `- ${item.modelo}` : ''}
                      </span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs font-mono font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                        SBN Azul: {item.cod_patrimonio || 'S/N'}
                      </span>
                      {item.cod_patrimonio_verde && (
                        <span className="text-xs font-mono font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                          Etiqueta Verde: {item.cod_patrimonio_verde}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACCIONES Y BADGES */}
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm ${
                      diasQuedan <= 5 
                        ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {diasQuedan === 0 ? 'Se elimina hoy' : `Quedan ${diasQuedan} días`}
                    </span>

                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                      <button 
                        onClick={() => handleRestaurar(item.id_equipo, item.cod_patrimonio)}
                        className="flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-2 rounded-lg border border-emerald-200 transition shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                      </button>
                      <button 
                        onClick={() => handleBorrarDefinitivo(item.id_equipo, item.cod_patrimonio)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Borrar permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* DETALLES TÉCNICOS ESPECÍFICOS DE EQUIPOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">N° de Serie</p>
                    <p className="font-mono text-gray-700">{item.numero_serie || 'No registrado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Red e Identificación</p>
                    <p className="text-gray-700 font-medium">Host: <span className="font-mono font-normal">{item.nombre_red_pc || 'S/N'}</span></p>
                    <p className="text-gray-500 text-xs mt-0.5">IP: <span className="font-mono">{item.direccion_ip || 'DHCP'}</span></p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Hardware / Ubicación</p>
                    <p className="text-gray-700 truncate" title={`${item.procesador || 'CPU N/A'} | ${item.memoria_ram || 'RAM N/A'} | ${item.almacenamiento || 'Disco N/A'}`}>
                      {item.procesador || 'CPU N/A'} • {item.memoria_ram || 'RAM N/A'} • {item.almacenamiento || 'Disco N/A'}
                    </p>
                    {/* El ESTADO ha sido removido de la línea inferior */}
                    <p className="text-gray-500 text-xs mt-0.5 truncate">
                      Últ. Ubicación: {item.ubicaciones ? `${item.ubicaciones.servicio} (${item.ubicaciones.area})` : 'No registrada'}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* CONTROLES DE PAGINACIÓN */}
      {!loading && totalPaginas > 1 && (
        <div className="mt-8 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          
          <span className="text-sm font-medium text-gray-500">
            Página <span className="text-gray-900">{paginaActual}</span> de <span className="text-gray-900">{totalPaginas}</span>
            <span className="ml-2 hidden sm:inline-block">({totalItems} equipos)</span>
          </span>

          <button
            onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}