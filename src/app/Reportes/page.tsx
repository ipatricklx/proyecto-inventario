'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Equipo } from '@/types/inventario';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'; 
import { Download, FileSpreadsheet, AlertTriangle, Layers, MapPin, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx'; 

export default function ReportesPage() {
  const [areaFiltro, setAreaFiltro] = useState<string>('TODOS');
  const [tipoFiltro, setTipoFiltro] = useState<string>('TODOS');
  
  const [equiposBrutos, setEquiposBrutos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [descargando, setDescargando] = useState<boolean>(false);

  useEffect(() => {
    cargarDatosGenerales();
  }, []);

  async function cargarDatosGenerales() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select(`
          id_equipo,
          tipo_equipo,
          marca,
          modelo,
          numero_serie,
          cod_patrimonio,
          cod_patrimonio_verde,
          estado,
          nombre_red_pc,
          usuarios (nombres, apellidos),
          ubicaciones (servicio, area)
        `);

      if (error) throw error;
      if (data) setEquiposBrutos(data as unknown as Equipo[]);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }

  // 🧩 Filtrado Seguro y Autocompletado (Sin :any)
  const equiposFiltrados = useMemo(() => {
    return equiposBrutos.filter(eq => {
      const servicioLocal = (eq.ubicaciones?.servicio || 'ALMACÉN').toUpperCase();
      const tipoLocal = (eq.tipo_equipo || '').toUpperCase();

      const pasaFiltroArea = areaFiltro === 'TODOS' || servicioLocal.includes(areaFiltro);
      const pasaFiltroTipo = tipoFiltro === 'TODOS' || tipoLocal.includes(tipoFiltro);

      return pasaFiltroArea && pasaFiltroTipo;
    });
  }, [equiposBrutos, areaFiltro, tipoFiltro]);

  // 📊 Datos para Gráfico de Barras (Top 5 Áreas)
  const datosPorArea = useMemo(() => {
    const conteo: Record<string, number> = {};
    equiposFiltrados.forEach(eq => {
      const area = eq.ubicaciones?.servicio || 'Almacén';
      conteo[area] = (conteo[area] || 0) + 1;
    });
    
    return Object.keys(conteo)
      .map(key => ({ name: key, equipos: conteo[key] }))
      .sort((a, b) => b.equipos - a.equipos)
      .slice(0, 5);
  }, [equiposFiltrados]);

  // 🍩 Datos para Gráfico de Dona (Salud de Dispositivos)
  const datosPorEstado = useMemo(() => {
    const conteo = { 'OPERATIVO': 0, 'GARANTIA': 0, 'OBSOLETO': 0, 'BAJA': 0 };
    
    equiposFiltrados.forEach(eq => {
      const est = (eq.estado || 'OPERATIVO').toUpperCase() as keyof typeof conteo;
      if (conteo[est] !== undefined) conteo[est]++;
    });

    return [
      { name: 'Operativos', value: conteo['OPERATIVO'], color: '#10B981' }, 
      { name: 'En Garantía', value: conteo['GARANTIA'], color: '#F59E0B' }, 
      { name: 'Obsoletos', value: conteo['OBSOLETO'], color: '#616057' }, 
      { name: 'De Baja', value: conteo['BAJA'], color: '#e23b3b' }, 
    ].filter(item => item.value > 0); 
  }, [equiposFiltrados]);

  // 📥 Exportación Inteligente con XLSX
  const exportarInventarioExcel = () => {
    setDescargando(true);
    try {
      if (equiposFiltrados.length === 0) {
        alert("No hay datos para exportar con los filtros actuales.");
        setDescargando(false);
        return;
      }
      const datosExcel = equiposFiltrados.map(eq => ({
        'ID Sistema': `EQ-${eq.id_equipo}`,
        'Tipo': eq.tipo_equipo || 'N/A',
        'Marca/Modelo': `${eq.marca || ''} ${eq.modelo || ''}`.trim() || 'N/A',
        'Nº Serie': eq.numero_serie || 'N/A',
        'Cód. SBN': eq.cod_patrimonio || 'S/N',
        'Cód. Verde': eq.cod_patrimonio_verde || 'S/N',
        'Estado': eq.estado || 'OPERATIVO',
        'Nombre de Red': eq.nombre_red_pc || 'N/A',
        'Ubicación Física': eq.ubicaciones ? `${eq.ubicaciones.servicio} - ${eq.ubicaciones.area}` : 'Almacén',
        'Usuario Responsable': eq.usuarios ? `${eq.usuarios.apellidos}, ${eq.usuarios.nombres}` : 'Sin asignar'
      }));

      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario Filtrado");
      
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Reporte_MedTrack_${areaFiltro}_${fecha}.xlsx`);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert("Error al generar el documento.");
    } finally {
      setDescargando(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-500 font-semibold animate-pulse flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
        <span className="text-sm tracking-wide">Compilando reportes y auditorías...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-gray-900">
      
      {/* ENCABEZADO */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Informes y Auditoría</h1>
        <p className="text-gray-500 text-sm mt-1">Generación de reportes analíticos y descargas de inventario institucional.</p>
      </div>

      {/* SECCIÓN DE FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase">Ubicación / Área</label>
          <select 
            value={areaFiltro} 
            onChange={(e) => setAreaFiltro(e.target.value)}
            className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todas las áreas</option>
            <option value="EMERGENCIA">Emergencia</option>
            <option value="TRIAJE">Triaje</option>
            <option value="CONSULTA INTERNA">Consulta Interna</option>
            <option value="CONSULTA EXTERNA">Consulta Externa</option>
            <option value="PEDIATRIA">Pediatría</option>
            <option value="ALMACÉN">Almacén / Sin asignar</option>
          </select>
        </div>
        
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase">Tipo de Dispositivo</label>
          <select 
            value={tipoFiltro} 
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="LAPTOP">Laptops</option>
            <option value="DESKTOP">Computadoras de Escritorio</option>
            <option value="SERVIDOR">Servidores</option>
            <option value="IMPRESORA">Impresoras</option>
          </select>
        </div>

        <div className="flex items-end">
          <div className="w-full py-2.5 bg-blue-50 border border-blue-100 text-blue-700 font-bold rounded-xl text-sm shadow-sm flex items-center justify-center gap-2">
            📊 Evaluando {equiposFiltrados.length} registros
          </div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS (ZONA VISUAL REAL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Barras Recharts */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-6 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" /> Densidad de Equipos por Área (Top 5)
          </h3>
          <div className="h-64 w-full relative">
            {datosPorArea.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                <BarChart data={datosPorArea} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="equipos" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No hay registros cargados.</div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Dona Recharts */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" /> Salud del Inventario
          </h3>
          <div className="h-64 w-full flex flex-col justify-between">
            <div className="h-44 w-full relative">
              {datosPorEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                  <PieChart>
                    <Pie
                      data={datosPorEstado}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {datosPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin estados cargados.</div>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-bold text-slate-600 pt-3 border-t border-gray-100">
              {datosPorEstado.map(st => (
                <div key={st.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }}></span>
                  {st.value} {st.name.substring(0, 3)}.
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* SECCIÓN DE EXPORTACIONES RÁPIDAS */}
      <div className="pt-2">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Exportaciones Disponibles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          <button 
            onClick={exportarInventarioExcel}
            disabled={descargando}
            className="p-5 bg-white border border-gray-200 hover:border-emerald-300 rounded-2xl shadow-xs text-left group transition flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div>
              <h4 className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                {descargando ? 'Compilando...' : 'Inventario Activo'}
              </h4>
              <p className="text-xs text-gray-400 mt-1">Descarga el bloque actual ({equiposFiltrados.length} filas).</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${descargando ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </button>

          <button className="p-5 bg-white border border-gray-200 hover:border-blue-300 rounded-2xl shadow-xs text-left group transition flex items-center justify-between opacity-50 cursor-not-allowed">
            <div>
              <h4 className="font-bold text-gray-800">Fichas de Mantenimiento</h4>
              <p className="text-xs text-gray-400 mt-1">Historial técnico listo para auditoría institucional.</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
          </button>

          <button className="p-5 bg-white border border-gray-200 hover:border-red-300 rounded-2xl shadow-xs text-left group transition flex items-center justify-between opacity-50 cursor-not-allowed">
            <div>
              <h4 className="font-bold text-gray-800">Reporte de Bajas</h4>
              <p className="text-xs text-gray-400 mt-1">Histórico de hardware descartado y desmantelado.</p>
            </div>
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </button>

        </div>
      </div>

    </div>
  );
}