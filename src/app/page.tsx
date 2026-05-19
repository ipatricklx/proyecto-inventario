'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
      // 1. Consultas simultáneas a Supabase para máxima velocidad
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
        supabase.from('equipos').select('*', { count: 'exact', head: true }).not('id_usuario', 'is', null),
        // Estados específicos de equipos (Asegúrate de que coincidan con tus strings exactos en la BD)
        supabase.from('equipos').select('*', { count: 'exact', head: true }).eq('estado', 'GARANTIA'),
        supabase.from('equipos').select('*', { count: 'exact', head: true }).eq('estado', 'OBSOLETO'),
        supabase.from('equipos').select('*', { count: 'exact', head: true }).eq('estado', 'BAJA'),
        // Estados específicos de periféricos
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-gray-900 animate-fadeIn">
      {/* SECCIÓN BIENVENIDA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Panel de Control</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen en tiempo real del inventario tecnológico de la institución.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition flex items-center gap-2"
        >
          🔄 Actualizar Datos
        </button>
      </div>

      {/* METRICAS PRINCIPALES (OPERATIVAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* TARJETA: EQUIPOS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Equipos</p>
            <h3 className="text-3xl font-black text-gray-800 mt-1">{metrics.totalEquipos}</h3>
            <p className="text-xs text-blue-600 font-medium mt-1">💻 {metrics.pcsEnUso} asignados a personal</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">🖥️</div>
        </div>

        {/* TARJETA: PERIFÉRICOS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Periféricos</p>
            <h3 className="text-3xl font-black text-gray-800 mt-1">{metrics.totalPerifericos}</h3>
            <Link href="/perifericos" className="text-xs text-gray-500 hover:underline inline-block mt-1">Ver listado →</Link>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">⌨️</div>
        </div>

        {/* TARJETA: USUARIOS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Activo</p>
            <h3 className="text-3xl font-black text-gray-800 mt-1">{metrics.totalUsuarios}</h3>
            <Link href="/personal" className="text-xs text-gray-500 hover:underline inline-block mt-1">Ver directorio →</Link>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">👥</div>
        </div>

        {/* TARJETA: % EFICIENCIA / USO */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tasa de Uso (PC)</p>
            <h3 className="text-3xl font-black text-gray-800 mt-1">
              {metrics.totalEquipos > 0 ? Math.round((metrics.pcsEnUso / metrics.totalEquipos) * 100) : 0}%
            </h3>
            <p className="text-xs text-gray-500 mt-1">Equipos en uso actual</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">📊</div>
        </div>
      </div>

      {/* SECCIÓN DE ALERTAS Y ESTADOS CRÍTICOS */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>⚠️</span> Estados de Soporte y Ciclo de Vida
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* BLOQUE: GARANTÍA */}
          <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200/60">
            <h4 className="font-bold text-amber-800 text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
              🛡️ En Garantía
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-xs border border-amber-100">
                <span className="text-sm font-medium text-gray-600">Equipos</span>
                <span className="font-bold text-lg text-amber-700">{metrics.equiposGarantia}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-xs border border-amber-100">
                <span className="text-sm font-medium text-gray-600">Periféricos</span>
                <span className="font-bold text-lg text-amber-700">{metrics.perifericosGarantia}</span>
              </div>
            </div>
          </div>

          {/* BLOQUE: OBSOLETO */}
          <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-200/60">
            <h4 className="font-bold text-orange-800 text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
              ⏳ Obsoletos / Reemplazo
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-xs border border-orange-100">
                <span className="text-sm font-medium text-gray-600">Equipos</span>
                <span className="font-bold text-lg text-orange-700">{metrics.equiposObsoletos}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-xs border border-orange-100">
                <span className="text-sm font-medium text-gray-600">Periféricos</span>
                <span className="font-bold text-lg text-orange-700">{metrics.perifericosObsoletos}</span>
              </div>
            </div>
          </div>

          {/* BLOQUE: DADOS DE BAJA */}
          <div className="bg-red-50/50 rounded-2xl p-5 border border-red-200/60">
            <h4 className="font-bold text-red-800 text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
              🚨 Histórico / Dados de Baja
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-xs border border-red-100">
                <span className="text-sm font-medium text-gray-600">Equipos Retirados</span>
                <span className="font-bold text-lg text-red-700">{metrics.equiposBaja}</span>
              </div>
              <div className="p-3 bg-red-100/40 rounded-xl text-center text-xs font-semibold text-red-700">
                Excluidos del inventario operativo activo.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ACCESOS RÁPIDOS MÓVILES */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h4 className="font-bold text-lg">¿Necesitas registrar algo nuevo?</h4>
          <p className="text-slate-400 text-sm mt-0.5">Accede directamente a los formularios de ingreso rápido.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/equipos/nuevo" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition">
            + Nuevo Equipo
          </Link>
          <Link href="/perifericos/nuevo" className="px-4 py-2 bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition">
            + Nuevo Periférico
          </Link>
        </div>
      </div>

    </div>
  );
}