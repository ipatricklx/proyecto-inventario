'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PerifericosPage() {
  const [perifericos, setPerifericos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  
  // Estados para los filtros desplegables
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    getPerifericos();
  }, []);

  async function getPerifericos() {
    setLoading(true);
    // Traemos el periférico y el nombre de red de la PC asignada
    const { data, error } = await supabase
      .from('perifericos')
      .select('*, equipos(nombre_red_pc)')
      .order('tipo_periferico', { ascending: true });
      
    if (error) {
      console.error('Error al cargar periféricos:', error);
    } else if (data) {
      setPerifericos(data);
    }
    setLoading(false);
  }

  const handleDesactivar = async (id: number, tipo: string, marca: string) => {
    const confirmacion = window.confirm(`¿Estás seguro de enviar a la papelera el periférico: ${tipo} ${marca}?`);
    if (!confirmacion) return;

    const { error } = await supabase.from('perifericos').update({ activo: false }).eq('id_periferico', id);
    if (error) { alert('Error: ' + error.message); return; }
    
    setPerifericos(perifericos.map(p => p.id_periferico === id ? { ...p, activo: false } : p));
  };

  const handleRestaurar = async (id: number, tipo: string) => {
    const confirmacion = window.confirm(`¿Deseas restaurar este ${tipo} de la papelera?`);
    if (!confirmacion) return;

    const { error } = await supabase.from('perifericos').update({ activo: true }).eq('id_periferico', id);
    if (error) { alert('Error: ' + error.message); return; }
    
    setPerifericos(perifericos.map(p => p.id_periferico === id ? { ...p, activo: true } : p));
  };

  // LÓGICA DE FILTRADO OPTIMIZADA Y CORREGIDA
  const filtrados = perifericos.filter(p => {
    const term = searchTerm.toLowerCase();
    
    // 1. Filtro por texto general
    const coincideTexto = (
      (p.tipo_periferico || '').toLowerCase().includes(term) ||
      (p.marca || '').toLowerCase().includes(term) ||
      (p.modelo || '').toLowerCase().includes(term) ||
      (p.n_serie || '').toLowerCase().includes(term) ||
      (p.numero_serie || '').toLowerCase().includes(term) ||
      (p.cod_patrimonio_verde || '').toLowerCase().includes(term) ||
      (p.cod_patrimonio || '').toLowerCase().includes(term) ||
      (p.equipos?.nombre_red_pc || '').toLowerCase().includes(term)
    );
    
    // 2. Filtro por estado activo/inactivo (Papelera)
    const coincideActivo = mostrarInactivos ? p.activo === false : p.activo !== false;
    
    // 3. CORRECCIÓN: Filtro por Tipo de Periférico (Ignora mayúsculas/minúsculas y espacios invisibles)
    const tipoPerifericoNormalizado = (p.tipo_periferico || '').trim().toUpperCase();
    const filtroTipoNormalizado = filtroTipo.trim().toUpperCase();
    const coincideTipo = filtroTipo === '' || tipoPerifericoNormalizado === filtroTipoNormalizado;
    
    // 4. Filtro por Estado Técnico
    const estadoActual = (p.estado || p.estado_fisico || '').trim().toUpperCase();
    const filtroEstadoNormalizado = filtroEstado.trim().toUpperCase();
    const coincideEstadoTecnico = filtroEstado === '' || estadoActual === filtroEstadoNormalizado;

    return coincideTexto && coincideActivo && coincideTipo && coincideEstadoTecnico;
  });

  // Formato oficial idéntico al de EQUIPOS
  const getBadgeEstado = (estado: string) => {
    const est = (estado || '').toUpperCase();
    switch(est) {
      case 'OPERATIVO': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'GARANTIA': 
      case 'EN GARANTÍA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OBSOLETO': 
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'BAJA': 
      case 'DE BAJA':
        return 'bg-red-100 text-red-800 border-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="animate-fadeIn text-gray-900 p-4 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Control de Periféricos</h2>
          <p className="text-gray-500 text-sm">Monitores, Impresoras, UPS y componentes informáticos.</p>
        </div>
        <Link href="/perifericos/nuevo" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md font-bold text-sm flex items-center gap-2">
          <span>➕</span> Registrar Periférico
        </Link>
      </div>

      {/* SECCIÓN DE FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4 items-end justify-between">
        <div className="w-full lg:w-2/5">
          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar por código, serie o PC asignada</label>
          <input 
            type="text" 
            placeholder="Ej: DELL, V203P, ESS206..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtro por Tipo */}
        <div className="w-full sm:w-1/2 lg:w-1/5">
          <label className="block text-xs font-bold text-gray-500 mb-1">Filtrar por Tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="Monitor">Monitor</option>
            <option value="Impresora">Impresora</option>
            <option value="Teclado">Teclado</option>
            <option value="Mouse">Mouse</option>
            <option value="Estabilizador">Estabilizador</option>
            <option value="Lector de Código">Lector de Código</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        {/* Filtro por Estado */}
        <div className="w-full sm:w-1/2 lg:w-1/5">
          <label className="block text-xs font-bold text-gray-500 mb-1">Filtrar por Estado Técnico</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="OPERATIVO">OPERATIVO</option>
            <option value="GARANTIA">EN GARANTÍA</option>
            <option value="OBSOLETO">OBSOLETO</option>
            <option value="BAJA">DE BAJA</option>
          </select>
        </div>
        
        {/* Toggle Papelera */}
        <div className="w-full lg:w-auto flex items-center bg-gray-50 p-2 rounded-lg border border-gray-200 justify-center h-[38px]">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={mostrarInactivos} onChange={() => setMostrarInactivos(!mostrarInactivos)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${mostrarInactivos ? 'bg-red-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${mostrarInactivos ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className={`ml-3 text-sm font-bold ${mostrarInactivos ? 'text-red-600' : 'text-gray-500'}`}>
              {mostrarInactivos ? '🗑️ Ver Papelera' : 'Ver Eliminados'}
            </span>
          </label>
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="bg-white shadow-sm rounded-xl overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={mostrarInactivos ? "bg-red-50" : "bg-blue-50"}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Patrimonio (V/A)</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Equipo</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Marca y Modelo</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">N° Serie / Detalles</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-600">Estado Técnico</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">PC Vinculada</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Cargando periféricos...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No se encontraron registros.</td></tr>
            ) : (
              filtrados.map((item) => (
                <tr key={item.id_periferico} className={`hover:bg-gray-50 ${mostrarInactivos ? 'opacity-70' : ''}`}>
                  
                  {/* Códigos */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-mono">
                    <p className="font-bold text-green-700">🟢 {item.cod_patrimonio_verde || 'S/P'}</p>
                    <p className="text-blue-700">🔵 {item.cod_patrimonio || item.cod_patrimonio_azul || 'S/P'}</p>
                  </td>

                  {/* Columna Equipo Separada */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                    <span className="bg-slate-100 text-slate-800 text-xs font-black px-2 py-1 rounded">
                      {item.tipo_periferico}
                    </span>
                  </td>

                  {/* Columna Marca y Modelo Unificada */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="font-bold text-gray-800">{item.marca}</span>
                    <p className="text-gray-500 text-xs">{item.modelo || '-'}</p>
                  </td>

                  {/* Serie y Detalles */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <p className="font-mono text-gray-700 font-bold">SN: {item.n_serie || item.numero_serie || '-'}</p>
                    <p className="text-purple-700 italic">{item.detalle_tecnico || '-'}</p>
                  </td>

                  {/* Estado Técnico */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeEstado(item.estado || item.estado_fisico)}`}>
                      {item.estado || item.estado_fisico || 'OPERATIVO'}
                    </span>
                  </td>

                  {/* PC Vinculada (nombre_red_pc) */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    {item.equipos?.nombre_red_pc ? (
                      <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        💻 {item.equipos.nombre_red_pc}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        📦 En Almacén
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3 whitespace-nowrap text-center space-x-2">
                    {!mostrarInactivos ? (
                      <>
                        <Link href={`/perifericos/editar/${item.id_periferico}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100" title="Editar">⚙️</Link>
                        <Link href={`/perifericos/detalles?id=${item.id_periferico}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100" title="Detalles">👁️</Link>
                        <button onClick={() => handleDesactivar(item.id_periferico, item.tipo_periferico, item.marca)} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100" title="Eliminar">🗑️</button>
                      </>
                    ) : (
                      <button onClick={() => handleRestaurar(item.id_periferico, item.tipo_periferico)} className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold">
                        ♻️ Recuperar
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