'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Importamos los iconos profesionales de Lucide
import { 
  ArrowLeft, 
  Save, 
  Tag, 
  Cpu, 
  Network, 
  AlertTriangle,
  FileText,
  Boxes
} from 'lucide-react';

export default function EditarPerifericoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [equipos, setEquipos] = useState<any[]>([]);
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
    motivo: '', 
    observaciones_almacen: '',
    id_equipo: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  async function cargarDatos() {
    // Cargar listado de PCs activas
    const { data: listadoPCs } = await supabase
      .from('equipos')
      .select('id_equipo, nombre_red_pc')
      .neq('activo', false)
      .order('nombre_red_pc', { ascending: true });
    if (listadoPCs) setEquipos(listadoPCs);

    // Cargar datos actuales del periférico
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
      setEstadoOriginal(estadoActual); 

      setFormData({
        tipo_periferico: data.tipo_periferico || 'MONITOR',
        cod_patrimonio_azul: data.cod_patrimonio_azul || '',
        cod_patrimonio_verde: data.cod_patrimonio_verde || '',
        marca: data.marca || '',
        modelo: data.modelo || '',
        n_serie: data.n_serie || '',
        detalle_tecnico: data.detalle_tecnico || '',
        estado_fisico: estadoActual,
        motivo: '', // Vacío para forzar justificación en caso de cambio
        observaciones_almacen: data.observaciones_almacen || '',
        id_equipo: data.id_equipo ? data.id_equipo.toString() : ''
      });
    }
    setInitialLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { motivo, ...restoDatos } = formData;

    const datosGuardar = {
      ...restoDatos,
      id_equipo: formData.id_equipo === '' ? null : parseInt(formData.id_equipo)
    };

    const { error: errorUpdate } = await supabase
      .from('perifericos')
      .update(datosGuardar)
      .eq('id_periferico', id);

    if (errorUpdate) {
      alert('Error al actualizar periférico: ' + errorUpdate.message);
      setLoading(false);
      return;
    }

    // Guardar en el historial si cambió el estado físico
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
    return <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Cargando datos del periférico...</div>;
  }

  // Estilos base reutilizables para los inputs y selects
  const inputStyles = "block w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all duration-200";

  return (
    <div className="max-w-4xl mx-auto bg-[#F8FAFC] min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      
      {/* CABECERA */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Modificar Periférico</h2>
          <p className="text-slate-500 text-sm mt-1">Actualiza clasificaciones patrimoniales, marcas, series o asignaciones operativas.</p>
        </div>
        <Link 
          href="/perifericos" 
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </Link>
      </div>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* TARJETA 1: CLASIFICACIÓN Y CONTROL PATRIMONIAL */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-amber-500" /> 1. Clasificación y Control Patrimonial
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Periférico</label>
              <select 
                name="tipo_periferico" 
                value={formData.tipo_periferico} 
                onChange={handleChange} 
                className={`${inputStyles} font-bold text-amber-700`}
              >
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cód. Patrimonio Verde</label>
              <input 
                name="cod_patrimonio_verde" 
                value={formData.cod_patrimonio_verde} 
                onChange={handleChange} 
                placeholder="Ej. 23223131"
                className={`${inputStyles} font-mono font-medium`} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cód. Patrimonio Azul (SBN)</label>
              <input 
                name="cod_patrimonio_azul" 
                value={formData.cod_patrimonio_azul} 
                onChange={handleChange} 
                placeholder="Ej. 232332"
                className={`${inputStyles} font-mono font-medium`} 
              />
            </div>
          </div>
        </div>

        {/* TARJETA 2: ESPECIFICACIONES DE FÁBRICA */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-blue-500" /> 2. Especificaciones de Fábrica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Marca <span className="text-red-500">*</span></label>
              <input 
                required 
                name="marca" 
                value={formData.marca} 
                onChange={handleChange} 
                placeholder="Ej. DELL, HP, EPSON"
                className={inputStyles} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Modelo</label>
              <input 
                name="modelo" 
                value={formData.modelo} 
                onChange={handleChange} 
                placeholder="Ej. L3250 / E2420H"
                className={inputStyles} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Número de Serie</label>
              <input 
                name="n_serie" 
                value={formData.n_serie} 
                onChange={handleChange} 
                placeholder="Ej. CN-0CC732..."
                className={`${inputStyles} font-mono`} 
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Detalle Técnico Específico / Conexión</label>
              <input 
                name="detalle_tecnico" 
                value={formData.detalle_tecnico} 
                onChange={handleChange} 
                placeholder="Ej. 24 Pulgadas FHD IPS / Conexión USB-B y Red Rj45 / 1200 VA"
                className={inputStyles} 
              />
            </div>
          </div>
        </div>

        {/* TARJETA 3: ESTADO OPERATIVO Y LOGÍSTICA */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2.5">
            <Network className="w-5 h-5 text-teal-500" /> 3. Estado Operativo y Ubicación
          </h3>
          
          {/* Alerta dinámica si cambia el estado */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estado Operativo Oficial</label>
                <select 
                  name="estado_fisico" 
                  value={formData.estado_fisico} 
                  onChange={handleChange} 
                  className={`${inputStyles} font-bold text-slate-900`}
                >
                  <option value="OPERATIVO">OPERATIVO</option>
                  <option value="GARANTIA">EN GARANTÍA</option>
                  <option value="OBSOLETO">OBSOLETO</option>
                  <option value="BAJA">DE BAJA</option>
                </select>
                
                {formData.estado_fisico !== estadoOriginal && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200/60 font-bold mt-3 p-2.5 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Estás alterando el estado técnico (Anterior: <span className="underline">{estadoOriginal}</span>)</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Justificación del Cambio de Estado</label>
                <textarea 
                  name="motivo" 
                  value={formData.motivo} 
                  onChange={handleChange} 
                  rows={2}
                  placeholder={formData.estado_fisico !== estadoOriginal ? "Obligatorio: Justifica la razón del cambio de estado técnico..." : "Opcional si mantiene el estado original..."}
                  className={`${inputStyles} ${
                    formData.estado_fisico !== estadoOriginal && formData.motivo.trim() === '' 
                      ? 'border-amber-400 bg-amber-50/40 focus:ring-amber-500/20 focus:border-amber-500' 
                      : ''
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vincular a Computadora (Red)</label>
              <select 
                name="id_equipo" 
                value={formData.id_equipo} 
                onChange={handleChange} 
                className={inputStyles}
              >
                <option value="">📦 En Almacén / Stock Libre</option>
                {equipos.map(eq => (
                  <option key={eq.id_equipo} value={eq.id_equipo}>💻 {eq.nombre_red_pc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ubicación en Almacén / Observaciones</label>
              <textarea 
                name="observaciones_almacen" 
                value={formData.observaciones_almacen} 
                onChange={handleChange} 
                rows={2} 
                placeholder="Estante A-3, Caja de repuestos, etc..."
                className={inputStyles} 
              />
            </div>
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <div className="pt-4 text-right">
          <button 
            type="submit" 
            disabled={loading} 
            className="inline-flex items-center gap-2 bg-amber-500 text-white px-8 py-3 rounded-xl hover:bg-amber-600 disabled:bg-amber-300 font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando Cambios...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}