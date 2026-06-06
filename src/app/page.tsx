'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  RefreshCw, 
  Monitor, 
  Keyboard, 
  Users, 
  Activity, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  ArchiveX,
  Plus
} from 'lucide-react';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalEquipos: 0,
    totalPerifericos: 0,
    totalUsuarios: 0,
    pcsEnUso: 0,
    equiposGarantia: 0,
    equiposObsoletos: 0,
    equiposBaja: 0,
    perifericosGarantia: 0,
    perifericosObsoletos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [
        { count: equiposCount },
        { count: perifericosCount },
        { count: usuariosCount },
        { count: pcsEnUsoCount },
        { count: eqGarantia },
        { count: eqObsoleto },
        { count: eqBaja },
        { count: periGarantia },
        { count: periObsoleto }
      ] = await Promise.all([
        supabase.from('equipos').select('*', { count: 'exact', head: true }),
        supabase.from('perifericos').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('activo', true),
        
        // CORRECCIÓN 1: Las PCs en uso solo deben contar equipos que NO estén dados de baja
        supabase.from('equipos').select('*', { count: 'exact', head: true })
          .not('id_usuario', 'is', null)
          .neq('estado', 'BAJA'),
          
        supabase.from('equipos').select('*', { count: 'exact', head: true }).eq('estado', 'GARANTIA'),
        supabase.from('equipos').select('*', { count: 'exact', head: true }).eq('estado', 'OBSOLETO'),
        supabase.from('equipos').select('*', { count: 'exact', head: true }).eq('estado', 'BAJA'),
        supabase.from('perifericos').select('*', { count: 'exact', head: true }).eq('estado', 'GARANTIA'),
        supabase.from('perifericos').select('*', { count: 'exact', head: true }).eq('estado', 'OBSOLETO'),
      ]);

      setMetrics({
        totalEquipos: equiposCount || 0,
        totalPerifericos: perifericosCount || 0,
        totalUsuarios: usuariosCount || 0,
        pcsEnUso: pcsEnUsoCount || 0,
        equiposGarantia: eqGarantia || 0,
        equiposObsoletos: eqObsoleto || 0,
        equiposBaja: eqBaja || 0,
        perifericosGarantia: periGarantia || 0,
        perifericosObsoletos: periObsoleto || 0,
      });
    } catch (error) {
      console.error('Error al cargar métricas del dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Cargando panel de control...</div>;
  }

  // CORRECCIÓN 2: Calcular la flota operativa real (Total absoluto - Los retirados de baja)
  const equiposOperativosReales = metrics.totalEquipos - metrics.equiposBaja;
  
  // CORRECCIÓN 3: La tasa ahora divide las PCs asignadas útiles entre la flota operativa útil
  const tasaDeUsoCalculada = equiposOperativosReales > 0 
    ? Math.round((metrics.pcsEnUso / equiposOperativosReales) * 100) 
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-gray-900 animate-fadeIn">
      
      {/* SECCIÓN BIENVENIDA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Panel de Control</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen en tiempo real del inventario tecnológico de la institución.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" /> Actualizar Datos
        </button>
      </div>

      {/* METRICAS PRINCIPALES (OPERATIVAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* TARJETA: EQUIPOS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-all duration-200 group">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Equipos</p>
            <h3 className="text-3xl font-black text-gray-800">{metrics.totalEquipos}</h3>

            <div className="mt-2">
              <p className="text-xs text-blue-600 font-medium flex items-center gap-1.5 bg-blue-50/50 inline-flex px-2 py-0.5 rounded-md">
                <Monitor className="w-3 h-3" /> {metrics.pcsEnUso} activos en uso
              </p>
            </div>
            
            <Link href="/equipos" className="text-xs text-gray-400 hover:text-indigo-600 font-medium transition-colors inline-block mt-2">
              Ver listado →
            </Link>
          </div>
          <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 transition-colors text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
            <Monitor className="w-6 h-6" />
          </div>
        </div>

        {/* TARJETA: PERIFÉRICOS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-all duration-200 group">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Periféricos</p>
            <h3 className="text-3xl font-black text-gray-800">{metrics.totalPerifericos}</h3>
            <Link href="/perifericos" className="text-xs text-gray-400 hover:text-indigo-600 font-medium transition-colors inline-block mt-1.5">
              Ver listado →
            </Link>
          </div>
          <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-100 transition-colors text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
            <Keyboard className="w-6 h-6" />
          </div>
        </div>

        {/* TARJETA: USUARIOS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-all duration-200 group">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Personal Activo</p>
            <h3 className="text-3xl font-black text-gray-800">{metrics.totalUsuarios}</h3>
            <Link href="/usuarios" className="text-xs text-gray-400 hover:text-emerald-600 font-medium transition-colors inline-block mt-1.5">
              Ver directorio →
            </Link>
          </div>
          <div className="w-12 h-12 bg-emerald-50 group-hover:bg-emerald-100 transition-colors text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* TARJETA: % TASA DE USO REAL */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-all duration-200 group">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tasa de Uso (PC)</p>
            <h3 className="text-3xl font-black text-gray-800">
              {tasaDeUsoCalculada}%
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-1.5">De la flota operativa útil</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 group-hover:bg-amber-100 transition-colors text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECCIÓN DE ALERTAS Y ESTADOS CRÍTICOS */}
      <div className="pt-2">
        <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-gray-400" /> Estados de Soporte y Ciclo de Vida
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BLOQUE: GARANTÍA */}
          <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200/60 shadow-xs">
            <h4 className="font-bold text-amber-800 text-sm uppercase tracking-wider flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4" /> En Garantía
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-amber-100/80 shadow-xs">
                <span className="text-sm font-medium text-gray-600">Equipos</span>
                <span className="font-bold text-lg text-amber-700">{metrics.equiposGarantia}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-amber-100/80 shadow-xs">
                <span className="text-sm font-medium text-gray-600">Periféricos</span>
                <span className="font-bold text-lg text-amber-700">{metrics.perifericosGarantia}</span>
              </div>
            </div>
          </div>

          {/* BLOQUE: OBSOLETO */}
          <div className="bg-orange-50/40 rounded-2xl p-6 border border-orange-200/60 shadow-xs">
            <h4 className="font-bold text-orange-800 text-sm uppercase tracking-wider flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" /> Obsoletos / Reemplazo
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-orange-100/80 shadow-xs">
                <span className="text-sm font-medium text-gray-600">Equipos</span>
                <span className="font-bold text-lg text-orange-700">{metrics.equiposObsoletos}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-orange-100/80 shadow-xs">
                <span className="text-sm font-medium text-gray-600">Periféricos</span>
                <span className="font-bold text-lg text-orange-700">{metrics.perifericosObsoletos}</span>
              </div>
            </div>
          </div>

          {/* BLOQUE: DADOS DE BAJA */}
          <div className="bg-red-50/40 rounded-2xl p-6 border border-red-200/60 shadow-xs">
            <h4 className="font-bold text-red-800 text-sm uppercase tracking-wider flex items-center gap-2 mb-4">
              <ArchiveX className="w-4 h-4" /> Histórico / Baja
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-red-100/80 shadow-xs">
                <span className="text-sm font-medium text-gray-600">Equipos Retirados</span>
                <span className="font-bold text-lg text-red-700">{metrics.equiposBaja}</span>
              </div>
              <div className="p-3.5 bg-red-100/30 rounded-xl text-center text-xs font-medium text-red-700 border border-red-100/50">
                Excluidos del inventario operativo activo.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACCESOS RÁPIDOS MÓVILES */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shadow-md mt-4">
        <div>
          <h4 className="font-bold text-lg tracking-tight">¿Necesitas registrar algo nuevo?</h4>
          <p className="text-slate-400 text-sm mt-1">Accede directamente a los formularios de ingreso rápido de inventario.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Link href="/nuevo-equipo" className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition shadow-sm">
            <Plus className="w-4 h-4" /> Equipo
          </Link>
          <Link href="/perifericos/nuevo" className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Periférico
          </Link>
        </div>
      </div>

    </div>
  );
}