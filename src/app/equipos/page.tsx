'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import useSWR from 'swr';
// 🌟 Importamos los utilitarios de Excel
import { exportToExcel, downloadExcelTemplate } from '@/utils/excelExport';
import { importFromExcel } from '@/utils/excelImport';

// 🌟 1. INTERFACES
interface Ubicacion {
  servicio: string;
  area: string;
}

interface Equipo {
  id_equipo: number;
  cod_patrimonio: string | null;
  cod_patrimonio_verde: string | null;
  tipo_equipo: string;
  marca: string;
  modelo: string;
  numero_serie?: string;
  estado: string;
  ubicaciones: Ubicacion | null;
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
const fetchEquipos = async ([key, search, tipo, estado, paginaActual]: [string, string, string, string, number]) => {
  const ITEMS_POR_PAGINA = 10;
  
  let query = supabase
    .from('equipos')
    .select('*, ubicaciones (servicio, area)', { count: 'exact' })
    .is('deleted_at', null);

  if (search) {
    query = query.or(
      `cod_patrimonio.ilike.%${search}%,cod_patrimonio_verde.ilike.%${search}%,marca.ilike.%${search}%,modelo.ilike.%${search}%`
    );
  }

  if (tipo) query = query.eq('tipo_equipo', tipo);
  if (estado) query = query.eq('estado', estado);

  const from = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const to = from + ITEMS_POR_PAGINA - 1;
  
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  
  return { equipos: data as Equipo[], total: count || 0 };
};

export default function EquiposPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  // 🌟 Estados para Excel
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPaginaActual(1);
  }, [debouncedSearch, filterTipo, filterEstado]);

  // 🌟 4. LA MAGIA DE SWR
  const { data, error, isLoading, mutate } = useSWR(
    ['equipos', debouncedSearch, filterTipo, filterEstado, paginaActual],
    fetchEquipos,
    { keepPreviousData: true }
  );

  const equipos = data?.equipos || [];
  const totalEquipos = data?.total || 0;
  const totalPaginas = Math.ceil(totalEquipos / ITEMS_POR_PAGINA);

  // 🌟 5. FUNCIONES DE EXCEL
  const handleDescargarPlantilla = async () => {
    try {
      // Ponemos TODOS los campos que mencionaste para una carga masiva super completa
      const columnasPlantilla = [
        'cod_patrimonio', 'cod_patrimonio_verde', 'tipo_equipo', 'marca', 'modelo', 'numero_serie', 'id_ubicacion', 'estado',
        'procesador', 'memoria_ram', 'almacenamiento', 'direccion_ip', 'direccion_mac', 'nombre_red_pc', 'clave_vnc',
        'sistema_operativo', 'antivirus', 'tiene_sap', 'tiene_ses', 'tiene_internet', 'en_dominio'
      ];
      
      const filaEjemplo = [
        '01105291', 'V-001', 'CPU', 'DELL', 'OPTIPLEX 7090', 'SN-98765', '15', 'OPERATIVO',
        'Core i7', '16GB', '512GB SSD', '192.168.1.50', '00:1B:44:11:3A:B7', 'PC-RECEPCION', '1234',
        'Windows 10 Pro', 'Windows Defender', 'TRUE', 'FALSE', 'TRUE', 'TRUE'
      ];

      await downloadExcelTemplate(columnasPlantilla, 'Plantilla_Carga_Equipos', filaEjemplo);
    } catch (err) {
      alert('Error al generar la plantilla');
    }
  };

  const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      
      // Columnas mínimas obligatorias para que no falle la BD
      const columnasEsperadas = ['tipo_equipo', 'marca', 'modelo', 'id_ubicacion'];
      const datosCrudos = await importFromExcel(file, columnasEsperadas);

      const datosParaSupabase = datosCrudos.map((fila) => ({
        cod_patrimonio: fila['cod_patrimonio'] || null,
        cod_patrimonio_verde: fila['cod_patrimonio_verde'] || null,
        tipo_equipo: fila['tipo_equipo'],
        marca: fila['marca'],
        modelo: fila['modelo'],
        numero_serie: fila['numero_serie'] || null,
        id_ubicacion: parseInt(fila['id_ubicacion']),
        estado: fila['estado'] || 'OPERATIVO',
        
        // Red y Hardware (si vienen vacíos, se pone null)
        procesador: fila['procesador'] || null,
        memoria_ram: fila['memoria_ram'] || null,
        almacenamiento: fila['almacenamiento'] || null,
        direccion_ip: fila['direccion_ip'] || null,
        direccion_mac: fila['direccion_mac'] || null,
        nombre_red_pc: fila['nombre_red_pc'] || null,
        clave_vnc: fila['clave_vnc'] || null,
        
        // Software
        sistema_operativo: fila['sistema_operativo'] || null,
        antivirus: fila['antivirus'] || null,

        // Booleanos (Convertimos 'TRUE' texto a booleano real)
        tiene_sap: String(fila['tiene_sap']).toUpperCase() === 'TRUE',
        tiene_ses: String(fila['tiene_ses']).toUpperCase() === 'TRUE',
        tiene_internet: String(fila['tiene_internet']).toUpperCase() === 'TRUE',
        en_dominio: String(fila['en_dominio']).toUpperCase() === 'TRUE',
      }));

      const { error } = await supabase.from('equipos').insert(datosParaSupabase);
      if (error) throw error;

      alert(`✅ ¡Se importaron ${datosParaSupabase.length} equipos con éxito!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      mutate();

    } catch (err: any) {
      alert('Error al importar Excel: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExportarExcel = async () => {
    try {
      setExporting(true);
      
      // Hacemos una consulta sin paginación para exportar TODO lo que coincida con el filtro
      let query = supabase.from('equipos').select('*, ubicaciones(servicio, area)').is('deleted_at', null);
      
      if (debouncedSearch) {
        query = query.or(`cod_patrimonio.ilike.%${debouncedSearch}%,cod_patrimonio_verde.ilike.%${debouncedSearch}%,marca.ilike.%${debouncedSearch}%,modelo.ilike.%${debouncedSearch}%`);
      }
      if (filterTipo) query = query.eq('tipo_equipo', filterTipo);
      if (filterEstado) query = query.eq('estado', filterEstado);

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });
      if (fetchError) throw fetchError;

      // Mapeamos los datos para que el Excel salga bonito
     const dataMapeada = (data || []).map((eq: any) => ({
        ...eq,
        ubicacion_completa: eq.ubicaciones ? `${eq.ubicaciones.servicio} - ${eq.ubicaciones.area}` : 'Sin asignar',
        sap: eq.tiene_sap ? 'SÍ' : 'NO',
        internet: eq.tiene_internet ? 'SÍ' : 'NO'
      }));

      const columnasReporte = [
        { header: 'Patrimonio', key: 'cod_patrimonio', width: 15 },
        { header: 'Pat. Verde', key: 'cod_patrimonio_verde', width: 15 },
        { header: 'Tipo Equipo', key: 'tipo_equipo', width: 20 },
        { header: 'Marca', key: 'marca', width: 15 },
        { header: 'Modelo', key: 'modelo', width: 20 },
        { header: 'N° Serie', key: 'numero_serie', width: 20 },
        { header: 'Ubicación', key: 'ubicacion_completa', width: 35 },
        { header: 'IP', key: 'direccion_ip', width: 15 },
        { header: 'SO', key: 'sistema_operativo', width: 20 },
        { header: 'Tiene SAP', key: 'sap', width: 10 },
        { header: 'Internet', key: 'internet', width: 10 },
        { header: 'Estado', key: 'estado', width: 15 },
      ];

      await exportToExcel('Reporte General de Equipos', columnasReporte, dataMapeada, 'Reporte_Equipos');

    } catch (err: any) {
      alert('Error al exportar Excel: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // 🌟 6. MUTATE PARA ELIMINAR SIN RECARGAR
  const handleDelete = async (id_equipo: number, cod_patrimonio: string) => {
    const confirmacion = window.confirm(`¿Estás seguro de enviar a la papelera el equipo patrimonial ${cod_patrimonio || 'sin código'}?`);
    if (!confirmacion) return;

    const { error } = await supabase
      .from('equipos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_equipo', id_equipo);
    
    if (error) {
      alert('Error al enviar a la papelera: ' + error.message);
      return;
    }
    
    mutate();
  };

  const getColorEstado = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'OPERATIVO': return 'bg-green-100 text-green-800 border-green-200';
      case 'GARANTIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OBSOLETO': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'BAJA': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (error) return <div className="text-red-500 p-4 text-center">Error al cargar datos: {error.message}</div>;

  return (
    <div className="animate-fadeIn text-gray-900 p-4 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Panel de Equipos</h2>
          <p className="text-gray-500 text-sm">Directorio patrimonial y control de estaciones de trabajo vigentes.</p>
        </div>
        
        {/* GRUPO DE BOTONES SUPERIOR */}
        <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          
          {/* Input oculto para cargar archivo */}
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="hidden" onChange={handleImportarExcel} />

          {/* Botón Plantilla */}
          <button onClick={handleDescargarPlantilla} className="bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-all shadow-sm font-bold text-sm flex items-center gap-2">
            <span>📋</span> Plantilla
          </button>
          
          {/* Botón Importar */}
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-all shadow-md font-bold text-sm flex items-center gap-2 disabled:opacity-50">
            <span>📤</span> {importing ? '...' : 'Importar'}
          </button>

          {/* Botón Exportar */}
          <button onClick={handleExportarExcel} disabled={exporting} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-all shadow-md font-bold text-sm flex items-center gap-2 disabled:opacity-50">
            <span>📥</span> {exporting ? '...' : 'Exportar'}
          </button>

          <Link href="/equipos/papelera" className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-100 transition-all font-bold text-sm flex items-center gap-2 shadow-sm">
            <span>🗑️</span> Papelera
          </Link>
          
          <Link href="/nuevo-equipo" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md font-bold text-sm flex items-center gap-2">
            <span>➕</span> Nuevo Equipo
          </Link>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar (Patrimonio, Marca, Modelo)</label>
          <input 
            type="text" 
            placeholder="Ej: 01105291, 00539420, Dell..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Equipo</label>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="">Todos los tipos</option>
            <option value="CPU">CPU</option>
            <option value="Laptop">Laptop</option>
            <option value="Notebook">Notebook</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-500 mb-1">Estado Técnico</label>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="">Todos los estados</option>
            <option value="OPERATIVO">OPERATIVO</option>
            <option value="GARANTIA">EN GARANTÍA</option>
            <option value="OBSOLETO">OBSOLETO</option>
          </select>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white shadow-sm rounded-t-xl overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patrimonio</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Equipo</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ubicación</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estado Técnico</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400 font-medium animate-pulse">Consultando caché inteligente...</td></tr>
            ) : equipos.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500 font-medium">No se encontraron equipos con esos filtros.</td></tr>
            ) : (
              equipos.map((equipo: Equipo) => (
                <tr key={equipo.id_equipo} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {equipo.cod_patrimonio && (
                      <div className="font-bold text-blue-700 flex items-center gap-1.5" title="Código Azul/Principal">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        {equipo.cod_patrimonio}
                      </div>
                    )}
                    {equipo.cod_patrimonio_verde && (
                      <div className="font-bold text-green-600 flex items-center gap-1.5 mt-1.5" title="Código Verde">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        {equipo.cod_patrimonio_verde}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{equipo.tipo_equipo}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{equipo.marca} <span className="text-gray-400 ml-1">{equipo.modelo}</span></td>
                  
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {equipo.ubicaciones ? (
                      <span className="font-medium">{equipo.ubicaciones.servicio} <span className="text-gray-400 text-xs">({equipo.ubicaciones.area})</span></span>
                    ) : (
                      <span className="text-gray-400 italic">No asignada</span>
                    )}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getColorEstado(equipo.estado)}`}>
                      {equipo.estado || 'NO DEFINIDO'}
                    </span>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                    <Link href={`/detalles-equipo/${equipo.id_equipo}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Ver Detalles">👁️</Link>
                    <Link href={`/editar-equipo/${equipo.id_equipo}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Editar Equipo">⚙️</Link>
                    <button onClick={() => handleDelete(equipo.id_equipo, equipo.cod_patrimonio || '')} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Eliminar Equipo">🗑️</button>
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
                {' '} ({totalEquipos} resultados en total)
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