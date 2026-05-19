'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function DetallePerifericoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [periferico, setPeriferico] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      cargarDetalles();
    } else {
      setLoading(false);
    }
  }, [id]);

  async function cargarDetalles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('perifericos')
      .select('*, equipos(nombre_red_pc)')
      .eq('id_periferico', id)
      .single();

    if (error) {
      alert('Error al cargar los detalles: ' + error.message);
      router.push('/perifericos');
      return;
    }

    if (data) {
      setPeriferico(data);
    }
    setLoading(false);
  }

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium">Cargando ficha técnica...</div>;
  if (!periferico) return <div className="text-center py-20 text-red-500 font-bold">Error: Periférico no encontrado o falta el ID.</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      
      {/* CABECERA (Adaptada al estilo de equipos) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">Ficha Técnica del Periférico</h2>
          <div className="text-gray-500 mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span>Tipo:</span> 
            <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded uppercase">{periferico.tipo_periferico}</span> 
            
            {periferico.cod_patrimonio_verde && (
              <>
                <span className="text-gray-300">|</span>
                <span>Etiqueta Verde:</span>
                <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">{periferico.cod_patrimonio_verde}</span>
              </>
            )}

            {periferico.cod_patrimonio_azul && (
              <>
                <span className="text-gray-300">|</span>
                <span>Etiqueta Azul:</span>
                <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{periferico.cod_patrimonio_azul}</span>
              </>
            )}
            
            <span className="text-gray-300">|</span>
            <span>Estado:</span> 
            <span className="font-bold px-2 py-0.5 bg-gray-200 text-gray-800 rounded">{periferico.estado || periferico.estado_fisico || 'OPERATIVO'}</span>
          </div>
        </div>
        <div className="space-x-3 shrink-0 flex">
          <Link href="/perifericos" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
            Volver
          </Link>
          <Link href={`/perifericos/editar/${periferico.id_periferico}`} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition shadow-sm">
            Editar Periférico
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: DATOS Y ASIGNACIÓN (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TARJETA: DATOS GENERALES */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">📄 Información General</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Tipo de Componente</p><p className="font-bold">{periferico.tipo_periferico}</p></div>
              <div><p className="text-gray-500">Marca / Modelo</p><p className="font-bold">{periferico.marca || 'N/A'} {periferico.modelo ? `- ${periferico.modelo}` : ''}</p></div>
              <div><p className="text-gray-500">Número de Serie</p><p className="font-mono text-gray-700">{periferico.n_serie || periferico.numero_serie || 'N/A'}</p></div>
              <div>
                <p className="text-gray-500">Estado Técnico</p>
                <p className="font-bold text-gray-800">{periferico.estado || periferico.estado_fisico || 'OPERATIVO'}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Cód. Etiqueta Verde</p>
                <p className={`font-bold ${periferico.cod_patrimonio_verde ? 'text-green-600' : 'text-gray-400'}`}>
                  {periferico.cod_patrimonio_verde || 'Sin etiqueta verde'}
                </p>
              </div>
               <div>
                <p className="text-gray-500">Cód. Etiqueta Azul</p>
                <p className={`font-bold ${periferico.cod_patrimonio_azul || periferico.cod_patrimonio ? 'text-blue-700' : 'text-gray-400'}`}>
                  {periferico.cod_patrimonio_azul || periferico.cod_patrimonio || 'Sin etiqueta azul'}
                </p>
              </div>
            </div>
          </div>

          {/* TARJETA: DETALLES TÉCNICOS */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">⚙️ Hardware Especifico</h3>
            <div className="text-sm">
              <p className="text-gray-500 mb-1">Detalle / Capacidad / Conexión</p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700">
                {periferico.detalle_tecnico || <span className="italic text-gray-400">No hay detalles técnicos específicos registrados para este componente.</span>}
              </div>
            </div>
          </div>

          {/* TARJETA: ASIGNACIÓN */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">👤 Asignación Actual</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <p className="text-sm text-gray-500 font-bold mb-2">Computadora (Red)</p>
                {periferico.equipos ? (
                  <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="text-3xl">💻</div>
                    <div>
                      <p className="font-bold text-blue-900">{periferico.equipos.nombre_red_pc}</p>
                      <p className="text-xs text-blue-700">Hardware vinculado operativamente.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <div className="text-3xl">📦</div>
                    <div>
                      <p className="font-bold text-amber-900">En Almacén / Stock Libre</p>
                      <p className="text-xs text-amber-700">No está conectado a ninguna PC en este momento.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: LOGÍSTICA (lg:col-span-1) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">📦 Logística y Almacén</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-bold mb-2">Observaciones de Inventario</p>
                {periferico.observaciones_almacen ? (
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200">
                    {periferico.observaciones_almacen}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                    Sin observaciones logísticas registradas.
                  </p>
                )}
              </div>

              {/* Espacio para futuro historial si decides agregarlo a periféricos */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center italic">
                  ID Sistema: {periferico.id_periferico}
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}