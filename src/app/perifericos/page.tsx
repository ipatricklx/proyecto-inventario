'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import useSWR from 'swr';
// 🌟 Importamos los mismos utilitarios universales de Excel
import { exportToExcel, downloadExcelTemplate } from '@/utils/excelExport';
import { importFromExcel } from '@/utils/excelImport';

// 🌟 1. INTERFACES PARA TYPESCRIPT
interface EquipoVinculado {
  nombre_red_pc: string | null;
}

interface Periferico {
  id_periferico: number;
  cod_patrimonio_verde: string | null;
  cod_patrimonio_azul: string | null;
  tipo_periferico: string;
  marca: string;
  modelo: string | null;
  n_serie: string | null;
  numero_serie?: string | null;
  detalle_tecnico: string | null;
  estado_fisico: string;
  estado?: string;
  id_equipo?: number | null; // 🌟 ID de enlace con equipos
  equipos: EquipoVinculado | null;
}

// 🌟 2. HOOK DE DEBOUNCE
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// 🌟 3. EL FETCHER DE SUPABASE PARA SWR
const fetchPerifericos = async ([key, search, tipo, estado, paginaActual]: [string, string, string, string, number]) => {
  const ITEMS_POR_PAGINA = 10;
  
  let query = supabase
    .from('perifericos')
    .select('*, equipos(nombre_red_pc)', { count: 'exact' })
    .is('deleted_at', null);
    
  if (search) {
    query = query.or(
      `cod_patrimonio_azul.ilike.%${search}%,cod_patrimonio_verde.ilike.%${search}%,marca.ilike.%${search}%,modelo.ilike.%${search}%,n_serie.ilike.%${search}%`
    );
  }

  if (tipo) query = query.eq('tipo_periferico', tipo);
  if (estado) query = query.eq('estado_fisico', estado);

  const from = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const to = from + ITEMS_POR_PAGINA - 1;
  
  query = query.range(from, to).order('tipo_periferico', { ascending: true });

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  
  return { perifericos: data as Periferico[], total: count || 0 };
};

