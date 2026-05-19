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

  const isActive = (path: string) => pathname === path;

  return (
    <html lang="es">
      <body className="flex h-screen bg-gray-50 overflow-hidden font-sans antialiased text-gray-900">
        
        {/* SIDEBAR */}
        <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-300 z-20 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="h-16 flex items-center justify-center border-b border-slate-800">
            <h1 className={`font-black text-blue-400 transition-all ${sidebarOpen ? 'text-2xl' : 'text-sm'}`}>
              {sidebarOpen ? <>Med<span className="text-white">Track</span></> : 'MT'}
            </h1>
          </div>

          <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
            {/* INICIO */}
            <Link 
              href="/" 
              className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-all ${
                isActive('/') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">🏠</span>
              <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Principal</span>
            </Link>

            {/* EQUIPOS */}
            <Link 
              href="/equipos" 
              className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-all ${
                pathname.startsWith('/equipos') || pathname.startsWith('/nuevo-equipo') || pathname.startsWith('/editar-equipo') || pathname.startsWith('/detalles-equipo')
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">💻</span>
              <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Equipos</span>
            </Link>

            {/* UBICACIONES */}
            <Link 
              href="/ubicaciones" 
              className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-all ${
                pathname.startsWith('/ubicaciones') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">🏥</span>
              <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Ubicaciones</span>
            </Link>

            {/* PERSONAL */}
            <Link 
              href="/usuarios" 
              className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-all ${
                pathname.startsWith('/usuarios') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">👥</span>
              <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Personal</span>
            </Link>

            {/* PERIFÉRICOS (INTEGRADO) */}
            <Link 
              href="/perifericos" 
              className={`flex items-center space-x-3 p-3 rounded-lg font-medium transition-all group ${
                pathname.startsWith('/perifericos')
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Gestión de Periféricos"
            >
              <span className="text-xl">🖨️</span>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Perifericos</span>
            </Link>

            {/* REPORTES */}
            <Link href="#" className="flex items-center space-x-3 text-slate-300 hover:bg-slate-800 p-3 rounded-lg font-medium transition-all group" title="Reportes y Estadísticas">
              <span className="text-xl">📊</span>
              <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Reportes</span>
            </Link>
          </nav>

          {/* LOGOUT */}
          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all">
              <span className="text-lg">🚪</span>
              <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 mr-4 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-lg font-bold text-gray-700">Sistema de Gestión Informática</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>

      </body>
    </html>
  );
}