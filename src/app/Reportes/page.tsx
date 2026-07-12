'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'; 
import { Download, FileSpreadsheet, AlertTriangle, Layers, MapPin, Loader2, Monitor, Printer, CheckCircle, Wrench } from 'lucide-react';
import * as XLSX from 'xlsx'; 

export default function ReportesPage() {
  // Selector principal del módulo: EQUIPOS o PERIFERICOS
  const [moduloActivo, setModuloActivo] = useState<'EQUIPOS' | 'PERIFERICOS'>('EQUIPOS');
  
  const [areaFiltro, setAreaFiltro] = useState<string>('TODOS');
  const [tipoFiltro, setTipoFiltro] = useState<string>('TODOS');
  
  // Estados para datos crudos de Supabase
  const [equiposBrutos, setEquiposBrutos] = useState<any[]>([]);
  const [perifericosBrutos, setPerifericosBrutos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [descargando, setDescargando] = useState<string | null>(null);

  // Colores corporativos EsSalud para los gráficos
  const COLORS = {
    operativo: '#10B981', // Verde éxito
    mantenimiento: '#F59E0B', // Ambar
    obsoleto: '#64748B', // Gris oscuro
    baja: '#EF4444', // Rojo
    primary: '#002B49', // Azul marino institucional
    secondary: '#009BDE', // Celeste institucional
  };

  useEffect(() => {
    cargarDatosGenerales();
  }, []);

  // Al cambiar de módulo, reiniciamos el filtro de tipo para evitar conflictos
  useEffect(() => {
    setTipoFiltro('TODOS');
  }, [moduloActivo]);

  async function cargarDatosGenerales() {
    setLoading(true);
    try {
      // 1. Cargar Equipos
      const { data: dataEquipos, error: errEquipos } = await supabase
        .from('equipos')
        .select(`
          id_equipo, tipo_equipo, marca, modelo, numero_serie, cod_patrimonio, cod_patrimonio_verde, 
          estado, nombre_red_pc, direccion_ip,
          usuarios (nombres, apellidos),
          ubicaciones (servicio, area)
        `);
      if (errEquipos) throw errEquipos;

      // 2. Cargar Periféricos cruzando la ubicación de la PC vinculada
      const { data: dataPerifericos, error: errPerifericos } = await supabase
        .from('perifericos')
        .select(`
          *,
          equipos (
            nombre_red_pc,
            ubicaciones (servicio, area)
          )
        `);
      if (errPerifericos) throw errPerifericos;

      setEquiposBrutos(dataEquipos || []);
      setPerifericosBrutos(dataPerifericos || []);

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOGICA FILTROS DINÁMICOS (Se generan según la base de datos)
  // =========================================================
  const areasUnicas = useMemo(() => {
    const areas = new Set<string>();
    equiposBrutos.forEach((eq: any) => { if (eq.ubicaciones?.servicio) areas.add(eq.ubicaciones.servicio.toUpperCase()); });
    perifericosBrutos.forEach((p: any) => { if (p.equipos?.ubicaciones?.servicio) areas.add(p.equipos.ubicaciones.servicio.toUpperCase()); });
    return Array.from(areas).sort();
  }, [equiposBrutos, perifericosBrutos]);

  const tiposUnicos = useMemo(() => {
    const tipos = new Set<string>();
    if (moduloActivo === 'EQUIPOS') {
      equiposBrutos.forEach((eq: any) => { if (eq.tipo_equipo) tipos.add(eq.tipo_equipo.toUpperCase()); });
    } else {
      perifericosBrutos.forEach((p: any) => { if (p.tipo_periferico) tipos.add(p.tipo_periferico.toUpperCase()); });
    }
    return Array.from(tipos).sort();
  }, [equiposBrutos, perifericosBrutos, moduloActivo]);

  // =========================================================
  // LOGICA DE FILTRADO EN MEMORIA
  // =========================================================
  const equiposFiltrados = useMemo(() => {
    return equiposBrutos.filter((eq: any) => {
      const servicioLocal = (eq.ubicaciones?.servicio || 'ALMACÉN').toUpperCase();
      const tipoLocal = (eq.tipo_equipo || '').toUpperCase();
      const pasaArea = areaFiltro === 'TODOS' || servicioLocal.includes(areaFiltro);
      const pasaTipo = tipoFiltro === 'TODOS' || tipoLocal.includes(tipoFiltro);
      return pasaArea && pasaTipo;
    });
  }, [equiposBrutos, areaFiltro, tipoFiltro]);

  const perifericosFiltrados = useMemo(() => {
    return perifericosBrutos.filter((p: any) => {
      const servicioLocal = (p.equipos?.ubicaciones?.servicio || 'ALMACÉN').toUpperCase();
      const tipoLocal = (p.tipo_periferico || '').toUpperCase();
      const pasaArea = areaFiltro === 'TODOS' || servicioLocal.includes(areaFiltro);
      const pasaTipo = tipoFiltro === 'TODOS' || tipoLocal.includes(tipoFiltro);
      return pasaArea && pasaTipo;
    });
  }, [perifericosBrutos, areaFiltro, tipoFiltro]);

  // =========================================================
  // CÁLCULO DE KPIs DINÁMICOS
  // =========================================================
  const kpis = useMemo(() => {
    const listaActual = moduloActivo === 'EQUIPOS' ? equiposFiltrados : perifericosFiltrados;
    
    const operativos = listaActual.filter((item: any) => {
      const est = (moduloActivo === 'EQUIPOS' ? item.estado : (item.estado_fisico || item.estado || 'OPERATIVO'));
      return (est || 'OPERATIVO').toUpperCase() === 'OPERATIVO';
    }).length;

    const novedades = listaActual.filter((item: any) => {
      const est = (moduloActivo === 'EQUIPOS' ? item.estado : (item.estado_fisico || item.estado || 'OPERATIVO')).toUpperCase();
      return ['GARANTIA', 'MANTENIMIENTO', 'OBSOLETO', 'BAJA', 'DE BAJA'].includes(est);
    }).length;

    return {
      totalGlobal: moduloActivo === 'EQUIPOS' ? equiposBrutos.length : perifericosBrutos.length,
      filtrados: listaActual.length,
      operativos,
      enProblemas: novedades
    };
  }, [equiposFiltrados, perifericosFiltrados, equiposBrutos, perifericosBrutos, moduloActivo]);

  // =========================================================
  // DATOS PARA GRÁFICOS DINÁMICOS
  // =========================================================
  const datosPorArea = useMemo(() => {
    const conteo: Record<string, number> = {};
    const lista = moduloActivo === 'EQUIPOS' ? equiposFiltrados : perifericosFiltrados;
    
    lista.forEach((item: any) => {
      const area = (moduloActivo === 'EQUIPOS' ? item.ubicaciones?.servicio : item.equipos?.ubicaciones?.servicio) || 'Almacén';
      conteo[area] = (conteo[area] || 0) + 1;
    });
    
    return Object.keys(conteo)
      .map(key => ({ name: key.length > 15 ? key.substring(0, 15) + '...' : key, full: key, cantidad: conteo[key] }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 7);
  }, [equiposFiltrados, perifericosFiltrados, moduloActivo]);

  const datosPorEstado = useMemo(() => {
    const conteo = { 'OPERATIVO': 0, 'GARANTÍA/MANT.': 0, 'OBSOLETO': 0, 'BAJA': 0 };
    const lista = moduloActivo === 'EQUIPOS' ? equiposFiltrados : perifericosFiltrados;
    
    lista.forEach((item: any) => {
      const est = (moduloActivo === 'EQUIPOS' ? item.estado : (item.estado_fisico || item.estado || 'OPERATIVO')).toUpperCase();
      if (est === 'OPERATIVO') conteo['OPERATIVO']++;
      else if (est === 'OBSOLETO') conteo['OBSOLETO']++;
      else if (est === 'BAJA' || est === 'DE BAJA') conteo['BAJA']++;
      else conteo['GARANTÍA/MANT.']++; 
    });

    return [
      { name: 'Operativos', value: conteo['OPERATIVO'], color: COLORS.operativo }, 
      { name: 'Garantía/Mantenimiento', value: conteo['GARANTÍA/MANT.'], color: COLORS.mantenimiento }, 
      { name: 'Obsoletos', value: conteo['OBSOLETO'], color: COLORS.obsoleto }, 
      { name: 'De Baja', value: conteo['BAJA'], color: COLORS.baja }, 
    ].filter(item => item.value > 0); 
  }, [equiposFiltrados, perifericosFiltrados, moduloActivo]);

  // =========================================================
  // EXPORTACIONES INTELIGENTES ADAPTATIVAS
  // =========================================================
  const descargarExcel = (datos: any[], nombreArchivo: string, tipoBoton: string) => {
    setDescargando(tipoBoton);
    try {
      if (datos.length === 0) {
        alert("No hay datos que coincidan con los criterios actuales.");
        setDescargando(null);
        return;
      }
      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte_Data");
      XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error(error);
      alert("Error al generar el documento.");
    } finally {
      setDescargando(null);
    }
  };

  const exportarInventarioActivo = () => {
    if (moduloActivo === 'EQUIPOS') {
      const datos = equiposFiltrados
        .filter((eq: any) => (eq.estado || 'OPERATIVO').toUpperCase() !== 'BAJA')
        .map((eq: any) => ({
          'CÓD. SISTEMA': `EQ-${eq.id_equipo}`,
          'TIPO': eq.tipo_equipo || 'N/A',
          'MARCA': eq.marca || 'N/A',
          'MODELO': eq.modelo || 'N/A',
          'SERIE': eq.numero_serie || 'N/A',
          'SBN (AZUL)': eq.cod_patrimonio || 'S/N',
          'ETIQUETA VERDE': eq.cod_patrimonio_verde || 'S/N',
          'ESTADO': eq.estado || 'OPERATIVO',
          'RED IP': eq.direccion_ip || 'DHCP',
          'HOSTNAME': eq.nombre_red_pc || 'N/A',
          'SERVICIO': eq.ubicaciones?.servicio || 'ALMACÉN',
          'ÁREA EXACTA': eq.ubicaciones?.area || 'N/A',
          'USUARIO RESPONSABLE': eq.usuarios ? `${eq.usuarios.apellidos}, ${eq.usuarios.nombres}` : 'SIN ASIGNAR'
        }));
      descargarExcel(datos, `Reporte_Equipos_Activos_${areaFiltro}`, 'activo');
    } else {
      const datos = perifericosFiltrados
        .filter((p: any) => (p.estado_fisico || p.estado || 'OPERATIVO').toUpperCase() !== 'BAJA')
        .map((p: any) => ({
          'CÓD. SISTEMA': `PER-${p.id_periferico}`,
          'TIPO PERIFÉRICO': p.tipo_periferico || 'N/A',
          'MARCA': p.marca || 'N/A',
          'MODELO': p.modelo || 'N/A',
          'SERIE': p.n_serie || p.numero_serie || 'N/A',
          'SBN (AZUL)': p.cod_patrimonio_azul || 'S/N',
          'ETIQUETA VERDE': p.cod_patrimonio_verde || 'S/N',
          'ESTADO FÍSICO': p.estado_fisico || 'OPERATIVO',
          'DETALLE TÉCNICO': p.detalle_tecnico || 'N/A',
          'PC ASOCIADA': p.equipos?.nombre_red_pc || 'EN ALMACÉN',
          'SERVICIO UBICADO': p.equipos?.ubicaciones?.servicio || 'ALMACÉN'
        }));
      descargarExcel(datos, `Reporte_Perifericos_Activos_${areaFiltro}`, 'activo');
    }
  };

  const exportarCatalogoCompleto = () => {
    if (moduloActivo === 'EQUIPOS') {
      const datos = equiposBrutos.map((eq: any) => ({
        'CÓD. SISTEMA': `EQ-${eq.id_equipo}`,
        'TIPO': eq.tipo_equipo, 'MARCA': eq.marca, 'SERIE': eq.numero_serie, 'SBN': eq.cod_patrimonio, 'ESTADO': eq.estado
      }));
      descargarExcel(datos, 'Catalogo_Total_Equipos_EsSalud', 'catalogo');
    } else {
      const datos = perifericosBrutos.map((p: any) => ({
        'CÓD. SISTEMA': `PER-${p.id_periferico}`,
        'TIPO': p.tipo_periferico, 'MARCA': p.marca, 'SERIE': p.n_serie || p.numero_serie, 'SBN': p.cod_patrimonio_azul, 'ESTADO': p.estado_fisico
      }));
      descargarExcel(datos, 'Catalogo_Total_Perifericos_EsSalud', 'catalogo');
    }
  };

  const exportarBajas = async () => {
    setDescargando('bajas');
    try {
      if (moduloActivo === 'EQUIPOS') {
        const { data, error } = await supabase.from('equipos').select('*, ubicaciones(servicio, area)').eq('estado', 'BAJA');
        if (error) throw error;
        const datos = (data || []).map((eq: any) => ({
          'ID': `EQ-${eq.id_equipo}`, 'SBN': eq.cod_patrimonio, 'TIPO': eq.tipo_equipo, 'MARCA': eq.marca, 'ÚLT. SERVICIO': eq.ubicaciones?.servicio || 'Almacén'
        }));
        descargarExcel(datos, 'Reporte_Bajas_Equipos_PostAuditoria', 'bajas');
      } else {
        const { data, error } = await supabase.from('perifericos').select('*, equipos(ubicaciones(servicio))').eq('estado_fisico', 'BAJA');
        if (error) throw error;
        const datos = (data || []).map((p: any) => ({
          'ID': `PER-${p.id_periferico}`, 'SBN': p.cod_patrimonio_azul, 'TIPO': p.tipo_periferico, 'MARCA': p.marca, 'ÚLT. SERVICIO': p.equipos?.ubicaciones?.servicio || 'Almacén'
        }));
        descargarExcel(datos, 'Reporte_Bajas_Perifericos_PostAuditoria', 'bajas');
      }
    } catch (err) {
      alert("Error al exportar las bajas patrimoniales.");
    } finally {
      setDescargando(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-[#002B49] font-semibold animate-pulse flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#009BDE]" />
        <span className="text-sm tracking-widest uppercase">Procesando analítica de control...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 text-gray-900 bg-[#F4F7FA] min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-[#002B49] tracking-tight">Dashboard Analítico</h1>
          <p className="text-[#009BDE] font-bold text-xs tracking-widest uppercase mt-1">Control de Patrimonio Informático - EsSalud</p>
        </div>

        {/* ==========================================
            NUEVO: INTERRUPTOR DE MÓDULO CORPORATIVO
            ========================================== */}
        <div className="flex bg-gray-200/70 p-1 rounded-xl w-full md:w-80 border border-gray-300 shadow-inner">
          <button 
            onClick={() => setModuloActivo('EQUIPOS')} 
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black tracking-wide uppercase transition-all duration-200 ${moduloActivo === 'EQUIPOS' ? 'bg-[#002B49] text-white shadow-md' : 'text-gray-500 hover:text-[#002B49]'}`}
          >
            <Monitor className="w-3.5 h-3.5" /> Equipos
          </button>
          <button 
            onClick={() => setModuloActivo('PERIFERICOS')} 
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black tracking-wide uppercase transition-all duration-200 ${moduloActivo === 'PERIFERICOS' ? 'bg-[#002B49] text-white shadow-md' : 'text-gray-500 hover:text-[#002B49]'}`}
          >
            <Printer className="w-3.5 h-3.5" /> Periféricos
          </button>
        </div>
      </div>

      {/* TARJETAS DE RESUMEN KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4 border-l-4 border-l-[#002B49]">
          <div className="p-3 bg-blue-50 text-[#002B49] rounded-xl">
            {moduloActivo === 'EQUIPOS' ? <Monitor className="w-6 h-6" /> : <Printer className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Filtrados / Visibles</p>
            <p className="text-2xl font-black text-gray-800">{kpis.filtrados}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4 border-l-4 border-l-[#009BDE]">
          <div className="p-3 bg-sky-50 text-[#009BDE] rounded-xl"><Layers className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Total en Base de Datos</p>
            <p className="text-2xl font-black text-gray-800">{kpis.totalGlobal}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Elementos Operativos</p>
            <p className="text-2xl font-black text-gray-800">{kpis.operativos}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Wrench className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Con Novedades / Mant.</p>
            <p className="text-2xl font-black text-gray-800">{kpis.enProblemas}</p>
          </div>
        </div>
      </div>

      {/* FILTROS DINÁMICOS */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-[#002B49] uppercase flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> Filtrar por Servicio / Dependencia
          </label>
          <select 
            value={areaFiltro} 
            onChange={(e) => setAreaFiltro(e.target.value)}
            className="w-full mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#009BDE] outline-none transition"
          >
            <option value="TODOS">-- Todos los Servicios --</option>
            {areasUnicas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
            <option value="ALMACÉN">ALMACÉN / STOCK LIBRE</option>
          </select>
        </div>
        
        <div>
          <label className="text-xs font-bold text-[#002B49] uppercase flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5" /> Filtrar por Categoría / Tipo ({moduloActivo.toLowerCase()})
          </label>
          <select 
            value={tipoFiltro} 
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="w-full mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#009BDE] outline-none transition"
          >
            <option value="TODOS">-- Todos los Tipos registrados --</option>
            {tiposUnicos.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Barras */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-[#002B49] uppercase tracking-wider mb-6">
            Distribución de {moduloActivo === 'EQUIPOS' ? 'Equipos' : 'Periféricos'} por Servicio (Top 7)
          </h3>
          <div className="h-72 w-full relative">
            {datosPorArea.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosPorArea} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: '#002B49', fontWeight: 'bold', marginBottom: '5px' }}
                    formatter={(value) => [`${value} unidades`, 'Cantidad']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.full || label}
                  />
                  <Bar dataKey="cantidad" fill={moduloActivo === 'EQUIPOS' ? '#002B49' : '#009BDE'} radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">No hay registros con los filtros actuales.</div>
            )}
          </div>
        </div>

        {/* Gráfico de Torta / Dona */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-[#002B49] uppercase tracking-wider mb-2">
            Salud Física / Estado Técnico
          </h3>
          <p className="text-xs text-gray-400 mb-6">Proporción de {moduloActivo.toLowerCase()} actuales.</p>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-48 w-full relative">
              {datosPorEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={datosPorEstado} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {datosPorEstado.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sin datos.</div>
              )}
            </div>
            
            <div className="flex flex-col gap-2 text-xs font-bold text-gray-600 mt-4">
              {datosPorEstado.map(st => (
                <div key={st.name} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: st.color }}></span>
                    {st.name}
                  </div>
                  <span className="text-gray-900 bg-white px-2 py-0.5 rounded shadow-xs">{st.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EXPORTACIONES EXCEL */}
      <div className="pt-4">
        <h2 className="text-lg font-black text-[#002B49] mb-4">Exportación Inteligente ({moduloActivo === 'EQUIPOS' ? 'Equipos' : 'Periféricos'})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          <button 
            onClick={exportarInventarioActivo}
            disabled={descargando !== null}
            className="p-5 bg-white border border-gray-200 hover:border-[#009BDE] hover:shadow-md rounded-2xl text-left group transition-all flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <h4 className="font-bold text-[#002B49] group-hover:text-[#009BDE] transition-colors">
                {descargando === 'activo' ? 'Generando...' : `Inventario Activo (${moduloActivo === 'EQUIPOS' ? 'CPUs' : 'Componentes'})`}
              </h4>
              <p className="text-xs text-gray-500 mt-1">Exporta las filas actuales según área y tipo seleccionado ({kpis.filtrados} registros).</p>
            </div>
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${descargando === 'activo' ? 'bg-gray-100 text-gray-400 animate-pulse' : 'bg-[#009BDE]/10 text-[#009BDE]'}`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </button>

          <button 
            onClick={exportarCatalogoCompleto}
            disabled={descargando !== null}
            className="p-5 bg-white border border-gray-200 hover:border-[#002B49] hover:shadow-md rounded-2xl text-left group transition-all flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <h4 className="font-bold text-[#002B49] group-hover:text-[#002B49] transition-colors">
                {descargando === 'catalogo' ? 'Generando...' : `Catálogo Histórico Global`}
              </h4>
              <p className="text-xs text-gray-500 mt-1">Descarga un histórico unificado del 100% de la base de datos de {moduloActivo.toLowerCase()}.</p>
            </div>
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${descargando === 'catalogo' ? 'bg-gray-100 text-gray-400 animate-pulse' : 'bg-[#002B49]/10 text-[#002B49]'}`}>
              <Printer className="w-5 h-5" />
            </div>
          </button>

          <button 
            onClick={exportarBajas}
            disabled={descargando !== null}
            className="p-5 bg-white border border-gray-200 hover:border-red-500 hover:shadow-md rounded-2xl text-left group transition-all flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <h4 className="font-bold text-gray-800 group-hover:text-red-600 transition-colors">
                {descargando === 'bajas' ? 'Generando...' : `Auditoría: Bajas de ${moduloActivo === 'EQUIPOS' ? 'Equipos' : 'Periféricos'}`}
              </h4>
              <p className="text-xs text-gray-500 mt-1">Descarga exclusivamente los elementos descartados en estado legal de BAJA.</p>
            </div>
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${descargando === 'bajas' ? 'bg-gray-100 text-gray-400 animate-pulse' : 'bg-red-50 text-red-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </button>

        </div>
      </div>

    </div>
  );
}