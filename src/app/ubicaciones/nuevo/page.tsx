'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevaUbicacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    red_asistencial: 'R. A. La Libertad',
    centro_asistencial: 'HOSPITAL II CHOCOPE',
    departamento: '',
    servicio: '',
    area: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('ubicaciones')
      .insert([formData]);

    if (error) {
      alert('Error al guardar ubicación: ' + error.message);
      setLoading(false);
      return;
    }

    router.push('/ubicaciones'); 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.toUpperCase() }); // Lo guardamos en mayúsculas como en el Excel
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Agregar Nueva Área</h2>
          <p className="text-gray-500 text-sm mt-1">Registra un nuevo espacio en la estructura orgánica del hospital.</p>
        </div>
        <Link href="/ubicaciones" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-1">Red Asistencial</label>
            <input 
              required name="red_asistencial" value={formData.red_asistencial} onChange={handleChange} 
              className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white" 
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-1">Centro Asistencial</label>
            <input 
              required name="centro_asistencial" value={formData.centro_asistencial} onChange={handleChange} 
              className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white" 
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Departamento (Opcional)</label>
            <input 
              name="departamento" value={formData.departamento} onChange={handleChange} placeholder="Ej: DPTO CIRUGIA"
              className="block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Servicio (Obligatorio)</label>
            <input 
              required name="servicio" value={formData.servicio} onChange={handleChange} placeholder="Ej: EMERGENCIA"
              className="block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Área Específica (Opcional)</label>
            <input 
              name="area" value={formData.area} onChange={handleChange} placeholder="Ej: TRIAJE DIFERENCIADO COVID 19"
              className="block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white" 
            />
            <p className="text-xs text-gray-500 mt-1">Usa este campo si el equipo está en un cuarto o sector muy específico dentro del Servicio.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 text-right">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-bold shadow-md">
            {loading ? 'Guardando...' : 'Registrar Ubicación'}
          </button>
        </div>
      </form>
    </div>
  );
}