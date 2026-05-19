'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditarPerifericoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [equipos, setEquipos] = useState<any[]>([]);
  
  // 👈 NUEVO: Estado para rastrear si el estado físico cambió
  const [estadoOriginal, setEstadoOriginal] = useState('');
  
  const [formData, setFormData] = useState({
    tipo_periferico: '',
    cod_patrimonio_azul: '',
    cod_patrimonio_verde: '',
    marca: '',
    modelo: '',
    n_serie: '',
    detalle_tecnico: '',
    estado_fisico: 'OPERATIVO',
    motivo: '', // 👈 Añadido
    observaciones_almacen: '',
    id_equipo: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  async function cargarDatos() {
    // 1. Cargar todas las PCs usando 'nombre_red_pc'
    const { data: listadoPCs } = await supabase
      .from('equipos')
      .select('id_equipo, nombre_red_pc')
      .neq('activo', false)
      .order('nombre_red_pc', { ascending: true });
    if (listadoPCs) setEquipos(listadoPCs);

    // 2. Cargar datos del periférico actual
    const { data, error } = await supabase
      .from('perifericos')
      .select('*')
      .eq('id_periferico', id)
      .single();

    if (error) {
      alert('Error al cargar datos: ' + error.message);
      router.push('/perifericos');
      return;
    }

    if (data) {
      const estadoActual = data.estado_fisico || 'OPERATIVO';
      setEstadoOriginal(estadoActual); // 👈 Guardamos el estado con el que inició

      setFormData({
        tipo_periferico: data.tipo_periferico || 'MONITOR',
        cod_patrimonio_azul: data.cod_patrimonio_azul || '',
        cod_patrimonio_verde: data.cod_patrimonio_verde || '',
        marca: data.marca || '',
        modelo: data.modelo || '',
        n_serie: data.n_serie || '',
        detalle_tecnico: data.detalle_tecnico || '',
        estado_fisico: estadoActual,
        motivo: '', // Lo dejamos vacío para que justifiquen si lo cambian
        observaciones_almacen: data.observaciones_almacen || '',
        id_equipo: data.id_equipo ? data.id_equipo.toString() : ''
      });
    }
    setInitialLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Separamos "motivo" para no intentar guardarlo en la tabla principal de periféricos
    const { motivo, ...restoDatos } = formData;

    const datosGuardar = {
      ...restoDatos,
      id_equipo: formData.id_equipo === '' ? null : parseInt(formData.id_equipo)
    };

    // 1. Actualizamos los datos principales del periférico
    const { error: errorUpdate } = await supabase
      .from('perifericos')
      .update(datosGuardar)
      .eq('id_periferico', id);

    if (errorUpdate) {
      alert('Error al actualizar periférico: ' + errorUpdate.message);
      setLoading(false);
      return;
    }

    // 2. 👈 NUEVO: Si el estado físico cambió, registramos el historial con su motivo
    if (formData.estado_fisico !== estadoOriginal) {
      const { error: errorHistorial } = await supabase
        .from('estados_perifericos')
        .insert([{
          id_periferico: id,
          tipo_estado: formData.estado_fisico,
          motivo: motivo.trim() !== '' ? motivo : `Cambio de estado desde edición (De ${estadoOriginal} a ${formData.estado_fisico})`
        }]);
        
      if (errorHistorial) console.error("Error guardando historial:", errorHistorial);
    }

    router.push('/perifericos'); 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const forzarMayuscula = ['marca', 'modelo', 'n_serie', 'cod_patrimonio_azul', 'cod_patrimonio_verde', 'tipo_periferico'].includes(name);
    setFormData({ 
      ...formData, 
      [name]: forzarMayuscula ? value.toUpperCase() : value 
    });
  };

  if (initialLoading) {
    return <div className="text-center py-20 text-gray-500 font-medium">Cargando periférico...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Modificar Periférico</h2>
          <p className="text-gray-500 text-sm mt-1">Modifica marcas, series, reasignaciones de PC o estados físicos.</p>
        </div>
        <Link href="/perifericos" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        
        {/* SECCIÓN 1 */}
        <div>
          <h3 className="text-sm font-bold text-amber-600 mb-4 border-b pb-2">1. Clasificación y Control Patrimonial</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Periférico</label>
              <select name="tipo_periferico" value={formData.tipo_periferico} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500 font-bold">
                <option value="MONITOR">MONITOR 🖥️</option>
                <option value="IMPRESORA">IMPRESORA 🖨️</option>
                <option value="UPS">UPS / ESTABILIZADOR 🔋</option>
                <option value="TECLADO">TECLADO ⌨️</option>
                <option value="MOUSE">MOUSE 🖱️</option>
                <option value="LECTOR CODIGO">LECTOR DE CÓDIGO 🏷️</option>
                <option value="ESCÁNER">ESCÁNER 📄</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cód. Patrimonio Verde</label>
              <input name="cod_patrimonio_verde" value={formData.cod_patrimonio_verde} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cód. Patrimonio Azul</label>
              <input name="cod_patrimonio_azul" value={formData.cod_patrimonio_azul} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500 font-mono" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2 */}
        <div>
          <h3 className="text-sm font-bold text-amber-600 mb-4 border-b pb-2">2. Especificaciones de Fábrica</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Marca (Obligatorio)</label>
              <input required name="marca" value={formData.marca} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Modelo</label>
              <input name="modelo" value={formData.modelo} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Número de Serie</label>
              <input name="n_serie" value={formData.n_serie} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500 font-mono" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">Detalle Técnico Específico</label>
              <input name="detalle_tecnico" value={formData.detalle_tecnico} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: ESTADO Y CONECTIVIDAD */}
        <div>
          <h3 className="text-sm font-bold text-amber-600 mb-4 border-b pb-2">3. Estado y Conectividad</h3>
          
          {/* 👈 NUEVO: CAJA GRIS CON MOTIVO INCLUIDO */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Estado Operativo Oficial</label>
                <select name="estado_fisico" value={formData.estado_fisico} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500 font-bold">
                  <option value="OPERATIVO">🟢 OPERATIVO</option>
                  <option value="GARANTIA">🔵 EN GARANTÍA</option>
                  <option value="OBSOLETO">🟡 OBSOLETO</option>
                  <option value="BAJA">🔴 DADO DE BAJA</option>
                </select>
                {formData.estado_fisico !== estadoOriginal && (
                  <p className="text-xs text-amber-600 font-bold mt-2">
                    ⚠️ Estás cambiando el estado (Era: {estadoOriginal}).
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nota / Motivo del Cambio de Estado</label>
                <textarea 
                  name="motivo" 
                  value={formData.motivo} 
                  onChange={handleChange} 
                  rows={2}
                  placeholder={formData.estado_fisico !== estadoOriginal ? "Escribe por qué cambió el estado..." : "Solo necesario si cambias el estado..."}
                  className={`block w-full border rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500 ${
                    formData.estado_fisico !== estadoOriginal && formData.motivo.trim() === '' ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Asignar a Computadora</label>
              <select name="id_equipo" value={formData.id_equipo} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900 focus:ring-amber-500 focus:border-amber-500">
                <option value="">📦 En Almacén / Suelto</option>
                {equipos.map(eq => (
                  <option key={eq.id_equipo} value={eq.id_equipo}>💻 {eq.nombre_red_pc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ubicación en Almacén / Notas extra</label>
              <textarea name="observaciones_almacen" value={formData.observaciones_almacen} onChange={handleChange} rows={2} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900 focus:ring-amber-500 focus:border-amber-500" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 text-right">
          <button type="submit" disabled={loading} className="bg-amber-500 text-white px-8 py-2.5 rounded-lg hover:bg-amber-600 disabled:bg-amber-300 font-bold shadow-md transition-all">
            {loading ? 'Actualizando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

