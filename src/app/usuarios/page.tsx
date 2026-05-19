'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  useEffect(() => {
    getUsuarios();
  }, []);

  async function getUsuarios() {
    setLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('apellidos', { ascending: true });
      
    if (error) {
      console.error('Error al cargar usuarios:', error);
    } else if (data) {
      setUsuarios(data);
    }
    setLoading(false);
  }

  const handleDesactivar = async (id: number, textNombre: string) => {
    const confirmacion = window.confirm(`¿Estás seguro de dar de baja a ${textNombre}? Si tiene equipos asignados, estos mantendrán el registro histórico.`);
    if (!confirmacion) return;

    const { error } = await supabase.from('usuarios').update({ activo: false }).eq('id_usuario', id);
    if (error) { alert('Error: ' + error.message); return; }
    
    setUsuarios(usuarios.map(u => u.id_usuario === id ? { ...u, activo: false } : u));
  };

  const handleRestaurar = async (id: number, textNombre: string) => {
    const confirmacion = window.confirm(`¿Deseas reincorporar a ${textNombre} al sistema?`);
    if (!confirmacion) return;

    const { error } = await supabase.from('usuarios').update({ activo: true }).eq('id_usuario', id);
    if (error) { alert('Error: ' + error.message); return; }
    
    setUsuarios(usuarios.map(u => u.id_usuario === id ? { ...u, activo: true } : u));
  };

  const filtrados = usuarios.filter(u => {
    const term = searchTerm.toLowerCase();
    const coincideTexto = (
      u.nombres?.toLowerCase().includes(term) ||
      u.apellidos?.toLowerCase().includes(term) ||
      u.cod_planilla?.toLowerCase().includes(term) ||
      u.anexo?.toLowerCase().includes(term)
    );
    const coincideEstado = mostrarInactivos ? u.activo === false : u.activo !== false;
    return coincideTexto && coincideEstado;
  });

  return (
    <div className="animate-fadeIn text-gray-900 p-4 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Directorio de Personal</h2>
          <p className="text-gray-500 text-sm">Gestión de usuarios y responsables de equipos informáticos.</p>
        </div>
        <Link href="/usuarios/nuevo" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md font-bold text-sm flex items-center gap-2">
          <span>➕</span> Registrar Personal
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-2/3">
          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar por Apellidos, Nombres, Planilla o Anexo</label>
          <input 
            type="text" 
            placeholder="Ej: Zavala, Domingo, 14626282..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="w-full sm:w-auto flex items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={mostrarInactivos} onChange={() => setMostrarInactivos(!mostrarInactivos)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${mostrarInactivos ? 'bg-red-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${mostrarInactivos ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className={`ml-3 text-sm font-bold ${mostrarInactivos ? 'text-red-600' : 'text-gray-500'}`}>
              {mostrarInactivos ? '🗑️ Personal Cesado' : 'Ver Cesados'}
            </span>
          </label>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={mostrarInactivos ? "bg-red-50" : "bg-blue-50"}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Cód. Planilla</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Apellidos y Nombres</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Usuario Red</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Contacto</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Cargando personal...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No se encontraron registros.</td></tr>
            ) : (
              filtrados.map((user) => (
                <tr key={user.id_usuario} className={`hover:bg-gray-50 ${mostrarInactivos ? 'opacity-70' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-700">{user.cod_planilla || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <p className="font-bold text-blue-800">{user.apellidos}</p>
                    <p className="text-gray-600">{user.nombres}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600 bg-gray-50">{user.usuario_red_windows || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    {user.anexo && <p className="font-bold text-gray-700">📞 Ext: {user.anexo}</p>}
                    {user.email_institucional && <p className="text-gray-500">✉️ {user.email_institucional}</p>}
                    {!user.anexo && !user.email_institucional && <span className="text-gray-400 italic">Sin datos</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center space-x-2">
                    {!mostrarInactivos ? (
                      <>
                        {/* 👈 NUEVO: Enlace de inspección con Query Parameter (?id=) */}
                        <Link 
                          href={`/usuarios/detalles?id=${user.id_usuario}`} 
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" 
                          title="Ver equipos asignados"
                        >
                          👁️
                        </Link>
                        
                        <Link href={`/usuarios/editar/${user.id_usuario}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100" title="Editar">⚙️</Link>
                        <button onClick={() => handleDesactivar(user.id_usuario, user.nombres)} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100" title="Dar de baja">🗑️</button>
                      </>
                    ) : (
                      <button onClick={() => handleRestaurar(user.id_usuario, user.nombres)} className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold" title="Restaurar">
                        ♻️ Reincorporar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}