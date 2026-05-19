'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoPerifericoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [equipos, setEquipos] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    tipo_periferico: 'MONITOR',
    cod_patrimonio_azul: '',
    cod_patrimonio_verde: '',
    marca: '',
    modelo: '',
    n_serie: '',
    detalle_tecnico: '',
    estado_fisico: 'OPERATIVO',
    motivo: 'Registro inicial del periférico en el sistema.', // Campo añadido
    observaciones_almacen: '',
    id_equipo: '', // Vacío significa almacenado
    activo: true
  });

  useEffect(() => {
    cargarEquiposActivos();
  }, []);

  async function cargarEquiposActivos() {
    const { data } = await supabase
      .from('equipos')
      .select('id_equipo, nombre_red_pc')
      .neq('activo', false)
      .order('nombre_red_pc', { ascending: true });
    if (data) setEquipos(data);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Ajustamos el id_equipo si no seleccionó ninguno para que guarde un NULL correcto
    const datosGuardar = {
      tipo_periferico: formData.tipo_periferico,
      cod_patrimonio_azul: formData.cod_patrimonio_azul,
      cod_patrimonio_verde: formData.cod_patrimonio_verde,
      marca: formData.marca,
      modelo: formData.modelo,
      n_serie: formData.n_serie,
      detalle_tecnico: formData.detalle_tecnico,
      estado_fisico: formData.estado_fisico,
      observaciones_almacen: formData.observaciones_almacen,
      id_equipo: formData.id_equipo === '' ? null : parseInt(formData.id_equipo),
      activo: formData.activo
    };

    // 1. Insertamos el periférico y pedimos que nos devuelva el registro creado
    const { data: nuevoPeriferico, error } = await supabase
      .from('perifericos')
      .insert([datosGuardar])
      .select('id_periferico')
      .single();

    if (error) {
      alert('Error al registrar periférico: ' + error.message);
      setLoading(false);
      return;
    }

    // 2. Si se creó con éxito, registramos el estado inicial en el historial
    if (nuevoPeriferico && nuevoPeriferico.id_periferico) {
      await supabase.from('estados_perifericos').insert([{
        id_periferico: nuevoPeriferico.id_periferico,
        tipo_estado: formData.estado_fisico,
        motivo: formData.motivo // Se guarda el motivo ingresado por el usuario
      }]);
    }

    router.push('/perifericos'); 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Forzamos mayúsculas automáticas en marcas, modelos y números de serie para evitar desorden
    const forzarMayuscula = ['marca', 'modelo', 'n_serie', 'cod_patrimonio_azul', 'cod_patrimonio_verde', 'tipo_periferico'].includes(name);
    setFormData({ 
      ...formData, 
      [name]: forzarMayuscula ? value.toUpperCase() : value 
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Registrar Periférico</h2>
          <p className="text-gray-500 text-sm mt-1">Añade hardware de soporte al inventario central.</p>
        </div>
        <Link href="/perifericos" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        
        {/* CLASIFICACIÓN Y PATRIMONIO */}
        <div>
          <h3 className="text-sm font-bold text-blue-800 mb-4 border-b pb-2">1. Clasificación y Control Patrimonial</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Periférico</label>
              <select name="tipo_periferico" value={formData.tipo_periferico} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500 font-bold">
                <option value="MONITOR">MONITOR 🖥️</option>
                <option value="IMPRESORA">IMPRESORA 🖨️</option>
                <option value="UPS">UPS / ESTABILIZADOR 🔋</option>
                <option value="TECLADO">TECLADO ⌨️</option>
                <option value="MOUSE">MOUSE 🖱️</option>
                <option value="LECTOR CODIGO">LECTOR DE CÓDIGO DE BARRAS 🏷️</option>
                <option value="ESCÁNER">ESCÁNER 📄</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cód. Patrimonio Verde</label>
              <input name="cod_patrimonio_verde" value={formData.cod_patrimonio_verde} onChange={handleChange} placeholder="Ej: 00539421" className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cód. Patrimonio Azul</label>
              <input name="cod_patrimonio_azul" value={formData.cod_patrimonio_azul} onChange={handleChange} placeholder="Ej: 01106861" className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500 font-mono" />
            </div>
          </div>
        </div>

        {/* DETALLES DEL DISPOSITIVO */}
        <div>
          <h3 className="text-sm font-bold text-blue-800 mb-4 border-b pb-2">2. Especificaciones de Fábrica</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Marca (Obligatorio)</label>
              <input required name="marca" value={formData.marca} onChange={handleChange} placeholder="Ej: DELL, HP, EPSON..." className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Modelo</label>
              <input name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej: E2016H" className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Número de Serie</label>
              <input name="n_serie" value={formData.n_serie} onChange={handleChange} placeholder="Ej: CN-0J0R3M..." className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500 font-mono" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">Detalle Técnico Específico</label>
              <input name="detalle_tecnico" value={formData.detalle_tecnico} onChange={handleChange} placeholder="Ej: '20 pulgadas' para monitores, 'Inyección de tinta' para impresoras..." className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* ASIGNACIÓN Y ESTADOS */}
        <div>
          <h3 className="text-sm font-bold text-blue-800 mb-4 border-b pb-2">3. Estado y Conectividad</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Estado Operativo Inicial</label>
                <select name="estado_fisico" value={formData.estado_fisico} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500 font-bold">
                  <option value="OPERATIVO">OPERATIVO</option>
                  <option value="GARANTIA">EN GARANTÍA</option>
                  <option value="OBSOLETO">OBSOLETO</option>
                  <option value="BAJA">DE BAJA</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nota u Observación (Motivo de Estado)</label>
                <textarea name="motivo" rows={1} value={formData.motivo} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Asignar a Computadora (Opcional)</label>
              <select name="id_equipo" value={formData.id_equipo} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                <option value="">📦 Mantener suelto en Almacén</option>
                {equipos.map(eq => (
                  <option key={eq.id_equipo} value={eq.id_equipo}>💻 {eq.nombre_red_pc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ubicación en Almacén / Notas extra</label>
              <textarea name="observaciones_almacen" value={formData.observaciones_almacen} onChange={handleChange} rows={1} placeholder="Ej: Pasillo A 12-11..." className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 text-right">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-bold shadow-md transition-all">
            {loading ? 'Guardando...' : 'Registrar Periférico'}
          </button>
        </div>
      </form>
    </div>
  );
}