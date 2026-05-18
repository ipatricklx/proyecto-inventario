'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function EquiposPage() {
  const [equipos, setEquipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  useEffect(() => {
    getEquipos();
  }, []);

  async function getEquipos() {
    const { data, error } = await supabase
      .from('equipos')
      .select(`
        *,
        ubicaciones (servicio, area)
      `)
      .eq('activo', true)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error al cargar equipos:', error);
    } else if (data) {
      setEquipos(data);
    }
    setLoading(false);
  }

  const handleDelete = async (id_equipo: number, cod_patrimonio: string) => {
    const confirmacion = window.confirm(`¿Estás seguro de que deseas dar de baja y ocultar el equipo patrimonial ${cod_patrimonio}?`);
    if (!confirmacion) return;

    const { error: errorEquipo } = await supabase
      .from('equipos')
      .update({ activo: false, estado: 'BAJA' })
      .eq('id_equipo', id_equipo);
    
    if (errorEquipo) {
      alert('Error al desactivar el activo: ' + errorEquipo.message);
      return;
    }

    setEquipos(equipos.filter(eq => eq.id_equipo !== id_equipo));
  };

  const getColorEstado = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'OPERATIVO': return 'bg-green-100 text-green-800 border-green-200';
      case 'GARANTIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OBSOLETO': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'BAJA': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Lógica de filtrado en el frontend
  const equiposFiltrados = equipos.filter((equipo) => {
    const term = searchTerm.toLowerCase();
    
    const matchSearch = 
      equipo.cod_patrimonio?.toLowerCase().includes(term) ||
      equipo.cod_patrimonio_verde?.toLowerCase().includes(term) || // 👈 Búsqueda por código verde
      equipo.marca?.toLowerCase().includes(term) ||
      equipo.modelo?.toLowerCase().includes(term) ||
      equipo.ubicaciones?.servicio?.toLowerCase().includes(term) ||
      equipo.ubicaciones?.area?.toLowerCase().includes(term);
    
    const matchTipo = filterTipo ? equipo.tipo_equipo?.toUpperCase() === filterTipo.toUpperCase() : true;
    const matchEstado = filterEstado ? equipo.estado?.toUpperCase() === filterEstado.toUpperCase() : true;

    return matchSearch && matchTipo && matchEstado;
  });

  return (
    <div className="animate-fadeIn text-gray-900 p-4 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Panel de Equipos</h2>
          <p className="text-gray-500 text-sm">Directorio patrimonial y control de estaciones de trabajo vigentes.</p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/equipos/papelera" className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm flex items-center gap-2 shadow-sm">
            <span>🗑️</span> Ver Papelera
          </Link>
          <Link href="/nuevo-equipo" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md font-bold text-sm flex items-center gap-2">
            <span>➕</span> Nuevo Equipo
          </Link>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar (Patrimonio, Marca, Modelo, Ubicación)</label>
          <input 
            type="text" 
            placeholder="Ej: 01105291, 00539420, Dell, Emergencia..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Equipo</label>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="">Todos los tipos</option>
            <option value="CPU">CPU</option>
            <option value="Laptop">Laptop</option>
            <option value="Notebook">Notebook</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-500 mb-1">Estado Técnico</label>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="">Todos los estados</option>
            <option value="OPERATIVO">OPERATIVO</option>
            <option value="GARANTIA">EN GARANTÍA</option>
            <option value="OBSOLETO">OBSOLETO</option>
          </select>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white shadow-sm rounded-xl overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patrimonio</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Equipo</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ubicación</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estado Técnico</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400 font-medium">Cargando base de datos...</td></tr>
            ) : equiposFiltrados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-500 font-medium">No se encontraron equipos con esos filtros.</td></tr>
            ) : (
              equiposFiltrados.map((equipo) => (
                <tr key={equipo.id_equipo} className="hover:bg-gray-50 transition-colors">
                  
                  {/* 👈 AQUÍ SE MUESTRAN AMBOS CÓDIGOS DE PATRIMONIO CON COLORES */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {equipo.cod_patrimonio && (
                      <div className="font-bold text-blue-700 flex items-center gap-1.5" title="Código Azul/Principal">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        {equipo.cod_patrimonio}
                      </div>
                    )}
                    {equipo.cod_patrimonio_verde && (
                      <div className="font-bold text-green-600 flex items-center gap-1.5 mt-1.5" title="Código Verde">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        {equipo.cod_patrimonio_verde}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{equipo.tipo_equipo}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{equipo.marca} <span className="text-gray-400 ml-1">{equipo.modelo}</span></td>
                  
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {equipo.ubicaciones ? (
                      <span className="font-medium">{equipo.ubicaciones.servicio} <span className="text-gray-400 text-xs">({equipo.ubicaciones.area})</span></span>
                    ) : (
                      <span className="text-gray-400 italic">No asignada</span>
                    )}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getColorEstado(equipo.estado)}`}>
                      {equipo.estado || 'NO DEFINIDO'}
                    </span>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                    <Link href={`/detalles-equipo/${equipo.id_equipo}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Ver Detalles">👁️</Link>
                    <Link href={`/editar-equipo/${equipo.id_equipo}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Editar Equipo">⚙️</Link>
                    <button onClick={() => handleDelete(equipo.id_equipo, equipo.cod_patrimonio)} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Eliminar Equipo">🗑️</button>
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