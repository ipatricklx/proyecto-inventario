'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditarUbicacionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); // Obtenemos el ID de la URL
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    red_asistencial: '',
    centro_asistencial: '',
    departamento: '',
    servicio: '',
    area: ''
  });

  useEffect(() => {
    cargarDatosUbicacion();
  }, [id]);

  async function cargarDatosUbicacion() {
    const { data, error } = await supabase
      .from('ubicaciones')
      .select('*')
      .eq('id_ubicacion', id)
      .single();

    if (error) {
      alert('Error al cargar la ubicación: ' + error.message);
      router.push('/ubicaciones');
      return;
    }

    if (data) {
      // Seteamos los datos cargados, manejando nulos por si acaso
      setFormData({
        red_asistencial: data.red_asistencial || '',
        centro_asistencial: data.centro_asistencial || '',
        departamento: data.departamento || '',
        servicio: data.servicio || '',
        area: data.area || ''
      });
    }
    setInitialLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Usamos .update() en lugar de .insert() y filtramos por ID
    const { error } = await supabase
      .from('ubicaciones')
      .update(formData)
      .eq('id_ubicacion', id);

    if (error) {
      alert('Error al actualizar ubicación: ' + error.message);
      setLoading(false);
      return;
    }

    router.push('/ubicaciones'); 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mantenemos la lógica de guardar en mayúsculas
    setFormData({ ...formData, [e.target.name]: e.target.value.toUpperCase() }); 
  };

  if (initialLoading) {
    return <div className="text-center py-20 text-gray-500 font-medium">Cargando datos del área...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Editar Área / Servicio</h2>
          <p className="text-gray-500 text-sm mt-1">Modifica la información de esta ubicación en la estructura orgánica.</p>
        </div>
        <Link href="/ubicaciones" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-1">Red Asistencial</label>
            <input 
              required name="red_asistencial" value={formData.red_asistencial} onChange={handleChange} 
              className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-1">Centro Asistencial</label>
            <input 
              required name="centro_asistencial" value={formData.centro_asistencial} onChange={handleChange} 
              className="block w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500" 
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