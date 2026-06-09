'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  IdCard, 
  Network, 
  Mail, 
  Phone, 
  ShieldAlert, 
  Monitor, 
  Calendar, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export default function DetalleUsuarioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [usuario, setUsuario] = useState<any>(null);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      cargarDatosUsuario();
    } else {
      router.push('/usuarios'); 
    }
  }, [id]);

  async function cargarDatosUsuario() {
    setLoading(true);

    // 1. Cargar datos del perfil del usuario
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_usuario', parseInt(id!))
      .single();

    if (userError) {
      alert('Error al cargar el usuario: ' + userError.message);
      router.push('/usuarios');
      return;
    }
    if (userData) setUsuario(userData);

    // 2. Cargar historial de asignaciones
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

  // Helper para formatear la fecha de forma segura
  const formatearFecha = (fechaString: string) => {
    if (!fechaString) return 'S/F';
    const fecha = new Date(fechaString);
    return isNaN(fecha.getTime()) ? 'Fecha inválida' : fecha.toLocaleDateString();
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Cargando perfil del usuario...</div>;
  if (!usuario) return <div className="text-center py-20 text-red-500 font-bold">Usuario no encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Perfil del Personal</h2>
          <p className="text-gray-500 text-sm mt-1">Detalles de contacto y responsabilidades de hardware.</p>
        </div>
        <Link href="/usuarios" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition shadow-xs w-full sm:w-auto justify-center">
          <ArrowLeft className="w-4 h-4" /> Volver al Directorio
        </Link>
      </div>

      {/* TARJETA DE PERFIL SUPERIOR */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold shrink-0 border border-blue-100 uppercase">
          {usuario.nombres ? usuario.nombres.charAt(0) : ''}{usuario.apellidos ? usuario.apellidos.charAt(0) : ''}
        </div>
        
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-4 w-full text-sm">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase flex items-center gap-1.5 mb-0.5">
              <User className="w-3.5 h-3.5 text-gray-400" /> Apellidos y Nombres
            </p>
            <p className="font-bold text-gray-800 text-base">{usuario.apellidos}, {usuario.nombres}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase flex items-center gap-1.5 mb-0.5">
              <IdCard className="w-3.5 h-3.5 text-gray-400" /> Código Planilla
            </p>
            <p className="font-mono font-bold text-gray-700">{usuario.cod_planilla || 'No registrado'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase flex items-center gap-1.5 mb-0.5">
              <Network className="w-3.5 h-3.5 text-gray-400" /> Usuario de Red (Windows)
            </p>
            <p className="font-mono font-bold text-blue-700 bg-blue-50/60 inline-block px-2 py-0.5 rounded border border-blue-100 text-xs mt-0.5">
              {usuario.usuario_red_windows || 'No registrado'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase flex items-center gap-1.5 mb-0.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Institucional
            </p>
            <p className="font-medium text-gray-600">{usuario.email_institucional || 'Sin correo'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase flex items-center gap-1.5 mb-0.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> Anexo telefónico
            </p>
            <p className="font-medium text-gray-700">{usuario.anexo || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase flex items-center gap-1.5 mb-0.5">
              <ShieldAlert className="w-3.5 h-3.5 text-gray-400" /> Estado en Sistema
            </p>
            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs font-bold border ${
              usuario.activo 
                ? 'bg-green-50 text-green-700 border-green-100' 
                : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              {usuario.activo ? 'ACTIVO' : 'CESADO / INACTIVO'}
            </span>
          </div>
        </div>
      </div>

      {/* TABLA DE HISTORIAL DE ASIGNACIONES */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
            <Monitor className="w-5 h-5 text-indigo-500" /> Historial de Equipos Asignados
          </h3>
          <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full border border-slate-300">
            Total registros: {asignaciones.length}
          </span>
        </div>

        {asignaciones.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300 stroke-[1.5]" />
            <p className="text-sm font-medium">Este usuario no tiene equipos asignados hoy ni en su historial.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Equipo (PC Red)</th>
                  <th className="p-3.5">Tipo / Marca</th>
                  <th className="p-3.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fecha de Asignación</th>
                  <th className="p-3.5 pr-5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {asignaciones.map((asig) => (
                  <tr key={asig.id_asignacion} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* COLUMNA 1: Nombre del Equipo */}
                    <td className="p-3.5 pl-5 font-mono font-bold">
                      {asig.equipos?.nombre_red_pc ? (
                        <span className="text-blue-700">{asig.equipos.nombre_red_pc}</span>
                      ) : (
                        <span className="text-red-500/80 italic flex items-center gap-1.5">
                          ⚠️ Equipo Eliminado
                        </span>
                      )}
                    </td>

                    {/* COLUMNA 2: Tipo y Marca */}
                    <td className="p-3.5 text-gray-600 font-medium">
                      {asig.equipos ? (
                        <>{asig.equipos.tipo_equipo} {asig.equipos.marca ? `· ${asig.equipos.marca}` : ''}</>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Registro purgado</span>
                      )}
                    </td>

                    {/* COLUMNA 3: Fecha */}
                    <td className="p-3.5 text-gray-600 font-medium">
                      {formatearFecha(asig.fecha_asignacion)}
                    </td>

                    {/* COLUMNA 4: Estado (Fuerza a 'Histórico' si el equipo ya no existe) */}
                    <td className="p-3.5 pr-5 text-center">
                      {asig.activo && asig.equipos ? (
                        <span className="inline-flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> Actual
                        </span>           
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-400 text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-xs">
                          <Clock className="w-3 h-3" /> Histórico
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