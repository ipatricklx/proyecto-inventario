'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function DetallesEquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [equipo, setEquipo] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDatos();
  }, [id]);

  async function getDatos() {
    // 1. Obtener detalles del equipo con su ubicación
    const { data: equipoData } = await supabase
      .from('equipos')
      .select('*, ubicaciones(servicio, area)')
      .eq('id_equipo', Number(id))
      .single();

    if (equipoData) setEquipo(equipoData);

    // 2. Obtener historial técnico del equipo
    const { data: historialData } = await supabase
      .from('estados_equipo')
      .select('*')
      .eq('id_equipo', Number(id))
      .order('fecha', { ascending: false }); // Asumiendo que la columna se llama 'fecha'

    if (historialData) setHistorial(historialData);
    
    setLoading(false);
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Cargando ficha técnica...</div>;
  if (!equipo) return <div className="text-center py-20 text-red-500 font-bold">Error: Equipo no encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">Ficha Técnica del Equipo</h2>
          <p className="text-gray-500 mt-1">
            Patrimonio: <span className="font-bold text-blue-600">{equipo.cod_patrimonio}</span> | 
            Estado Actual: <span className="font-bold ml-1 px-2 py-0.5 bg-gray-200 rounded">{equipo.estado}</span>
          </p>
        </div>
        <div className="space-x-3">
          <Link href="/equipos" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
            Volver
          </Link>
          <Link href={`/editar-equipo/${id}`} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition shadow-sm">
            Editar Equipo
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: DATOS Y HARDWARE */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TARJETA: DATOS GENERALES */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">📄 Información General</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Tipo de Equipo</p><p className="font-bold">{equipo.tipo_equipo}</p></div>
              <div><p className="text-gray-500">Marca / Modelo</p><p className="font-bold">{equipo.marca || 'N/A'} {equipo.modelo ? `- ${equipo.modelo}` : ''}</p></div>
              <div><p className="text-gray-500">Número de Serie</p><p className="font-mono text-gray-700">{equipo.numero_serie || 'N/A'}</p></div>
              <div><p className="text-gray-500">Origen de Patrimonio</p><p className="font-bold">{equipo.origen_patrimonio}</p></div>
              <div className="col-span-2">
                <p className="text-gray-500">Ubicación Física</p>
                <p className="font-bold text-blue-700">
                  {equipo.ubicaciones ? `${equipo.ubicaciones.servicio} (${equipo.ubicaciones.area})` : 'Almacén / Sin Asignar'}
                </p>
              </div>
            </div>
          </div>

          {/* TARJETA: HARDWARE Y RED */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">⚙️ Hardware y Red</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Procesador</p><p className="font-medium">{equipo.procesador || 'N/A'}</p></div>
              <div><p className="text-gray-500">Memoria RAM</p><p className="font-medium">{equipo.memoria_ram || 'N/A'}</p></div>
              <div><p className="text-gray-500">Almacenamiento</p><p className="font-medium">{equipo.almacenamiento || 'N/A'}</p></div>
              <div><p className="text-gray-500">Nombre en Red</p><p className="font-mono font-medium">{equipo.nombre_red_pc || 'N/A'}</p></div>
              <div><p className="text-gray-500">Dirección IP</p><p className="font-mono text-blue-600 font-bold">{equipo.direccion_ip || 'DHCP/N/A'}</p></div>
              <div><p className="text-gray-500">Dirección MAC</p><p className="font-mono text-gray-600">{equipo.direccion_mac || 'N/A'}</p></div>
            </div>
          </div>

          {/* TARJETA: SOFTWARE */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">💻 Software y Soporte</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Sistema Operativo</p><p className="font-medium">{equipo.sistema_operativo || 'N/A'}</p></div>
              <div><p className="text-gray-500">Antivirus</p><p className="font-medium">{equipo.antivirus || 'N/A'}</p></div>
              <div className="col-span-2"><p className="text-gray-500">Clave VNC (Acceso Remoto)</p><p className="font-mono bg-gray-100 px-2 py-1 inline-block rounded text-red-600 tracking-wider">{equipo.clave_vnc || 'No registrada'}</p></div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">📜 Bitácora Histórica</h3>
            
            {historial.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">No hay registros históricos para este equipo.</p>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {historial.map((hito, index) => (
                  <div key={hito.id_estado || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-blue-500 shrink-0 shadow z-10 ml-0 md:mx-auto"></div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg border border-gray-100 bg-gray-50 shadow-sm text-sm">
                      <div className="flex justify-between mb-1">
                        <span className={`font-bold ${hito.tipo_estado === 'BAJA' ? 'text-red-600' : 'text-blue-600'}`}>{hito.tipo_estado}</span>
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(hito.fecha || hito.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs mt-1">{hito.motivo || 'Cambio de estado general.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}