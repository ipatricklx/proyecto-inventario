'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); // Desempaquetamos el ID de la URL
  
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
    // Forzamos mayúsculas solo en apellidos y nombres para mantener el orden del Excel
    const val = (e.target.name === 'apellidos' || e.target.name === 'nombres') 
                ? e.target.value.toUpperCase() 
                : e.target.value;
                
    setFormData({ ...formData, [e.target.name]: val });
  };

  if (initialLoading) {
    return <div className="text-center py-20 text-gray-500 font-medium">Cargando datos del personal...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Editar Datos de Personal</h2>
          <p className="text-gray-500 text-sm mt-1">Modifica la información del trabajador en el directorio.</p>
        </div>
        <Link href="/usuarios" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        
        {/* IDENTIFICACIÓN */}
        <div>
          <h3 className="text-sm font-bold text-amber-600 mb-4 border-b pb-2">1. Identificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Cód. Planilla / DNI</label>
              <input 
                name="cod_planilla" value={formData.cod_planilla} onChange={handleChange} placeholder="Ej: 14626282" 
                className="block w-full md:w-1/2 border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Apellidos (Obligatorio)</label>
              <input 
                required name="apellidos" value={formData.apellidos} onChange={handleChange} 
                className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombres (Obligatorio)</label>
              <input 
                required name="nombres" value={formData.nombres} onChange={handleChange} 
                className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500" 
              />
            </div>
          </div>
        </div>

        {/* CONTACTO Y SISTEMA */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-amber-600 mb-4 border-b pb-2">2. Contacto y Red</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Institucional</label>
              <input 
                type="email" name="email_institucional" value={formData.email_institucional} onChange={handleChange} 
                className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Anexo Telefónico</label>
              <input 
                name="anexo" value={formData.anexo} onChange={handleChange} 
                className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500" 
              />
            </div>
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-xs font-bold text-gray-700 mb-1">Usuario de Red / Windows</label>
              <input 
                name="usuario_red_windows" value={formData.usuario_red_windows} onChange={handleChange} 
                className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-amber-500 focus:border-amber-500 font-mono" 
              />
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