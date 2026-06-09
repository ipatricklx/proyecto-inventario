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
  const [usuarios, setUsuarios] = useState<any[]>([]); 

  // Estados para el cambio de condición técnica
  const [cambiarEstado, setCambiarEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<string>(''); 
  const [motivoEstado, setMotivoEstado] = useState<string>('');

  const [formData, setFormData] = useState({
    cod_patrimonio: '',
    cod_patrimonio_verde: '', // 👈 Campo Integrado
    tipo_equipo: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    id_ubicacion: '',
    procesador: '',
    memoria_ram: '',
    almacenamiento: '',
    direccion_ip: '',
    direccion_mac: '',
    nombre_red_pc: '',
    clave_vnc: '',
    sistema_operativo: '',
    antivirus: '',
    activo: true,
    estado: 'OPERATIVO',
    id_usuario: '',
    tiene_sap: false,
    tiene_ses: false,
    tiene_winepi: false, 
    tiene_sinadef: false,
    tiene_internet: false,
    en_dominio: false
  });

  useEffect(() => {
    getDatos();
  }, [id]);

  async function getDatos() {
    // Cargar Ubicaciones
    const { data: ubis } = await supabase.from('ubicaciones').select('*');
    if (ubis) setUbicaciones(ubis);

    // Cargar Usuarios
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
    setLoading(true);
    setSaving(true);

    // Hacemos una copia de los datos
    const datosActualizar: any = { ...formData };
    
    //  LIMPIEZA GENERAL
    Object.keys(datosActualizar).forEach((key) => {
      if (typeof datosActualizar[key] === 'string' && datosActualizar[key].trim() === '') {
        datosActualizar[key] = null;
      }
    });

    delete datosActualizar.created_at;
    delete datosActualizar.updated_at;

    
    if (!datosActualizar.id_ubicacion) datosActualizar.id_ubicacion = null;
    if (!datosActualizar.id_usuario) datosActualizar.id_usuario = null; 

    if (cambiarEstado && nuevoEstado !== '') {
      datosActualizar.estado = nuevoEstado;
    }

    // 3. Enviamos a Supabase
    const { error: errorEquipo } = await supabase
      .from('equipos')
      .update(datosActualizar)
      .eq('id_equipo', Number(id));
    
    if (errorEquipo) {
      alert('Error al guardar cambios: ' + errorEquipo.message);
      setSaving(false);
      setLoading(false);
      return;
    }

    // Registrar historial si cambió el estado técnico
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium">Abriendo expediente del activo...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">Modificar Activo Hospitalario</h2>
          <p className="text-gray-500 mt-1">Actualiza las especificaciones técnicas o registra cambios de estado.</p>
        </div>
        <span className="bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-mono border border-gray-200 shadow-sm">
          ID COMPONENTE: {id}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* BLOQUE 1: DATOS GENERALES Y ESTADO */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">1. Datos Generales y Auditoría</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Código Patrimonial Principal/Azul */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Código de Patrimonio (Principal / SBN)</label>
              <input 
                required 
                name="cod_patrimonio" 
                value={formData.cod_patrimonio} 
                onChange={handleChange} 
                className="mt-1 block w-full border border-blue-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-blue-50/40 font-bold text-blue-900" 
              />
            </div>

            {/* Código Patrimonial Verde Interno */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Código de Patrimonio (Etiqueta Verde)</label>
              <input 
                name="cod_patrimonio_verde" 
                value={formData.cod_patrimonio_verde} 
                onChange={handleChange} 
                placeholder="Ej: 00539420 (Opcional)"
                className="mt-1 block w-full border border-green-300 rounded-md p-2 shadow-sm focus:ring-green-500 focus:border-green-500 bg-green-50/40 font-bold text-green-900" 
              />
            </div>
            
            <div><label className="block text-sm font-medium text-gray-700">Tipo de Equipo</label><select required name="tipo_equipo" value={formData.tipo_equipo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white"><option value="">Seleccionar...</option><option value="CPU">CPU</option><option value="Laptop">Laptop</option><option value="Notebook">Notebook</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700">Ubicación Actual</label><select name="id_ubicacion" value={formData.id_ubicacion} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white"><option value="">Almacén / Sin Asignar</option>{ubicaciones.map((ubi) => (<option key={ubi.id_ubicacion} value={ubi.id_ubicacion}>{ubi.servicio} - {ubi.area}</option>))}</select></div>
            <div><label className="block text-sm font-medium text-gray-700">Marca</label><input name="marca" value={formData.marca} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Modelo</label><input name="modelo" value={formData.modelo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Número de Serie</label><input name="numero_serie" value={formData.numero_serie} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white" /></div>

            {/* SECCIÓN ESTADO TÉCNICO E HISTORIAL */}
            <div className="md:col-span-2 border border-blue-200 bg-blue-50/40 p-5 rounded-xl mt-2">
              <h3 className="text-sm font-bold text-blue-900 mb-2">📊 Condición Técnica en el Inventario</h3>
              <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm text-sm mb-4">
                <p className="text-gray-700">Estado actual registrado: <span className="font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded text-xs ml-1 shadow-sm">{formData.estado?.toUpperCase()}</span></p>
              </div>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm text-gray-700 font-medium cursor-pointer">
                  <input type="checkbox" checked={cambiarEstado} onChange={(e) => setCambiarEstado(e.target.checked)} className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span>⚠️ Deseo actualizar la condición técnica / registrar incidencia de este equipo</span>
                </label>
                {cambiarEstado && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-blue-100 animate-fadeIn">
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
                      <input required type="text" value={motivoEstado} onChange={(e) => setMotivoEstado(e.target.value)} className="mt-1 block w-full border border-red-300 rounded-md p-2 shadow-sm text-sm placeholder-red-300 text-gray-900 bg-white" placeholder="Ej: Tarjeta madre quemada." />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN AUDITORÍA (ACTIVO/INACTIVO) */}
            <div className="md:col-span-2 border border-red-200 bg-red-50/40 p-4 rounded-xl mt-2">
              <label className="block text-sm font-bold text-red-900">Auditoría Patrimonial: Presencia Física</label>
              <select name="activo" value={String(formData.activo)} onChange={handleChange} className="mt-1 block w-full border border-red-300 bg-white rounded-md p-2 shadow-sm text-sm font-medium text-gray-900 focus:ring-red-500 focus:border-red-500">
                <option value="true">🟢 SÍ EXISTE (Contabilizar físicamente en los almacenes/servicios)</option>
                <option value="false">🔴 YA NO EXISTE (Dar de baja patrimonial definitiva - Ocultar)</option>
              </select>
            </div>
          </div>
        </section>

        {/* BLOQUE 2: HARDWARE Y RED */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">2. Hardware y Red</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-gray-700">Procesador</label><input name="procesador" value={formData.procesador} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white" /></div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Memoria RAM</label>
              <select name="memoria_ram" value={formData.memoria_ram} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white">
                <option value="">Seleccionar...</option>
                <option value="4 GB">4 GB</option>
                <option value="8 GB">8 GB</option>
                <option value="12 GB">12 GB</option>
                <option value="16 GB">16 GB</option>
                <option value="32 GB">32 GB</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Almacenamiento</label>
              <select name="almacenamiento" value={formData.almacenamiento} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white">
                <option value="">Seleccionar...</option>
                <option value="256 GB SSD">256 GB SSD</option>
                <option value="512 GB SSD">512 GB SSD</option>
                <option value="1 TB SSD">1 TB SSD</option>
                <option value="500 GB HDD">500 GB HDD</option>
                <option value="1 TB HDD">1 TB HDD</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div><label className="block text-sm font-medium text-gray-700">Nombre de PC en Red (Hostname)</label><input name="nombre_red_pc" value={formData.nombre_red_pc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Dirección IP</label><input name="direccion_ip" value={formData.direccion_ip} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm font-mono text-sm bg-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Dirección MAC</label><input name="direccion_mac" value={formData.direccion_mac} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm font-mono text-sm uppercase bg-white" /></div>
          </div>
        </section>

        {/* BLOQUE 3: SOFTWARE */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">3. Software Base</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sistema Operativo</label>
              <select name="sistema_operativo" value={formData.sistema_operativo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white">
                <option value="">Seleccionar...</option>
                <option value="Windows 10 Pro">Windows 10 Pro</option>
                <option value="Windows 10 Home">Windows 10 Home</option>
                <option value="Windows 11 Pro">Windows 11 Pro</option>
                <option value="Windows 7 Professional">Windows 7 Professional</option>
                <option value="Linux / Ubuntu">Linux / Ubuntu</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div><label className="block text-sm font-medium text-gray-700">Antivirus Instalado</label><input name="antivirus" value={formData.antivirus} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Clave VNC (Soporte Remoto)</label><input name="clave_vnc" value={formData.clave_vnc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white" /></div>
          </div>
        </section>

        {/* BLOQUE 4: SISTEMAS Y ASIGNACIÓN */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-8">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">4. Accesos y Personal Asignado</h3>
            
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h4 className="text-sm font-bold text-blue-800 mb-3">👤 Asignación de Responsable</h4>
            <div>
              <select name="id_usuario" value={formData.id_usuario} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2.5 shadow-sm bg-white text-gray-900">
                <option value="">-- Equipo sin usuario asignado (Libre/Almacén) --</option>
                {usuarios.map((user) => (
                  <option key={user.id_usuario} value={user.id_usuario}>
                    {user.apellidos}, {user.nombres} {user.anexo ? `(Anexo: ${user.anexo})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-3">🔌 Configuración de Red y Sistemas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                <input type="checkbox" name="tiene_sap" checked={formData.tiene_sap} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="ml-3 font-medium text-sm text-gray-700">Sistema SAP</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                <input type="checkbox" name="tiene_ses" checked={formData.tiene_ses} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="ml-3 font-medium text-sm text-gray-700">Sistema SES</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                <input type="checkbox" name="tiene_winepi" checked={formData.tiene_winepi} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="ml-3 font-medium text-sm text-gray-700">WINEPI (Epidemiología)</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                <input type="checkbox" name="tiene_sinadef" checked={formData.tiene_sinadef} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="ml-3 font-medium text-sm text-gray-700">Registro SINADEF</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                <input type="checkbox" name="en_dominio" checked={formData.en_dominio} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="ml-3 font-medium text-sm text-gray-700">Unido al Dominio Local</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                <input type="checkbox" name="tiene_internet" checked={formData.tiene_internet} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="ml-3 font-medium text-sm text-gray-700">Salida a Internet Abierta</span>
              </label>
            </div>
          </div>
        </section>

        {/* BOTONES FLOTANTES DE ACCIÓN */}
        <div className="flex justify-end space-x-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky bottom-4 z-10">
          <button type="button" onClick={() => router.push('/equipos')} className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-bold shadow-md transition-all">
            {saving ? 'Guardando expediente...' : 'Actualizar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}