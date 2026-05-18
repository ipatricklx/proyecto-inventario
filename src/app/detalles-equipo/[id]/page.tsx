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
    // 1. Obtener detalles del equipo con su ubicación y usuario asignado
    const { data: equipoData } = await supabase
      .from('equipos')
      .select(`
        *, 
        ubicaciones(servicio, area),
        usuarios(nombres, apellidos, anexo, email_institucional)
      `)
      .eq('id_equipo', Number(id))
      .single();

    if (equipoData) setEquipo(equipoData);

    // 2. Obtener historial técnico del equipo
    const { data: historialData } = await supabase
      .from('estados_equipo')
      .select('*')
      .eq('id_equipo', Number(id))
      .order('fecha', { ascending: false });

    if (historialData) setHistorial(historialData);
    
    setLoading(false);
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Cargando ficha técnica...</div>;
  if (!equipo) return <div className="text-center py-20 text-red-500 font-bold">Error: Equipo no encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">Ficha Técnica del Equipo</h2>
          <div className="text-gray-500 mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span>Patrimonio SBN:</span> 
            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{equipo.cod_patrimonio || 'N/A'}</span> 
            
            {/* Mostrar el código verde en la cabecera solo si existe */}
            {equipo.cod_patrimonio_verde && (
              <>
                <span className="text-gray-300">|</span>
                <span>Etiqueta Verde:</span>
                <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">{equipo.cod_patrimonio_verde}</span>
              </>
            )}
            
            <span className="text-gray-300">|</span>
            <span>Estado Actual:</span> 
            <span className="font-bold px-2 py-0.5 bg-gray-200 text-gray-800 rounded">{equipo.estado}</span>
          </div>
        </div>
        <div className="space-x-3 shrink-0">
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
              
              {/* Aquí reemplazamos "Origen de Patrimonio" por "Código Verde" para mantener la simetría */}
              <div>
                <p className="text-gray-500">Cód. Etiqueta Verde</p>
                <p className={`font-bold ${equipo.cod_patrimonio_verde ? 'text-green-600' : 'text-gray-400'}`}>
                  {equipo.cod_patrimonio_verde || 'Sin etiqueta verde'}
                </p>
              </div>
               <div>
                <p className="text-gray-500">Cód. Etiqueta Azul</p>
                <p className={`font-bold ${equipo.cod_patrimonio ? 'text-blue-700' : 'text-gray-400'}`}>
                  {equipo.cod_patrimonio || 'Sin etiqueta azul'}
                </p>
              </div>

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

          {/* NUEVA TARJETA: ASIGNACIÓN Y ACCESOS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">👤 Asignación y Permisos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card de Usuario */}
              <div>
                <p className="text-sm text-gray-500 font-bold mb-2">Usuario Responsable</p>
                {equipo.usuarios ? (
                  <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="text-3xl">👨‍💻</div>
                    <div>
                      <p className="font-bold text-blue-900">{equipo.usuarios.apellidos}, {equipo.usuarios.nombres}</p>
                      <p className="text-xs text-blue-700">Anexo: {equipo.usuarios.anexo || 'No registrado'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-500 italic text-sm">
                    Equipo libre / En almacén (Sin usuario asignado)
                  </div>
                )}
              </div>

              {/* Badges de Sistemas */}
              <div>
                <p className="text-sm text-gray-500 font-bold mb-2">Sistemas Instalados</p>
                <div className="flex flex-wrap gap-2">
                  {equipo.tiene_sap && <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs px-2.5 py-1 rounded-md font-bold">✔️ SAP</span>}
                  {equipo.tiene_ses && <span className="bg-green-100 text-green-800 border border-green-200 text-xs px-2.5 py-1 rounded-md font-bold">✔️ SES</span>}
                  {equipo.tiene_winepi && <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-2.5 py-1 rounded-md font-bold">✔️ WINEPI</span>}
                  {equipo.tiene_sinadef && <span className="bg-red-100 text-red-800 border border-red-200 text-xs px-2.5 py-1 rounded-md font-bold">✔️ SINADEF</span>}
                  {equipo.en_dominio && <span className="bg-slate-100 text-slate-800 border border-slate-300 text-xs px-2.5 py-1 rounded-md font-bold">🖥️ Dominio Local</span>}
                  {equipo.tiene_internet && <span className="bg-teal-100 text-teal-800 border border-teal-200 text-xs px-2.5 py-1 rounded-md font-bold">🌐 Internet Abierta</span>}
                  
                  {(!equipo.tiene_sap && !equipo.tiene_ses && !equipo.tiene_winepi && !equipo.tiene_sinadef && !equipo.en_dominio && !equipo.tiene_internet) && (
                    <span className="text-gray-400 italic text-sm">Equipo base (Sin configuraciones especiales)</span>
                  )}
                </div>
              </div>

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