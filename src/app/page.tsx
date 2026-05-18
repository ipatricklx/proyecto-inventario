'use client';

export default function DashboardPage() {
  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Módulo Principal / Dashboard</h2>
        <p className="text-gray-500 text-sm">Resumen analítico de la infraestructura tecnológica del hospital.</p>
      </div>

      {/* TARJETAS DE EJEMPLO DE CAPACIDAD (Próximamente dinámicas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase">Total Equipos</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">--</p>
          </div>
          <span className="text-3xl bg-blue-50 p-3 rounded-lg text-blue-600">💻</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase">Operativos</p>
            <p className="text-2xl font-bold text-green-600 mt-1">--</p>
          </div>
          <span className="text-3xl bg-green-50 p-3 rounded-lg text-green-600">✅</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase">Periféricos</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">--</p>
          </div>
          <span className="text-3xl bg-purple-50 p-3 rounded-lg text-purple-600">🖨️</span>
        </div>

         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase">Usuarios</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">--</p>
          </div>
          <span className="text-3xl bg-purple-50 p-3 rounded-lg text-purple-600">👥</span>
        </div>

        {/* NUEVA TARJETA DE UBICACIONES */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase">Áreas / Serv.</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">--</p>
          </div>
          <span className="text-3xl bg-teal-50 p-3 rounded-lg text-teal-600">🏥</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase">Alertas / Bajas</p>
            <p className="text-2xl font-bold text-red-600 mt-1">--</p>
          </div>
          <span className="text-3xl bg-red-50 p-3 rounded-lg text-red-600">⚠️</span>
        </div>
      </div>

      {/* CONTENEDOR EN BLANCO */}
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="text-lg font-bold text-gray-700">Gráficos Estadísticos</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto mt-1">
          Aquí implementaremos próximamente los reportes visuales en tiempo real de Supabase (Equipos por área, marcas más usadas, etc.).
        </p>
      </div>
    </div>
  );
}