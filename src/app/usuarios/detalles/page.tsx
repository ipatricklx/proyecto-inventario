'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation'; // 👈 Importamos useSearchParams
import Link from 'next/link';

export default function DetalleUsuarioPage() {
  const router = useRouter();
  
  // 👈 Capturamos el ?id= de la URL de forma limpia
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [usuario, setUsuario] = useState<any>(null);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      cargarDatosUsuario();
    } else {
      // Si entran directo a /detalles sin ID, redirigimos al directorio
      router.push('/usuarios'); 
    }
  }, [id]);

  async function cargarDatosUsuario() {
    setLoading(true);

    // 1. Cargar datos del perfil del usuario (convertimos el id a entero)
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_usuario', parseInt(id!))
      .single();

    if (userError) {
      alert('Error al cargar el usuario: ' + userError.message);
      router.push('/personal');
      return;
    }
    if (userData) setUsuario(userData);

    // 2. Cargar historial de asignaciones cruzando con la tabla 'equipos'
    const { data: asigData } = await supabase
      .from('asignaciones')
      .select(`
        id_asignacion,
        fecha_asignacion,
        activo,
        equipos (nombre_red_pc, tipo_equipo, marca, modelo)
      `)
      .eq('id_usuario', parseInt(id!))
      .order('fecha_asignacion', { ascending: false });

    if (asigData) setAsignaciones(asigData);

    setLoading(false);
  }

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium">Cargando perfil del usuario...</div>;
  if (!usuario) return <div className="text-center py-20 text-red-500 font-bold">Usuario no encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">Perfil del Personal</h2>
          <p className="text-gray-500 text-sm mt-1">Detalles de contacto y responsabilidades de hardware.</p>
        </div>
        <Link href="/personal" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition">
          Volver al Directorio
        </Link>
      </div>

      {/* TARJETA DE PERFIL SUPERIOR */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
          {usuario.nombres ? usuario.nombres.charAt(0) : ''}{usuario.apellidos ? usuario.apellidos.charAt(0) : ''}
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Apellidos y Nombres</p>
            <p className="font-bold text-lg text-gray-800">{usuario.apellidos}, {usuario.nombres}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Código Planilla</p>
            <p className="font-mono font-medium text-gray-700">{usuario.cod_planilla || 'No registrado'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Usuario de Red (Windows)</p>
            <p className="font-mono text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100">{usuario.usuario_red_windows || 'No registrado'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mt-2">Email Institucional</p>
            <p className="text-sm text-gray-600">{usuario.email_institucional || 'Sin correo'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mt-2">Anexo</p>
            <p className="text-sm text-gray-600 flex items-center gap-1">📞 {usuario.anexo || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mt-2">Estado en Sistema</p>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold ${usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {usuario.activo ? 'ACTIVO' : 'CESADO / INACTIVO'}
            </span>
          </div>
        </div>
      </div>

      {/* TABLA DE HISTORIAL DE ASIGNACIONES */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            📋 Historial de Equipos Asignados
          </h3>
          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
            Total registros: {asignaciones.length}
          </span>
        </div>

        {asignaciones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2">🖥️</p>
            <p>Este usuario no tiene equipos registrados en su historial.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-sm">
                  <th className="p-3 font-semibold">Equipo (PC Red)</th>
                  <th className="p-3 font-semibold">Tipo / Marca</th>
                  <th className="p-3 font-semibold">Fecha de Asignación</th>
                  <th className="p-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {asignaciones.map((asig) => (
                  <tr key={asig.id_asignacion} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-700">
                      {asig.equipos?.nombre_red_pc || 'Desconocido'}
                    </td>
                    <td className="p-3 text-gray-600">
                      {asig.equipos?.tipo_equipo} {asig.equipos?.marca ? `- ${asig.equipos.marca}` : ''}
                    </td>
                    <td className="p-3 text-gray-600">
                      {new Date(asig.fecha).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {asig.activo ? (
                        <span className="bg-green-500 text-white px-2.5 py-1 rounded text-xs font-bold shadow-sm">
                          Actual
                        </span>
                      ) : (
                        <span className="bg-gray-400 text-white px-2.5 py-1 rounded text-xs font-bold shadow-sm">
                          Histórico
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}