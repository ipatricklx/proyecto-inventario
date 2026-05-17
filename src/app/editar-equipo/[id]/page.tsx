'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function EditarEquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'red' | 'software'>('general');

  const [cambiarEstado, setCambiarEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<string>(''); 
  const [motivoEstado, setMotivoEstado] = useState<string>('');

  const [formData, setFormData] = useState({
    cod_patrimonio: '', origen_patrimonio: 'VERDE', tipo_equipo: '', marca: '', modelo: '',
    numero_serie: '', id_ubicacion: '', procesador: '', memoria_ram: '', almacenamiento: '',
    direccion_ip: '', direccion_mac: '', nombre_red_pc: '', clave_vnc: '', sistema_operativo: '',
    antivirus: '', activo: true, estado: 'OPERATIVO'
  });

  useEffect(() => {
    getDatos();
  }, [id]);

  async function getDatos() {
    const { data: ubis } = await supabase.from('ubicaciones').select('*');
    if (ubis) setUbicaciones(ubis);

    const { data: equipo, error } = await supabase.from('equipos').select('*').eq('id_equipo', Number(id)).single();
    
    if (equipo) {
      const datosSeguros = { ...equipo };
      Object.keys(datosSeguros).forEach(key => { if (datosSeguros[key] === null) datosSeguros[key] = ''; });
      setFormData(datosSeguros as any);
    } else if (error) {
      alert('Error al cargar el activo.'); 
      router.push('/equipos');
      return;
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const datosActualizar = { ...formData };
    if (!datosActualizar.id_ubicacion) datosActualizar.id_ubicacion = null as any;

    if (typeof datosActualizar.direccion_ip === 'string' && datosActualizar.direccion_ip.trim() === '') {
      datosActualizar.direccion_ip = null as any;
    }
    if (typeof datosActualizar.direccion_mac === 'string' && datosActualizar.direccion_mac.trim() === '') {
      datosActualizar.direccion_mac = null as any;
    }

    if (cambiarEstado && nuevoEstado !== '') {
      datosActualizar.estado = nuevoEstado;
    }

    const { error: errorEquipo } = await supabase
      .from('equipos')
      .update(datosActualizar)
      .eq('id_equipo', Number(id));
    
    if (errorEquipo) {
      alert('Error al guardar cambios: ' + errorEquipo.message);
      setSaving(false);
      return;
    }

    if (cambiarEstado && nuevoEstado !== '') {
      await supabase.from('estados_equipo').insert([{
        id_equipo: Number(id),
        tipo_estado: nuevoEstado, 
        motivo: motivoEstado || 'Actualización manual desde ficha de edición.',
        activo: formData.activo 
      }]);
    }

    window.location.href = '/equipos';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'activo') {
      setFormData(prev => ({ ...prev, activo: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium">Abriendo expediente del activo...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-200 animate-fadeIn text-gray-900">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Modificar Activo Hospitalario</h2>
          <p className="text-gray-500 text-sm">Actualiza las especificaciones técnicas o registra cambios de estado.</p>
        </div>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-mono border border-gray-200">
          ID COMPONENTE: {id}
        </span>
      </div>

      <div className="flex border-b border-gray-200 mb-8 space-x-4">
        <button type="button" onClick={() => setActiveTab('general')} className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>1. Datos Generales y Estado</button>
        <button type="button" onClick={() => setActiveTab('red')} className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'red' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>2. Red y Hardware</button>
        <button type="button" onClick={() => setActiveTab('software')} className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'software' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>3. Software y Conectividad</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div><label className="block text-sm font-medium text-gray-700">Código de Patrimonio</label><input required name="cod_patrimonio" value={formData.cod_patrimonio} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Origen de Patrimonio</label><select name="origen_patrimonio" value={formData.origen_patrimonio} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white"><option value="VERDE">VERDE</option><option value="AZUL">AZUL</option><option value="NINGUNO">SIN ETIQUETA</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700">Tipo de Equipo</label><select required name="tipo_equipo" value={formData.tipo_equipo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white"><option value="CPU">CPU</option><option value="Laptop">Laptop</option><option value="Monitor">Monitor</option><option value="Teclado">Teclado</option><option value="Impresora">Impresora</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700">Ubicación Actual</label><select name="id_ubicacion" value={formData.id_ubicacion} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white"><option value="">Almacén Soporte Informático</option>{ubicaciones.map((ubi) => (<option key={ubi.id_ubicacion} value={ubi.id_ubicacion}>{ubi.servicio} - {ubi.area}</option>))}</select></div>
            <div><label className="block text-sm font-medium text-gray-700">Marca</label><input name="marca" value={formData.marca} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Modelo</label><input name="modelo" value={formData.modelo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Número de Serie</label><input name="numero_serie" value={formData.numero_serie} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>

            <div className="md:col-span-2 border border-blue-200 bg-blue-50/40 p-5 rounded-xl mt-2">
              <h3 className="text-sm font-bold text-blue-900 mb-2">📊 Condición Técnica en el Inventario</h3>
              <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm text-sm mb-4">
                <p className="text-gray-700">Estado actual registrado: <span className="font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded text-xs ml-1 shadow-sm">{formData.estado?.toUpperCase()}</span></p>
              </div>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input type="checkbox" checked={cambiarEstado} onChange={(e) => setCambiarEstado(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span>⚠️ Deseo actualizar la condición técnica / registrar incidencia de este equipo</span>
                </label>
                {cambiarEstado && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-100 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">Seleccionar Nuevo Estado</label>
                      <select required value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} className="mt-1 block w-full border border-gray-300 bg-white rounded-md p-2 shadow-sm text-sm text-gray-900">
                        <option value="">-- Elige una opción --</option>
                        <option value="OPERATIVO">OPERATIVO (Funcionando)</option>
                        <option value="GARANTIA">EN GARANTÍA (Falla de fábrica)</option>
                        <option value="OBSOLETO">OBSOLETO (Desactualizado/Muy antiguo)</option>
                        <option value="BAJA">DE BAJA (Inoperativo/Para repuesto)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-red-700">Justificación Técnica del Cambio (Obligatorio)</label>
                      <input required type="text" value={motivoEstado} onChange={(e) => setMotivoEstado(e.target.value)} className="mt-1 block w-full border border-red-300 rounded-md p-2 shadow-sm text-sm placeholder-red-400 text-gray-900 bg-white" placeholder="Ej: Tarjeta madre quemada." />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 border border-red-200 bg-red-50/40 p-4 rounded-xl mt-2">
              <label className="block text-sm font-bold text-red-900">Auditoría Patrimonial: Presencia Física</label>
              <select name="activo" value={String(formData.activo)} onChange={handleChange} className="mt-1 block w-full border border-red-300 bg-white rounded-md p-2 shadow-sm text-sm font-medium text-gray-900">
                <option value="true">🟢 SÍ EXISTE (Contabilizar físicamente en los almacenes/servicios)</option>
                <option value="false">🔴 YA NO EXISTE (Dar de baja patrimonial definitiva - Ocultar)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'red' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div><label className="block text-sm font-medium text-gray-700">Procesador</label><input name="procesador" value={formData.procesador} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Memoria RAM</label><input name="memoria_ram" value={formData.memoria_ram} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Capacidad Almacenamiento</label><input name="almacenamiento" value={formData.almacenamiento} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Nombre de PC en Red (Hostname)</label><input name="nombre_red_pc" value={formData.nombre_red_pc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Dirección IP</label><input name="direccion_ip" value={formData.direccion_ip} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Dirección MAC</label><input name="direccion_mac" value={formData.direccion_mac} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
          </div>
        )}

        {activeTab === 'software' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div><label className="block text-sm font-medium text-gray-700">Sistema Operativo / Licencia</label><input name="sistema_operativo" value={formData.sistema_operativo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Antivirus Instalado</label><input name="antivirus" value={formData.antivirus} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Clave / Contraseña VNC (Soporte Remoto)</label><input name="clave_vnc" value={formData.clave_vnc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 bg-white" /></div>
          </div>
        )}

        <div className="border-t pt-6 text-right space-x-4">
          <button type="button" onClick={() => router.push('/equipos')} className="text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-bold shadow-md transition-all">
            {saving ? 'Guardando expediente...' : 'Actualizar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}