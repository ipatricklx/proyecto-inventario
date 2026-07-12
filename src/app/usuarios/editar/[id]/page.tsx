'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Terminal,
  Contact
} from 'lucide-react';

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); 
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    cod_planilla: '',
    apellidos: '',
    nombres: '',
    email_institucional: '',
    anexo: '',
    usuario_red_windows: ''
  });

  useEffect(() => {
    cargarDatosUsuario();
  }, [id]);

  async function cargarDatosUsuario() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_usuario', id)
      .single();

    if (error) {
      alert('Error al cargar los datos del usuario: ' + error.message);
      router.push('/usuarios');
      return;
    }

    if (data) {
      setFormData({
        cod_planilla: data.cod_planilla || '',
        apellidos: data.apellidos || '',
        nombres: data.nombres || '',
        email_institucional: data.email_institucional || '',
        anexo: data.anexo || '',
        usuario_red_windows: data.usuario_red_windows || ''
      });
    }
    setInitialLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('usuarios')
      .update(formData)
      .eq('id_usuario', id);

    if (error) {
      alert('Error al actualizar el personal: ' + error.message);
      setLoading(false);
      return;
    }

    router.push('/usuarios'); 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = (e.target.name === 'apellidos' || e.target.name === 'nombres') 
                ? e.target.value.toUpperCase() 
                : e.target.value;
                
    setFormData({ ...formData, [e.target.name]: val });
  };

  if (initialLoading) {
    return <div className="text-center py-20 text-slate-500 font-medium animate-pulse">Cargando datos del personal...</div>;
  }

  const inputStyles = "block w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all duration-200";

  return (
    <div className="max-w-4xl mx-auto bg-[#F8FAFC] min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      
      {/* CABECERA */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Editar Datos de Personal</h2>
          <p className="text-slate-500 text-sm mt-1">Actualiza los registros de identificación, medios de contacto y credenciales de red del trabajador.</p>
        </div>
        <Link 
          href="/usuarios" 
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al directorio
        </Link>
      </div>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* TARJETA 1: IDENTIFICACIÓN PRINCIPAL */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2.5">
            <User className="w-5 h-5 text-amber-500" /> 1. Identificación del Trabajador
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Código Planilla / DNI</label>
              <input 
                name="cod_planilla" 
                value={formData.cod_planilla} 
                onChange={handleChange} 
                placeholder="Ej. 14626282" 
                className={`${inputStyles} md:w-1/2 font-mono font-medium tracking-wide`} 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Apellidos <span className="text-red-500">*</span></label>
              <input 
                required 
                name="apellidos" 
                value={formData.apellidos} 
                onChange={handleChange} 
                placeholder="Ej. PÉREZ GÓMEZ"
                className={`${inputStyles} font-semibold`} 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombres <span className="text-red-500">*</span></label>
              <input 
                required 
                name="nombres" 
                value={formData.nombres} 
                onChange={handleChange} 
                placeholder="Ej. JUAN CARLOS"
                className={`${inputStyles} font-semibold`} 
              />
            </div>
          </div>
        </div>

        {/* TARJETA 2: CONTACTO Y DIRECTORIO ACTIVO */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/60 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2.5">
            <Contact className="w-5 h-5 text-blue-500" /> 2. Canales de Contacto e Infraestructura
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Institucional
              </label>
              <input 
                type="email" 
                name="email_institucional" 
                value={formData.email_institucional} 
                onChange={handleChange} 
                placeholder="juan.perez@institucion.gob.pe"
                className={inputStyles} 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Anexo Telefónico
              </label>
              <input 
                name="anexo" 
                value={formData.anexo} 
                onChange={handleChange} 
                placeholder="Ej. 4051 / 2210"
                className={`${inputStyles} font-medium`} 
              />
            </div>
            
            {/* CAJA ENFOCADA EN CREDENCIAL DE WINDOWS */}
            <div className="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 mt-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-teal-600" /> Nombre de Usuario de Red / Windows
              </label>
              <input 
                name="usuario_red_windows" 
                value={formData.usuario_red_windows} 
                onChange={handleChange} 
                placeholder="Ej. jperezg / dominio\jperez"
                className={`${inputStyles} font-mono text-teal-800 bg-white shadow-xs`} 
              />
              <p className="text-xs text-slate-400 mt-2">
                Este identificador vincula las asignaciones de PCs locales en la infraestructura del dominio institucional.
              </p>
            </div>
          </div>
        </div>

        {/* ACCIONES DE FORMULARIO */}
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