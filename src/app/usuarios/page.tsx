'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import useSWR from 'swr';
import { exportToExcel, downloadExcelTemplate } from '@/utils/excelExport';
import { importFromExcel } from '@/utils/excelImport';

// INTERFAZ DE USUARIO
interface Usuario {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  cod_planilla: string | null;
  usuario_red_windows: string | null;
  anexo: string | null;
  email_institucional: string | null;
  activo: boolean;
}

// HOOK DE DEBOUNCE
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
const fetchUsuarios = async ([key, search, inactivos, paginaActual]: [string, string, boolean, number]) => {
  const ITEMS_POR_PAGINA = 10;
  
  let query = supabase.from('usuarios').select('*', { count: 'exact' });
    
  if (search) {
    query = query.or(`nombres.ilike.%${search}%,apellidos.ilike.%${search}%,cod_planilla.ilike.%${search}%,anexo.ilike.%${search}%`);
  }

  if (inactivos) {
    query = query.eq('activo', false);
  } else {
    query = query.or('activo.eq.true,activo.is.null'); 
  }

  const from = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const to = from + ITEMS_POR_PAGINA - 1;
  
  query = query.range(from, to).order('apellidos', { ascending: true });

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  
  return { usuarios: data || [], total: count || 0 };
};

export default function UsuariosPage() {
  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  // Estados para acciones de Excel
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resetear a página si cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [debouncedSearch, mostrarInactivos]);

  // LA MAGIA DE SWR
  const { data, error, isLoading, mutate } = useSWR(
    ['usuarios', debouncedSearch, mostrarInactivos, paginaActual], 
    fetchUsuarios,
    { keepPreviousData: true } 
  );

  const usuarios = data?.usuarios || [];
  const totalUsuarios = data?.total || 0;
  const totalPaginas = Math.ceil(totalUsuarios / ITEMS_POR_PAGINA);

  // ACCIONES EXCEL
  const handleDescargarPlantilla = async () => {
    try {
      const columnasPlantilla = [
        'cod_planilla', 'nombres', 'apellidos', 'usuario_red_windows', 'anexo', 'email_institucional'
      ];
      
      const filaEjemplo = [
        '14626282', 'Domingo', 'Zavala', 'dzavala', '4321', 'dzavala@institucion.gob.pe'
      ];

      await downloadExcelTemplate(columnasPlantilla, 'Plantilla_Carga_Personal', filaEjemplo);
    } catch (err) {
      alert('Error al generar la plantilla');
    }
  };

  const handleImportarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      

      const columnasEsperadas = ['nombres', 'apellidos'];
      const datosCrudos = await importFromExcel(file, columnasEsperadas);

      const datosParaSupabase = datosCrudos.map((fila) => ({
        cod_planilla: fila['cod_planilla'] ? String(fila['cod_planilla']) : null,
        nombres: fila['nombres'],
        apellidos: fila['apellidos'],
        usuario_red_windows: fila['usuario_red_windows'] || null,
        anexo: fila['anexo'] ? String(fila['anexo']) : null,
        email_institucional: fila['email_institucional'] || null,
        activo: true 
      }));

      const { error } = await supabase.from('usuarios').insert(datosParaSupabase);
      if (error) throw error;

      alert(`✅ ¡Se importaron ${datosParaSupabase.length} usuarios con éxito!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      mutate();

    } catch (err: any) {
      alert('Error al importar usuarios: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExportarExcel = async () => {
    try {
      setExporting(true);
      
      let query = supabase.from('usuarios').select('*');
      
      if (debouncedSearch) {
        query = query.or(`nombres.ilike.%${debouncedSearch}%,apellidos.ilike.%${debouncedSearch}%,cod_planilla.ilike.%${debouncedSearch}%,anexo.ilike.%${debouncedSearch}%`);
      }
      if (mostrarInactivos) {
        query = query.eq('activo', false);
      } else {
        query = query.or('activo.eq.true,activo.is.null'); 
      }

      const { data, error: fetchError } = await query.order('apellidos', { ascending: true });
      if (fetchError) throw fetchError;

      // Mapeamos los datos agregando la anotación (eq: any) para prevenir conflictos con TypeScript strict
      const dataMapeada = (data || []).map((eq: any) => ({
        ...eq,
        estado_usuario: eq.activo ? 'ACTIVO' : 'CESADO'
      }));

      const columnasReporte = [
        { header: 'Código Planilla', key: 'cod_planilla', width: 18 },
        { header: 'Apellidos', key: 'apellidos', width: 25 },
        { header: 'Nombres', key: 'nombres', width: 25 },
        { header: 'Usuario de Red', key: 'usuario_red_windows', width: 20 },
        { header: 'Anexo / Ext', key: 'anexo', width: 15 },
        { header: 'Correo Electrónico', key: 'email_institucional', width: 30 },
        { header: 'Estado', key: 'estado_usuario', width: 15 }
      ];

      const nombreArchivo = mostrarInactivos ? 'Reporte_Personal_Cesado' : 'Directorio_Personal_Activo';
      await exportToExcel('Directorio y Control de Personal', columnasReporte, dataMapeada, nombreArchivo);

    } catch (err: any) {
      alert('Error al exportar Excel: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // MUTATE ACCIONES DE BAJA Y RESTAURAR
  const handleDesactivar = async (id: number, textNombre: string) => {
    const confirmacion = window.confirm(`¿Estás seguro de dar de baja a ${textNombre}?`);
    if (!confirmacion) return;

    const { error } = await supabase.from('usuarios').update({ activo: false }).eq('id_usuario', id);
    if (error) { alert('Error: ' + error.message); return; }
    
    mutate();
  };

  const handleRestaurar = async (id: number, textNombre: string) => {
    const confirmacion = window.confirm(`¿Deseas reincorporar a ${textNombre}?`);
    if (!confirmacion) return;

    const { error } = await supabase.from('usuarios').update({ activo: true }).eq('id_usuario', id);
    if (error) { alert('Error: ' + error.message); return; }
    
    mutate();
  };

  if (error) return <div className="text-red-500 p-4 text-center">Error al cargar datos: {error.message}</div>;

  return (
    <div className="animate-fadeIn text-gray-900 p-4 max-w-7xl mx-auto">
      {/* CABECERA Y BOTONES DE CONTROL DE EXCEL */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Directorio de Personal</h2>
          <p className="text-gray-500 text-sm">Gestión de usuarios y responsables de equipos informáticos.</p>
        </div>
        
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

          <Link href="/usuarios/nuevo" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md font-bold text-sm flex items-center gap-2">
            <span>➕</span> Registrar Personal
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-2/3">
          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar por Apellidos, Nombres, Planilla o Anexo</label>
          <input 
            type="text" 
            placeholder="Ej: Zavala, Domingo, 14626282..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="w-full sm:w-auto flex items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={mostrarInactivos} onChange={() => setMostrarInactivos(!mostrarInactivos)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${mostrarInactivos ? 'bg-red-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${mostrarInactivos ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className={`ml-3 text-sm font-bold ${mostrarInactivos ? 'text-red-600' : 'text-gray-500'}`}>
              {mostrarInactivos ? '🗑️ Personal Cesado' : 'Ver Cesados'}
            </span>
          </label>
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="bg-white shadow-sm rounded-t-xl overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={mostrarInactivos ? "bg-red-50" : "bg-blue-50"}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Cód. Planilla</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Apellidos y Nombres</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Usuario Red</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Contacto</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400 animate-pulse">Cargando personal (Caché inteligente)...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No se encontraron registros.</td></tr>
            ) : (
              usuarios.map((user: Usuario) => (
                <tr key={user.id_usuario} className={`hover:bg-gray-50 ${mostrarInactivos ? 'opacity-70' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-700">{user.cod_planilla || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <p className="font-bold text-blue-800">{user.apellidos}</p>
                    <p className="text-gray-600">{user.nombres}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600 bg-gray-50">{user.usuario_red_windows || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    {user.anexo && <p className="font-bold text-gray-700">📞 Ext: {user.anexo}</p>}
                    {user.email_institucional && <p className="text-gray-500">✉️ {user.email_institucional}</p>}
                    {!user.anexo && !user.email_institucional && <span className="text-gray-400 italic">Sin datos</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center space-x-2">
                    {!mostrarInactivos ? (
                      <>
                        <Link href={`/usuarios/detalles?id=${user.id_usuario}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Ver equipos asignados">👁️</Link>
                        <Link href={`/usuarios/editar/${user.id_usuario}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100" title="Editar">⚙️</Link>
                        <button onClick={() => handleDesactivar(user.id_usuario, user.nombres)} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100" title="Dar de baja">🗑️</button>
                      </>
                    ) : (
                      <button onClick={() => handleRestaurar(user.id_usuario, user.nombres)} className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold" title="Restaurar">
                        ♻️ Reincorporar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      {!isLoading && totalPaginas > 1 && (
        <div className="bg-white px-4 py-3 border border-t-0 border-gray-200 rounded-b-xl flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando página <span className="font-medium">{paginaActual}</span> de <span className="font-medium">{totalPaginas}</span> 
                {' '} ({totalUsuarios} resultados)
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