'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NuevoEquipoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'red' | 'software'>('general');
  
  const [formData, setFormData] = useState({
    // Pestana 1: General
    cod_patrimonio: '',
    origen_patrimonio: 'VERDE', 
    tipo_equipo: '',
    marca: '',
    modelo: '', 
    numero_serie: '',
    id_ubicacion: '',
    tipo_estado: 'OPERATIVO',
    motivo: 'Registro inicial del equipo en el sistema.',
    
    // Pestana 2: Red y Hardware
    procesador: '',
    memoria_ram: '',
    almacenamiento: '',
    direccion_ip: '',
    direccion_mac: '',
    nombre_red_pc: '',
    clave_vnc: '',

    // Pestana 3: Software
    sistema_operativo: '',
    antivirus: ''
  });

  useEffect(() => {
    async function cargarUbicaciones() {
      const { data } = await supabase.from('ubicaciones').select('*');
      if (data) setUbicaciones(data);
    }
    cargarUbicaciones();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ==========================================
    // 🛠️ PARCHE 1: SOLUCIÓN PARA IP Y MAC (UNIQUE KEY)
    // Si el usuario dejó los campos vacíos, los forzamos a ser 'null' real 
    // para que la base de datos no los tome como textos vacíos duplicados.
    // ==========================================
    const ipFinal = formData.direccion_ip.trim() === '' ? null : formData.direccion_ip;
    const macFinal = formData.direccion_mac.trim() === '' ? null : formData.direccion_mac;

    // 1. Insertar en la tabla 'equipos'
    const { data: nuevoEquipo, error: errorEquipo } = await supabase
      .from('equipos')
      .insert([
        { 
          cod_patrimonio: formData.cod_patrimonio,
          origen_patrimonio: formData.origen_patrimonio,
          tipo_equipo: formData.tipo_equipo,
          marca: formData.marca,
          modelo: formData.modelo,
          numero_serie: formData.numero_serie,
          id_ubicacion: formData.id_ubicacion || null,
          procesador: formData.procesador,
          memoria_ram: formData.memoria_ram,
          almacenamiento: formData.almacenamiento,
          
          // Enviamos las variables convertidas en lugar del formData directo
          direccion_ip: ipFinal,   
          direccion_mac: macFinal, 
          
          nombre_red_pc: formData.nombre_red_pc,
          clave_vnc: formData.clave_vnc,
          sistema_operativo: formData.sistema_operativo,
          antivirus: formData.antivirus,
          activo: true,

          // 🛠️ EXTRA: Guardamos el estado inicial en la tabla principal para que
          // se pinte correctamente en tu nueva tabla de colores desde el primer segundo.
          estado: formData.tipo_estado 
        }
      ])
      .select()
      .single();

    if (errorEquipo) {
      alert('Error al guardar equipo: ' + errorEquipo.message);
      setLoading(false);
      return;
    }

    // 2. Insertar estado en 'estados_equipo'
    if (nuevoEquipo) {
      const { error: errorEstado } = await supabase
        .from('estados_equipo')
        .insert([
          {
            id_equipo: nuevoEquipo.id_equipo,
            tipo_estado: formData.tipo_estado,
            motivo: formData.motivo
          }
        ]);

      if (errorEstado) {
        alert('Equipo guardado, pero hubo un error al registrar el estado: ' + errorEstado.message);
      }
    }

    // ==========================================
    // 🛠️ PARCHE 2: SOLUCIÓN PARA NO USAR F5
    // Redirección nativa del navegador. Obliga a Next.js a destruir 
    // la caché temporal y pedir los datos 100% frescos a Supabase.
    // ==========================================
    window.location.href = '/';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-200 animate-fadeIn text-gray-900">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🏥 Registrar Activo Hospitalario</h2>
        <p className="text-gray-500 text-sm">Formulario optimizado para la gestión del Hospital II Chocope.</p>
      </div>

      {/* NAVEGACIÓN DE PESTAÑAS (TABS) */}
      <div className="flex border-b border-gray-200 mb-8 space-x-4">
        <button type="button" onClick={() => setActiveTab('general')} className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>1. Datos Generales</button>
        <button type="button" onClick={() => setActiveTab('red')} className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'red' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>2. Red y Hardware</button>
        <button type="button" onClick={() => setActiveTab('software')} className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'software' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>3. Software y Conectividad</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código de Patrimonio</label>
              <input required name="cod_patrimonio" value={formData.cod_patrimonio} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" placeholder="Ej: 7422..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Origen de Patrimonio</label>
              <select name="origen_patrimonio" value={formData.origen_patrimonio} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white">
                <option value="VERDE">VERDE</option>
                <option value="AZUL">AZUL</option>
                <option value="NINGUNO">SIN ETIQUETA / PROPIO</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Equipo</label>
              <select required name="tipo_equipo" value={formData.tipo_equipo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white">
                <option value="">Seleccionar...</option>
                <option value="CPU">CPU (Estación de Trabajo)</option>
                <option value="Laptop">Laptop / Notebook</option>
                <option value="Monitor">Monitor</option>
                <option value="Teclado">Teclado</option>
                <option value="Impresora">Impresora</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ubicación / Área Hospitalaria</label>
              <select name="id_ubicacion" value={formData.id_ubicacion} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white">
                <option value="">Almacén Soporte Informático</option>
                {ubicaciones.map((ubi) => (
                  <option key={ubi.id_ubicacion} value={ubi.id_ubicacion}>{ubi.servicio} - {ubi.area}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marca</label>
              <input name="marca" value={formData.marca} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" placeholder="Ej: DELL, HP" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Modelo</label>
              <input name="modelo" value={formData.modelo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" placeholder="Ej: OptiPlex 7010" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Número de Serie</label>
              <input name="numero_serie" value={formData.numero_serie} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado Técnico Inicial</label>
              <select name="tipo_estado" value={formData.tipo_estado} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white">
                <option value="OPERATIVO">OPERATIVO</option>
                <option value="GARANTIA">EN GARANTÍA</option>
                <option value="OBSOLETO">OBSOLETO</option>
                <option value="BAJA">DE BAJA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nota u Observación</label>
              <textarea name="motivo" rows={1} value={formData.motivo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" />
            </div>
          </div>
        )}

        {activeTab === 'red' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div><label className="block text-sm font-medium text-gray-700">Procesador</label><input name="procesador" value={formData.procesador} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Memoria RAM</label><input name="memoria_ram" value={formData.memoria_ram} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Almacenamiento</label><input name="almacenamiento" value={formData.almacenamiento} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Nombre de PC</label><input name="nombre_red_pc" value={formData.nombre_red_pc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Dirección IP</label><input name="direccion_ip" value={formData.direccion_ip} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Dirección MAC</label><input name="direccion_mac" value={formData.direccion_mac} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
          </div>
        )}

        {activeTab === 'software' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div><label className="block text-sm font-medium text-gray-700">Sistema Operativo</label><input name="sistema_operativo" value={formData.sistema_operativo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Antivirus</label><input name="antivirus" value={formData.antivirus} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Clave VNC</label><input name="clave_vnc" value={formData.clave_vnc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6 text-right space-x-4 mt-8">
          <button type="button" onClick={() => router.push('/equipos')} className="text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-bold shadow-md transition-all">
            {loading ? 'Guardando...' : 'Registrar Equipo'}
          </button>
        </div>
      </form>
    </div>
  );
}