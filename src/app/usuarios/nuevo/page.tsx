'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    cod_planilla: '',
    apellidos: '',
    nombres: '',
    email_institucional: '',
    anexo: '',
    usuario_red_windows: '',
    activo: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('usuarios').insert([formData]);

    if (error) {
      alert('Error al registrar personal: ' + error.message);
      setLoading(false);
      return;
    }

    router.push('/usuarios'); 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Apellidos y nombres los forzamos a mayúsculas para mantener orden, el resto normal
    const val = (e.target.name === 'apellidos' || e.target.name === 'nombres') 
                ? e.target.value.toUpperCase() 
                : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Registrar Personal</h2>
          <p className="text-gray-500 text-sm mt-1">Añade un nuevo trabajador para poder asignarle equipos.</p>
        </div>
        <Link href="/usuarios" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        
        {/* IDENTIFICACIÓN */}
        <div>
          <h3 className="text-sm font-bold text-blue-800 mb-4 border-b pb-2">1. Identificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Cód. Planilla / DNI</label>
              <input name="cod_planilla" value={formData.cod_planilla} onChange={handleChange} placeholder="Ej: 14626282" className="block w-full md:w-1/2 border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Apellidos (Obligatorio)</label>
              <input required name="apellidos" value={formData.apellidos} onChange={handleChange} placeholder="Ej: ZAVALA CRUZADO" className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombres (Obligatorio)</label>
              <input required name="nombres" value={formData.nombres} onChange={handleChange} placeholder="Ej: DOMINGO MAXIMO" className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* CONTACTO Y SISTEMA */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-blue-800 mb-4 border-b pb-2">2. Contacto y Red</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Institucional</label>
              <input type="email" name="email_institucional" value={formData.email_institucional} onChange={handleChange} placeholder="ejemplo@essalud.gob.pe" className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Anexo Telefónico</label>
              <input name="anexo" value={formData.anexo} onChange={handleChange} placeholder="Ej: 2045" className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-xs font-bold text-gray-700 mb-1">Usuario de Red / Windows</label>
              <input name="usuario_red_windows" value={formData.usuario_red_windows} onChange={handleChange} placeholder="Ej: OP1URO" className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500 font-mono" />
              <p className="text-xs text-gray-500 mt-1">El nombre de usuario con el que inicia sesión en la PC.</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 text-right">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-bold shadow-md">
            {loading ? 'Guardando...' : 'Registrar Personal'}
          </button>
        </div>
      </form>
    </div>
  );
}