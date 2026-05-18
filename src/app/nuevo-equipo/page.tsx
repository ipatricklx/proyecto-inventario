'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NuevoEquipoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]); 
  
  const [formData, setFormData] = useState({
    // Datos Generales (ACTUALIZADO)
    cod_patrimonio: '',
    cod_patrimonio_verde: '', // 👈 Nuevo campo
    tipo_equipo: '',
    marca: '',
    modelo: '', 
    numero_serie: '',
    id_ubicacion: '',
    tipo_estado: 'OPERATIVO',
    motivo: 'Registro inicial del equipo en el sistema.',
    
    // Red y Hardware
    procesador: '',
    memoria_ram: '',
    almacenamiento: '',
    direccion_ip: '',
    direccion_mac: '',
    nombre_red_pc: '',
    clave_vnc: '',

    // Software
    sistema_operativo: '',
    antivirus: '',

    // Sistemas y Asignación
    id_usuario: '',
    tiene_sap: false,
    tiene_ses: false,
    tiene_winepi: false,
    tiene_sinadef: false,
    tiene_internet: false,
    en_dominio: false
  });

  useEffect(() => {
    async function cargarDatosMaestros() {
      // Cargamos ubicaciones
      const { data: dataUbis } = await supabase.from('ubicaciones').select('*');
      if (dataUbis) setUbicaciones(dataUbis);

      // Cargamos usuarios para el desplegable
      const { data: dataUsers } = await supabase.from('usuarios').select('*').order('apellidos');
      if (dataUsers) setUsuarios(dataUsers);
    }
    cargarDatosMaestros();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const ipFinal = formData.direccion_ip.trim() === '' ? null : formData.direccion_ip;
    const macFinal = formData.direccion_mac.trim() === '' ? null : formData.direccion_mac;
    // 👈 Manejamos el código verde vacío como null
    const verdeFinal = formData.cod_patrimonio_verde.trim() === '' ? null : formData.cod_patrimonio_verde;

    const { data: nuevoEquipo, error: errorEquipo } = await supabase
      .from('equipos')
      .insert([
        { 
          cod_patrimonio: formData.cod_patrimonio,
          cod_patrimonio_verde: verdeFinal, // 👈 Enviamos el código verde
          tipo_equipo: formData.tipo_equipo,
          marca: formData.marca,
          modelo: formData.modelo,
          numero_serie: formData.numero_serie,
          id_ubicacion: formData.id_ubicacion || null,
          procesador: formData.procesador,
          memoria_ram: formData.memoria_ram,
          almacenamiento: formData.almacenamiento,
          direccion_ip: ipFinal,   
          direccion_mac: macFinal, 
          nombre_red_pc: formData.nombre_red_pc,
          clave_vnc: formData.clave_vnc,
          sistema_operativo: formData.sistema_operativo,
          antivirus: formData.antivirus,
          activo: true,
          estado: formData.tipo_estado,
          id_usuario: formData.id_usuario || null,
          tiene_sap: formData.tiene_sap,
          tiene_ses: formData.tiene_ses,
          tiene_winepi: formData.tiene_winepi,
          tiene_sinadef: formData.tiene_sinadef,
          tiene_internet: formData.tiene_internet,
          en_dominio: formData.en_dominio
        }
      ])
      .select()
      .single();

    if (errorEquipo) {
      alert('Error al guardar equipo: ' + errorEquipo.message);
      setLoading(false);
      return;
    }

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
      if (errorEstado) console.error(errorEstado);
    }

    window.location.href = '/equipos'; 
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">🏥 Registrar Activo Hospitalario</h2>
          <p className="text-gray-500 mt-1">Completa el formulario continuo para ingresar un nuevo equipo al sistema.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* BLOQUE 1: DATOS GENERALES */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">1. Datos Generales y Estado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 👈 NUEVOS INPUTS DE PATRIMONIO */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Código de Patrimonio (Azul/Principal)</label>
              <input 
                required 
                name="cod_patrimonio" 
                value={formData.cod_patrimonio} 
                onChange={handleChange} 
                placeholder="Ej: 01105291"
                className="mt-1 block w-full border border-blue-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-blue-50" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Código de Patrimonio (Verde)</label>
              <input 
                name="cod_patrimonio_verde" 
                value={formData.cod_patrimonio_verde} 
                onChange={handleChange} 
                placeholder="Ej: 00539420 (Opcional)"
                className="mt-1 block w-full border border-green-300 rounded-md p-2 shadow-sm focus:ring-green-500 focus:border-green-500 bg-green-50" 
              />
            </div>

            <div><label className="block text-sm font-medium text-gray-700">Tipo de Equipo</label><select required name="tipo_equipo" value={formData.tipo_equipo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm"><option value="">Seleccionar...</option><option value="CPU">CPU</option><option value="Laptop">Laptop</option><option value="Notebook">Notebook</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700">Ubicación</label><select name="id_ubicacion" value={formData.id_ubicacion} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm"><option value="">Sin Asignar / Almacén</option>{ubicaciones.map((ubi) => (<option key={ubi.id_ubicacion} value={ubi.id_ubicacion}>{ubi.servicio} - {ubi.area}</option>))}</select></div>
            <div><label className="block text-sm font-medium text-gray-700">Marca</label><input name="marca" value={formData.marca} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Modelo</label><input name="modelo" value={formData.modelo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Número de Serie</label><input name="numero_serie" value={formData.numero_serie} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" /></div>
            
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Estado Técnico Inicial</label><select name="tipo_estado" value={formData.tipo_estado} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white"><option value="OPERATIVO">OPERATIVO</option><option value="GARANTIA">EN GARANTÍA</option><option value="OBSOLETO">OBSOLETO</option><option value="BAJA">DE BAJA</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700">Nota u Observación (Motivo de Estado)</label><textarea name="motivo" rows={1} value={formData.motivo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm bg-white" /></div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE 2: HARDWARE Y RED */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">2. Hardware y Red</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div><label className="block text-sm font-medium text-gray-700">Procesador</label><input name="procesador" value={formData.procesador} onChange={handleChange} placeholder="Ej. Intel Core i5-10400" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" /></div>
             
             {/* Desplegable de RAM */}
             <div>
                <label className="block text-sm font-medium text-gray-700">Memoria RAM</label>
                <select name="memoria_ram" value={formData.memoria_ram} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm">
                  <option value="">Seleccionar...</option>
                  <option value="4 GB">4 GB</option>
                  <option value="8 GB">8 GB</option>
                  <option value="12 GB">12 GB</option>
                  <option value="16 GB">16 GB</option>
                  <option value="32 GB">32 GB</option>
                  <option value="64 GB">64 GB</option>
                  <option value="Otro">Otro</option>
                </select>
             </div>
             
             {/* Desplegable de Almacenamiento */}
             <div>
                <label className="block text-sm font-medium text-gray-700">Almacenamiento</label>
                <select name="almacenamiento" value={formData.almacenamiento} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm">
                  <option value="">Seleccionar...</option>
                  <option value="256 GB SSD">256 GB SSD</option>
                  <option value="512 GB SSD">512 GB SSD</option>
                  <option value="1 TB SSD">1 TB SSD</option>
                  <option value="500 GB HDD">500 GB HDD</option>
                  <option value="1 TB HDD">1 TB HDD</option>
                  <option value="Otro">Otro</option>
                </select>
             </div>

             <div><label className="block text-sm font-medium text-gray-700">Nombre de PC en Red</label><input name="nombre_red_pc" value={formData.nombre_red_pc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" /></div>
             <div><label className="block text-sm font-medium text-gray-700">Dirección IP</label><input name="direccion_ip" value={formData.direccion_ip} onChange={handleChange} placeholder="Ej. 192.168.1.100" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm font-mono text-sm" /></div>
             <div><label className="block text-sm font-medium text-gray-700">Dirección MAC</label><input name="direccion_mac" value={formData.direccion_mac} onChange={handleChange} placeholder="Ej. 00:1A:2B:3C:4D:5E" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm font-mono text-sm uppercase" /></div>
          </div>
        </section>

        {/* BLOQUE 3: SOFTWARE */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">3. Software Base</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Desplegable de Sistema Operativo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Sistema Operativo</label>
              <select name="sistema_operativo" value={formData.sistema_operativo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm">
                <option value="">Seleccionar...</option>
                <option value="Windows 10 Pro">Windows 10 Pro</option>
                <option value="Windows 10 Home">Windows 10 Home</option>
                <option value="Windows 11 Pro">Windows 11 Pro</option>
                <option value="Windows 7 Professional">Windows 7 Professional</option>
                <option value="Linux / Ubuntu">Linux / Ubuntu</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
             <div><label className="block text-sm font-medium text-gray-700">Antivirus</label><input name="antivirus" value={formData.antivirus} onChange={handleChange} placeholder="Ej. ESET Endpoint Security" className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" /></div>
             <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Clave VNC (Acceso Remoto)</label><input name="clave_vnc" value={formData.clave_vnc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" /></div>
          </div>
        </section>

        {/* BLOQUE 4: SISTEMAS Y ASIGNACIÓN */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-8">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">4. Accesos y Personal Asignado</h3>
            
          {/* Asignación de Usuario */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h4 className="text-sm font-bold text-blue-800 mb-3">👤 Asignación de Responsable</h4>
            <div>
              <select name="id_usuario" value={formData.id_usuario} onChange={handleChange} className="block w-full border border-gray-300 rounded-md p-2.5 shadow-sm bg-white">
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

          {/* Switches de Sistemas */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-3">🔌 Configuración de Red y Sistemas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" name="tiene_sap" checked={formData.tiene_sap} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <span className="ml-3 font-medium text-sm text-gray-700">Sistema SAP</span>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" name="tiene_ses" checked={formData.tiene_ses} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <span className="ml-3 font-medium text-sm text-gray-700">Sistema SES</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" name="tiene_winepi" checked={formData.tiene_winepi} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <span className="ml-3 font-medium text-sm text-gray-700">WINEPI</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" name="tiene_sinadef" checked={formData.tiene_sinadef} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <span className="ml-3 font-medium text-sm text-gray-700">SINADEF</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" name="en_dominio" checked={formData.en_dominio} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <span className="ml-3 font-medium text-sm text-gray-700">Dominio Local</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" name="tiene_internet" checked={formData.tiene_internet} onChange={handleCheckboxChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <span className="ml-3 font-medium text-sm text-gray-700">Internet Abierta</span>
              </label>

            </div>
          </div>

        </section>

        {/* BOTONES DE ACCIÓN FLOTANTES O AL FINAL */}
        <div className="flex justify-end space-x-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky bottom-4">
          <button type="button" onClick={() => router.push('/equipos')} className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-bold shadow-md transition-all">
            {loading ? 'Guardando...' : 'Registrar Equipo'}
          </button>
        </div>
      </form>
    </div>
  );
}