export default function PerifericosPage() {
  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  // Estados para Excel
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resetear a página 1 si cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [debouncedSearch, filtroTipo, filtroEstado]);

  // 🌟 4. LA MAGIA DE SWR
  const { data, error, isLoading, mutate } = useSWR(
    ['perifericos', debouncedSearch, filtroTipo, filtroEstado, paginaActual],
    fetchPerifericos,
    { keepPreviousData: true }
  );

  const perifericos = data?.perifericos || [];
  const totalPerifericos = data?.total || 0;
  const totalPaginas = Math.ceil(totalPerifericos / ITEMS_POR_PAGINA);

  // 🌟 5. ACCIONES EXCEL PARA PERIFÉRICOS
  const handleDescargarPlantilla = async () => {
    try {
      const columnasPlantilla = [
        'cod_patrimonio_verde', 'cod_patrimonio_azul', 'tipo_periferico', 
        'marca', 'modelo', 'n_serie', 'detalle_tecnico', 'estado_fisico', 'id_equipo'
      ];
      
      const filaEjemplo = [
        'V-9921', 'A-0442', 'Monitor', 'HP', 'ProDisplay P223', 'CN441022XX', 'Pantilla LED 21.5 pulgadas', 'OPERATIVO', ''
      ];

      await downloadExcelTemplate(columnasPlantilla, 'Plantilla_Carga_Perifericos', filaEjemplo);
    } catch (err) {
      alert('Error al generar la plantilla');
    }
  };

  const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      
      // Columnas mínimas requeridas para periféricos
      const columnasEsperadas = ['tipo_periferico', 'marca', 'estado_fisico'];
      const datosCrudos = await importFromExcel(file, columnasEsperadas);

      const datosParaSupabase = datosCrudos.map((fila) => ({
        cod_patrimonio_verde: fila['cod_patrimonio_verde'] || null,
        cod_patrimonio_azul: fila['cod_patrimonio_azul'] || null,
        tipo_periferico: fila['tipo_periferico'],
        marca: fila['marca'],
        modelo: fila['modelo'] || null,
        n_serie: fila['n_serie'] || null,
        detalle_tecnico: fila['detalle_tecnico'] || null,
        estado_fisico: fila['estado_fisico'] || 'OPERATIVO',
        id_equipo: fila['id_equipo'] ? parseInt(fila['id_equipo']) : null
      }));

      const { error } = await supabase.from('perifericos').insert(datosParaSupabase);
      if (error) throw error;

      alert(`✅ ¡Se importaron ${datosParaSupabase.length} periféricos con éxito!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      mutate();

    } catch (err: any) {
      alert('Error al importar periféricos: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExportarExcel = async () => {
    try {
      setExporting(true);
      
      let query = supabase.from('perifericos').select('*, equipos(nombre_red_pc)').is('deleted_at', null);
      
      if (debouncedSearch) {
        query = query.or(`cod_patrimonio_azul.ilike.%${debouncedSearch}%,cod_patrimonio_verde.ilike.%${debouncedSearch}%,marca.ilike.%${debouncedSearch}%,modelo.ilike.%${debouncedSearch}%,n_serie.ilike.%${debouncedSearch}%`);
      }
      if (filtroTipo) query = query.eq('tipo_periferico', filtroTipo);
      if (filtroEstado) query = query.eq('estado_fisico', filtroEstado);

      const { data, error: fetchError } = await query.order('tipo_periferico', { ascending: true });
      if (fetchError) throw fetchError;

      // Estructuramos la información agregando el tipado exacto (eq: any) para evitar errores de compilación
      const dataMapeada = (data || []).map((eq: any) => ({
        ...eq,
        serie_final: eq.n_serie || eq.numero_serie || '-',
        estado_final: eq.estado_fisico || eq.estado || 'OPERATIVO',
        pc_vinculada: eq.equipos?.nombre_red_pc ? eq.equipos.nombre_red_pc : 'En Almacén'
      }));

      const columnasReporte = [
        { header: 'Patrimonio Verde', key: 'cod_patrimonio_verde', width: 18 },
        { header: 'Patrimonio Azul', key: 'cod_patrimonio_azul', width: 18 },
        { header: 'Tipo Periférico', key: 'tipo_periferico', width: 18 },
        { header: 'Marca', key: 'marca', width: 15 },
        { header: 'Modelo', key: 'modelo', width: 15 },
        { header: 'Número de Serie', key: 'serie_final', width: 20 },
        { header: 'Detalle Técnico', key: 'detalle_tecnico', width: 30 },
        { header: 'Estado Físico', key: 'estado_final', width: 15 },
        { header: 'Asignación PC', key: 'pc_vinculada', width: 20 },
      ];

      await exportToExcel('Reporte e Inventario de Periféricos', columnasReporte, dataMapeada, 'Reporte_Perifericos');

    } catch (err: any) {
      alert('Error al exportar Excel: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // 🌟 6. MUTATE PARA ELIMINAR SIN RECARGAR
  const handleEliminar = async (id: number, tipo: string, marca: string) => {
    const confirmacion = window.confirm(`¿Estás seguro de enviar a la papelera el periférico: ${tipo} ${marca}?`);
    if (!confirmacion) return;

    const { error } = await supabase
      .from('perifericos')
      .update({ deleted_at: new Date().toISOString() }) 
      .eq('id_periferico', id);
      
    if (error) { 
      alert('Error: ' + error.message); 
      return; 
    }
    
    mutate();
  };

  const getBadgeEstado = (estado: string) => {
    const est = (estado || '').toUpperCase();
    switch(est) {
      case 'OPERATIVO': return 'bg-green-100 text-green-800 border-green-200';
      case 'GARANTIA': 
      case 'EN GARANTÍA': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OBSOLETO': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'BAJA': 
      case 'DE BAJA': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (error) return <div className="text-red-500 p-4 text-center">Error al cargar datos: {error.message}</div>;

  return (
    <div className="animate-fadeIn text-gray-900 p-4 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Control de Periféricos</h2>
          <p className="text-gray-500 text-sm">Monitores, Impresoras, UPS y componentes informáticos.</p>
        </div>
        
        {/* BOTONES INTERACTIVOS DE EXCEL */}
        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="hidden" onChange={handleImportarExcel} />

          <button onClick={handleDescargarPlantilla} className="bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-all shadow-sm font-bold text-sm flex items-center gap-2">
            <span>📋</span> Plantilla
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-all shadow-md font-bold text-sm flex items-center gap-2 disabled:opacity-50">
            <span>📤</span> {importing ? '...' : 'Importar'}
          </button>

          <button onClick={handleExportarExcel} disabled={exporting} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-all shadow-md font-bold text-sm flex items-center gap-2 disabled:opacity-50">
            <span>📥</span> {exporting ? '...' : 'Exportar'}
          </button>

          <Link href="/perifericos/papelera" className="bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-lg hover:bg-red-100 transition-all font-bold text-sm flex items-center gap-2">
            <span>🗑️</span> Papelera
          </Link>
          <Link href="/perifericos/nuevo" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md font-bold text-sm flex items-center gap-2">
            <span>➕</span> Registrar Periférico
          </Link>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4 items-end justify-between">
        <div className="w-full lg:w-2/5">
          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar por código, serie o marca</label>
          <input 
            type="text" 
            placeholder="Ej: DELL, V203P, ESS206..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="w-full sm:w-1/2 lg:w-1/4">
          <label className="block text-xs font-bold text-gray-500 mb-1">Filtrar por Tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="Monitor">Monitor</option>
            <option value="Impresora">Impresora</option>
            <option value="Teclado">Teclado</option>
            <option value="Mouse">Mouse</option>
            <option value="Estabilizador">Estabilizador</option>
            <option value="Lector de Código">Lector de Código</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="w-full sm:w-1/2 lg:w-1/4">
          <label className="block text-xs font-bold text-gray-500 mb-1">Filtrar por Estado Técnico</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="OPERATIVO">OPERATIVO</option>
            <option value="GARANTIA">EN GARANTÍA</option>
            <option value="OBSOLETO">OBSOLETO</option>
            <option value="BAJA">DE BAJA</option>
          </select>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white shadow-sm rounded-t-xl overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Patrimonio (V/A)</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Equipo</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Marca y Modelo</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">N° Serie / Detalles</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-600">Estado Técnico</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">PC Vinculada</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400 animate-pulse">Cargando periféricos (Caché inteligente)...</td></tr>
            ) : perifericos.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No se encontraron registros.</td></tr>
            ) : (
              perifericos.map((item: Periferico) => (
                <tr key={item.id_periferico} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-mono">
                    <p className="font-bold text-green-700">🟢 {item.cod_patrimonio_verde || 'S/P'}</p>
                    <p className="text-blue-700">🔵 {item.cod_patrimonio_azul || 'S/P'}</p>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                    <span className="bg-slate-100 text-slate-800 text-xs font-black px-2 py-1 rounded">
                      {item.tipo_periferico}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="font-bold text-gray-800">{item.marca}</span>
                    <p className="text-gray-500 text-xs">{item.modelo || '-'}</p>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <p className="font-mono text-gray-700 font-bold">SN: {item.n_serie || item.numero_serie || '-'}</p>
                    <p className="text-purple-700 italic">{item.detalle_tecnico || '-'}</p>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeEstado(item.estado_fisico || item.estado || '')}`}>
                      {item.estado_fisico || item.estado || 'OPERATIVO'}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    {item.equipos?.nombre_red_pc ? (
                      <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        💻 {item.equipos.nombre_red_pc}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        📦 En Almacén
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-center space-x-2">
                    <Link href={`/perifericos/editar/${item.id_periferico}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100" title="Editar">⚙️</Link>
                    <Link href={`/perifericos/detalles?id=${item.id_periferico}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100" title="Detalles">👁️</Link>
                    <button onClick={() => handleEliminar(item.id_periferico, item.tipo_periferico, item.marca)} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      {!isLoading && totalPaginas > 1 && (
        <div className="bg-white px-4 py-3 border border-t-0 border-gray-200 rounded-b-xl flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando página <span className="font-medium">{paginaActual}</span> de <span className="font-medium">{totalPaginas}</span> 
                {' '} ({totalPerifericos} resultados)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
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