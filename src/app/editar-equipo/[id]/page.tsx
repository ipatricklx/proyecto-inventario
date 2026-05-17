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
  const [usuarios, setUsuarios] = useState<any[]>([]); // 👈 Nuevo estado
  const [activeTab, setActiveTab] = useState<'general' | 'red' | 'software' | 'sistemas'>('general');

  const [cambiarEstado, setCambiarEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<string>(''); 
  const [motivoEstado, setMotivoEstado] = useState<string>('');

  const [formData, setFormData] = useState({
    cod_patrimonio: '', origen_patrimonio: 'VERDE', tipo_equipo: '', marca: '', modelo: '',
    numero_serie: '', id_ubicacion: '', procesador: '', memoria_ram: '', almacenamiento: '',
    direccion_ip: '', direccion_mac: '', nombre_red_pc: '', clave_vnc: '', sistema_operativo: '',
    antivirus: '', activo: true, estado: 'OPERATIVO',
    
    // 👈 Nuevos campos
    id_usuario: '', tiene_sap: false, tiene_ses: false, tiene_winepi: false, 
    tiene_sinadef: false, tiene_internet: false, en_dominio: false
  });

  useEffect(() => {
    getDatos();
  }, [id]);

  async function getDatos() {
    // Cargar Ubicaciones
    const { data: ubis } = await supabase.from('ubicaciones').select('*');
    if (ubis) setUbicaciones(ubis);

    // 👈 Cargar Usuarios
    const { data: dataUsers } = await supabase.from('usuarios').select('*').order('apellidos');
    if (dataUsers) setUsuarios(dataUsers);

    // Cargar Equipo Actual
    const { data: equipo, error } = await supabase.from('equipos').select('*').eq('id_equipo', Number(id)).single();
    
    if (equipo) {
      const datosSeguros = { ...equipo };
      // Convertir nulls a strings vacíos para los inputs
      Object.keys(datosSeguros).forEach(key => { 
        if (datosSeguros[key] === null) datosSeguros[key] = ''; 
      });
      // Asegurarse de que los booleanos sean booleanos reales
      datosSeguros.tiene_sap = Boolean(equipo.tiene_sap);
      datosSeguros.tiene_ses = Boolean(equipo.tiene_ses);
      datosSeguros.tiene_winepi = Boolean(equipo.tiene_winepi);
      datosSeguros.tiene_sinadef = Boolean(equipo.tiene_sinadef);
      datosSeguros.tiene_internet = Boolean(equipo.tiene_internet);
      datosSeguros.en_dominio = Boolean(equipo.en_dominio);

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
    
    // Manejo de nulos para base de datos
    if (!datosActualizar.id_ubicacion) datosActualizar.id_ubicacion = null as any;
    if (!datosActualizar.id_usuario) datosActualizar.id_usuario = null as any; // 👈 Nulo si no hay usuario
    
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

  // 👈 Función para manejar los checkboxes booleanos
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
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

      <div className="flex border-b border-gray-200 mb-8 space-x-4 overflow-x-auto">
        <button type="button" onClick={() => setActiveTab('general')} className={`py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>1. General y Estado</button>
        <button type="button" onClick={() => setActiveTab('red')} className={`py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'red' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>2. Red y Hardware</button>
        <button type="button" onClick={() => setActiveTab('software')} className={`py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'software' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>3. Software</button>
        <button type="button" onClick={() => setActiveTab('sistemas')} className={`py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'sistemas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>4. Sistemas y Asignación</button>
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

        {/* 👈 NUEVA PESTAÑA: Sistemas y Asignación */}
        {activeTab === 'sistemas' && (
          <div className="animate-fadeIn space-y-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h3 className="text-md font-bold text-blue-800 mb-4">👤 Asignación de Personal</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario Responsable del Equipo</label>
                <select name="id_usuario" value={formData.id_usuario} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2.5 shadow-sm text-gray-900 bg-white">
                  <option value="">-- Equipo sin usuario asignado (Libre/Almacén) --</option>
                  {usuarios.map((user) => (
                    <option key={user.id_usuario} value={user.id_usuario}>
                      {user.apellidos}, {user.nombres} {user.anexo ? `(Anexo: ${user.anexo})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">Nota: Si el trabajador no aparece, debes registrarlo primero en el módulo de "Personal".</p>
              </div>
            </div>

            <div>
              <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">🔌 Accesos y Sistemas Hospitalarios</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" name="tiene_sap" checked={formData.tiene_sap} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="ml-3 font-medium text-gray-700">Sistema SAP</span>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" name="tiene_ses" checked={formData.tiene_ses} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="ml-3 font-medium text-gray-700">Sistema SES</span>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" name="tiene_winepi" checked={formData.tiene_winepi} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="ml-3 font-medium text-gray-700">WINEPI (Epidemiología)</span>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" name="tiene_sinadef" checked={formData.tiene_sinadef} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="ml-3 font-medium text-gray-700">Registro SINADEF</span>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" name="en_dominio" checked={formData.en_dominio} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="ml-3 font-medium text-gray-700">Unido al Dominio Local</span>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" name="tiene_internet" checked={formData.tiene_internet} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="ml-3 font-medium text-gray-700">Salida a Internet Abierta</span>
                </label>
              </div>
            </div>
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