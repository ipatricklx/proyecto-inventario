'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PapeleraEquiposPage() {
  const [eliminados, setEliminados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEliminados();
  }, []);

  async function cargarEliminados() {
    setLoading(true);
    const { data, error } = await supabase
      .from('equipos')
      .select('*, ubicaciones(servicio, area)')
      .not('deleted_at', 'is', null) // 🔥 Trae solo los que están en la papelera
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Error al cargar la papelera:', error);
    } else if (data) {
      setEliminados(data);
    }
    setLoading(false);
  }

  const calcularDiasRestantes = (fechaEliminadoStr: string) => {
    const fechaEliminado = new Date(fechaEliminadoStr);
    const fechaLimite = new Date(fechaEliminado.getTime() + 30 * 24 * 60 * 60 * 1000);
    const hoy = new Date();
    
    const diferenciaTiempo = fechaLimite.getTime() - hoy.getTime();
    const dias = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
    return dias > 0 ? dias : 0;
  };

  const handleRestaurar = async (id: number, patrimonio: string) => {
    const confirmacion = window.confirm(`¿Deseas restaurar el equipo ${patrimonio} al inventario activo?`);
    if (!confirmacion) return;

    const { error } = await supabase
      .from('equipos')
      .update({ deleted_at: null }) // Quita la marca de tiempo para activarlo de nuevo
      .eq('id_equipo', id);

    if (error) {
      alert('Error al restaurar: ' + error.message);
    } else {
      alert('Equipo restaurado exitosamente.');
      setEliminados(eliminados.filter(e => e.id_equipo !== id));
    }
  };

  const handleBorrarDefinitivo = async (id: number, patrimonio: string) => {
    const confirmacion = window.confirm(`⚠️ ADVERTENCIA CRÍTICA: ¿Estás seguro de eliminar PERMANENTEMENTE el equipo ${patrimonio}? Esta acción no se puede deshacer.`);
    if (!confirmacion) return;

    // Ejecuta la consulta de borrado directo
    const { data, error } = await supabase
      .from('equipos')
      .delete()
      .eq('id_equipo', id)
      .select();

    if (error) {
      alert('Error al eliminar permanentemente: ' + error.message);
    } else if (!data || data.length === 0) {
      alert('⚠️ No se eliminó el registro. Verifica las políticas RLS de DELETE o restricciones de llaves foráneas.');
    } else {
      alert('Equipo purgado por completo del sistema.');
      setEliminados(eliminados.filter(e => e.id_equipo !== id));
    }
  };

  return (
    <div className="animate-fadeIn text-gray-900 p-4 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-600 mb-1 font-bold text-sm uppercase tracking-wider">
            <span>🗑️</span> Depósito de Eliminados Alterno
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Papelera de Reciclaje — Equipos</h2>
          <p className="text-gray-500 text-sm">Los equipos permanecerán aquí por un máximo de 30 días antes de ser purgados automáticamente.</p>
        </div>
        <Link href="/equipos" className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all font-bold text-sm shadow-sm">
          ⬅️ Volver a Equipos
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-x-auto border border-red-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-red-50">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-bold text-red-700 uppercase">Patrimonio</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-red-700 uppercase">Equipo</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-red-700 uppercase">Marca/Modelo</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-red-700 uppercase">Última Ubicación</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-red-700 uppercase">Días Restantes</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-red-700 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400 font-medium">Buscando eliminados...</td></tr>
            ) : eliminados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400 italic">La papelera de equipos está vacía.</td></tr>
            ) : (
              eliminados.map((item) => {
                const diasQueLeQuedan = calcularDiasRestantes(item.deleted_at);
                return (
                  <tr key={item.id_equipo} className="hover:bg-red-50/30 transition-colors opacity-90">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-700">
                      <div>🔵 {item.cod_patrimonio || 'S/P'}</div>
                      {item.cod_patrimonio_verde && <div className="text-green-600 mt-1">🟢 {item.cod_patrimonio_verde}</div>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{item.tipo_equipo}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{item.marca} <span className="text-gray-400 ml-1">{item.modelo}</span></td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.ubicaciones ? `${item.ubicaciones.servicio} (${item.ubicaciones.area})` : 'No registrada'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${
                        diasQueLeQuedan <= 5 ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                      }`}>
                        ⏳ {diasQueLeQuedan} {diasQueLeQuedan === 1 ? 'día' : 'días'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-bold space-x-2">
                      <button 
                        onClick={() => handleRestaurar(item.id_equipo, item.cod_patrimonio)} 
                        className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        ♻️ Recuperar
                      </button>
                      <button 
                        onClick={() => handleBorrarDefinitivo(item.id_equipo, item.cod_patrimonio)} 
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        🔥 Borrar Ahora
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
