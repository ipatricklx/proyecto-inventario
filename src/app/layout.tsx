'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@/app/globals.css';

import { 
  Home, 
  Monitor, 
  Building2, 
  Users, 
  Printer, 
  PieChart, 
  LogOut, 
  Menu,
  Activity
} from 'lucide-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
    return <html lang="es"><body>{children}</body></html>;
  }

  if (!mounted) {
    return <html lang="es"><body><div className="min-h-screen bg-gray-50" /></body></html>;
  }

  const navItems = [
    { name: 'Principal', path: '/', icon: Home },
    { name: 'Equipos', path: '/equipos', icon: Monitor, matchPaths: ['/equipos', '/nuevo-equipo', '/editar-equipo', '/detalles-equipo'] },
    { name: 'Ubicaciones', path: '/ubicaciones', icon: Building2 },
    { name: 'Personal', path: '/usuarios', icon: Users },
    { name: 'Periféricos', path: '/perifericos', icon: Printer },
    { name: 'Reportes', path: '#', icon: PieChart },
  ];

  const isActive = (item: any) => {
    if (item.matchPaths) {
      return item.matchPaths.some((p: string) => pathname.startsWith(p));
    }
    return pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
  };

  return (
    <html lang="es">
      {/* Añadimos print:h-auto y print:overflow-visible para que el PDF no se corte */}
      <body className="flex h-screen bg-gray-50 overflow-hidden font-sans antialiased text-gray-900 print:h-auto print:overflow-visible print:bg-white">
        
        {/* SIDEBAR - Le agregamos print:hidden para que desaparezca en el PDF */}
        <aside 
          className={`bg-slate-950 text-slate-300 flex flex-col transition-all duration-300 ease-in-out z-20 shadow-2xl relative print:hidden ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          <div className="h-16 flex items-center justify-center border-b border-white/5 transition-colors">
            <div className="flex items-center gap-2 text-blue-500">
              <Activity className={`transition-all duration-300 ${sidebarOpen ? 'w-7 h-7' : 'w-6 h-6'}`} />
              <h1 className={`font-black tracking-tight text-white transition-all duration-300 overflow-hidden whitespace-nowrap ${
                sidebarOpen ? 'w-auto opacity-100 text-xl' : 'w-0 opacity-0'
              }`}>
                MedTrack
              </h1>
            </div>
          </div>

          <nav className="flex-1 py-6 space-y-1.5 px-3 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.name}
                  href={item.path} 
                  className={`flex items-center space-x-3 p-3 rounded-xl font-medium transition-all duration-200 group relative ${
                    active ? 'bg-blue-600/15 text-blue-400' : 'hover:bg-white/5 hover:text-white'
                  }`}
                  title={!sidebarOpen ? item.name : ''}
                >
                  <Icon strokeWidth={active ? 2.5 : 2} className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${!active && 'group-hover:scale-110'}`} />
                  <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                    {item.name}
                  </span>
                  {active && sidebarOpen && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-3 rounded-xl transition-all duration-200 group" title={!sidebarOpen ? 'Cerrar Sesión' : ''}>
              <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap font-medium ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Cerrar Sesión
              </span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL - Ajustamos el overflow para la impresora */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC] print:overflow-visible print:h-auto print:bg-white">
          
          {/* TOPBAR - Le agregamos print:hidden */}
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-16 flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0 print:hidden">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <Menu className="w-5 h-5" />
              </button>
              <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
              <h1 className="text-sm font-semibold text-slate-600 hidden sm:block tracking-wide uppercase">
                Sistema de Gestión Informática
              </h1>
            </div>
            
            <div className="flex items-center">
               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200">
                 A
               </div>
            </div>
          </header>

          {/* ÁREA DE LA PÁGINA - Eliminamos scrolls y paddings fijos al imprimir */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 custom-scrollbar print:overflow-visible print:h-auto print:p-0">
            <div className="max-w-7xl mx-auto animate-fadeIn print:max-w-none">
              {children}
            </div>
          </div>
        </main>

      </body>
    </html>
  );
}