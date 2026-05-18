'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Si estás en la página de login, no mostramos el Sidebar
  if (pathname === '/login') {
    return (
      <html lang="es">
        <body>{children}</body>
      </html>
    );
  }

  if (!mounted) {
    return (
      <html lang="es">
        <body><div className="min-h-screen bg-gray-50" /></body>
      </html>
    );
  }

  // Función utilitaria para saber qué enlace marcar como activo
  const isActive = (path: string) => pathname === path;

  return (
    <html lang="es">
      <body className="flex h-screen bg-gray-50 overflow-hidden font-sans antialiased text-gray-900">
        
        {/* SIDEBAR LATERAL GLOBAL */}
        <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-300 z-20 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="h-16 flex items-center justify-center border-b border-slate-800">
            <h1 className={`font-black text-blue-400 transition-all ${sidebarOpen ? 'text-2xl' : 'text-sm'}`}>
              {sidebarOpen ? <>Med<span className="text-white">Track</span></> : 'MT'}
            </h1>
          </div>

          <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
            {/* MÓDULO PRINCIPAL (Dashboard) */}
            <Link 
              href="/" 
              className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-all group ${
                isActive('/') 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Principal / Dashboard"
            >
              <span className="text-xl">🏠</span>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Principal</span>
            </Link>

            {/* MÓDULO EQUIPOS */}
            <Link 
              href="/equipos" 
              className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-all group ${
                pathname.startsWith('/equipos') || pathname.startsWith('/nuevo-equipo') || pathname.startsWith('/editar-equipo') || pathname.startsWith('/detalles-equipo')
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Gestión de Equipos"
            >
              <span className="text-xl">💻</span>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Equipos</span>
            </Link>

            {/* MÓDULO UBICACIONES */}
            <Link 
              href="/ubicaciones" 
              className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-all group ${
                pathname.startsWith('/ubicaciones')
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Gestión de Ubicaciones"
            >
              <span className="text-xl">🏥</span>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Ubicaciones</span>
            </Link>

            {/* MÓDULO PERSONAL (USUARIOS) */}
            <Link 
              href="/usuarios" 
              className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-all group ${
                pathname.startsWith('/usuarios')
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Gestión de Personal"
            >
              <span className="text-xl">👥</span>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Personal</span>
            </Link>

            {/* MÓDULO PERIFÉRICOS */}
            <Link href="#" className="flex items-center space-x-3 text-slate-300 hover:bg-slate-800 hover:text-white p-3 rounded-lg font-medium transition-all group" title="Periféricos (Próximamente)">
              <span className="text-xl">🖨️</span>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Periféricos</span>
            </Link>

            {/* MÓDULO REPORTES */}
            <Link href="#" className="flex items-center space-x-3 text-slate-300 hover:bg-slate-800 hover:text-white p-3 rounded-lg font-medium transition-all group" title="Reportes y Estadísticas">
              <span className="text-xl">📊</span>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Reportes</span>
            </Link>
          </nav>

          {/* PERFIL / LOGOUT */}
          <div className="p-4 border-t border-slate-800 flex flex-col space-y-2">
            {sidebarOpen && (
              <div className="text-xs text-slate-400 text-center mb-2">Hospital II Chocope</div>
            )}
            <button onClick={handleLogout} className="flex items-center justify-center space-x-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 p-2 rounded-lg transition-all" title="Cerrar Sesión">
              <span className="text-lg">🚪</span>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO CENTRAL DE LA APLICACIÓN */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* BARRA SUPERIOR (TOPNAV) */}
          <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 mr-4 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-lg font-bold text-gray-700">Sistema de Gestión Informática</h1>
            </div>
          </header>

          {/* ÁREA DE CONTENIDO DINÁMICO */}
          <div className="flex-1 overflow-auto p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>

      </body>
    </html>
  );
}