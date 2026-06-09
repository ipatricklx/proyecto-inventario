'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';

export default function PapeleraPerifericosPage() {
  const [eliminados, setEliminados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    cargarEliminados();
  }, []);

  async function cargarEliminados() {
    setLoading(true);
    // 👈 Solo traemos los que tienen una fecha en deleted_at
    const { data, error } = await supabase
      .from('perifericos')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) {
      alert('Error al cargar la papelera: ' + error.message);
    } else if (data) {
      setEliminados(data);
    }
    setLoading(false);
  }

  // Función para calcular los días restantes
  const calcularDiasRestantes = (fechaEliminacion: string, diasMaximos = 30): number => {
    if (!fechaEliminacion) return 0;
    
    const fechaBorrado = new Date(fechaEliminacion);
    const fechaLimite = new Date(fechaBorrado.getTime());
    fechaLimite.setDate(fechaLimite.getDate() + diasMaximos);
    
    const hoy = new Date();
    const diferenciaMilisegundos = fechaLimite.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    
    return diasRestantes < 0 ? 0 : diasRestantes;
  };

  async function restaurarPeriferico(id: string) {
    const confirmacion = window.confirm("¿Restaurar este periférico y devolverlo al inventario activo?");
    if (!confirmacion) return;

    // Para restaurar, simplemente volvemos deleted_at a NULL
    const { error } = await supabase
      .from('perifericos')
      .update({ deleted_at: null })
      .eq('id_periferico', id);

    if (error) {
      alert('Error al restaurar: ' + error.message);
    } else {
      cargarEliminados(); // Recargamos la lista
    }
  }

  async function eliminarDefinitivamente(id: string) {
    const confirmacion = window.confirm("⚠️ ADVERTENCIA: Esto borrará el periférico de la base de datos para siempre. ¿Continuar?");
    if (!confirmacion) return;

    // Aquí sí hacemos un DELETE real
    const { error } = await supabase
      .from('perifericos')
      .delete()
      .eq('id_periferico', id);

    if (error) {
      alert('Error al eliminar permanentemente: ' + error.message);
    } else {
      cargarEliminados(); // Recargamos la lista
    }
  }

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-red-800 flex items-center gap-2">
            <Trash2 className="w-6 h-6" /> Papelera de Periféricos
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Los elementos aquí se eliminarán definitivamente después de 30 días.
          </p>
        </div>
        <Link href="/perifericos" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
          Volver a Inventario
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando elementos eliminados...</div>
      ) : eliminados.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
          La papelera está vacía.
        </div>
      ) : (
        <div className="space-y-4">
          {eliminados.map((item) => {
            const diasQuedan = calcularDiasRestantes(item.deleted_at);

            return (
              <div key={item.id_periferico} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-bold text-gray-800">{item.tipo_periferico} - {item.marca || 'Sin marca'}</h4>
                  <p className="text-xs text-gray-500 font-mono mt-1">SBN: {item.cod_patrimonio_azul || item.cod_patrimonio_verde || 'S/N'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Badge de Días Restantes */}
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                    diasQuedan <= 5 
                      ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {diasQuedan === 0 ? 'Se elimina hoy' : `Quedan ${diasQuedan} días`}
                  </span>

                  {/* Acciones */}
                  <button 
                    onClick={() => restaurarPeriferico(item.id_periferico)}
                    className="flex items-center gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                  </button>
                  <button 
                    onClick={() => eliminarDefinitivamente(item.id_periferico)}
                    className="text-xs text-gray-400 hover:text-red-600 font-semibold px-2 py-1.5 transition underline"
                  >
                    Borrar ahora
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}