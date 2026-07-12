'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
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
  Menu
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
    { name: 'Reportes', path: '/Reportes', icon: PieChart },
  ];

  const isActive = (item: any) => {
    if (item.matchPaths) {
      return item.matchPaths.some((p: string) => pathname.startsWith(p));
    }
    return pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
  };

  return (
    <html lang="es">
      <body className="flex h-screen bg-[#F4F7FA] overflow-hidden font-sans antialiased text-gray-900 print:h-auto print:overflow-visible print:bg-white">
        
        {/* SIDEBAR */}
        <aside 
          className={`bg-[#002B49] text-slate-300 flex flex-col transition-all duration-300 ease-in-out z-20 shadow-2xl relative print:hidden ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          <div className="h-16 flex items-center justify-center border-b border-white/10 transition-colors mt-2 mb-2">
            <div className="flex items-center gap-3">
              {/* Logo Personalizado */}
            <div className="relative flex items-center justify-center w-10 h-10 flex-shrink-0">
              <Image 
                src="/logo_animado_icono.gif" 
                alt="Logo Animado" 
                width={40} 
                height={40} 
                className={`object-contain transition-all duration-300 ${sidebarOpen ? 'scale-100' : 'scale-90'}`}
                unoptimized 
              />
            </div>
              
              {/* Texto del Logo */}
              <div className={`flex flex-col transition-all duration-300 overflow-hidden whitespace-nowrap ${
                sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'
              }`}>
                <span className="font-black tracking-tight text-white text-xl leading-none">
                  EsSalud
                </span>
                <span className="text-[#009BDE] font-bold text-[10px] tracking-widest uppercase mt-0.5">
                  Inventario
                </span>
              </div>
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
                    active 
                      ? 'bg-[#009BDE]/15 text-[#009BDE]' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title={!sidebarOpen ? item.name : ''}
                >
                  <Icon strokeWidth={active ? 2.5 : 2} className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${!active && 'group-hover:scale-110'}`} />
                  <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                    {item.name}
                  </span>
                  {/* Puntito indicador activo */}
                  {active && sidebarOpen && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#009BDE] animate-pulse shadow-[0_0_8px_rgba(0,155,222,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-3 text-slate-400 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 p-3 rounded-xl transition-all duration-200 group" title={!sidebarOpen ? 'Cerrar Sesión' : ''}>
              <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap font-medium ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Cerrar Sesión
              </span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F4F7FA] print:overflow-visible print:h-auto print:bg-white">
          
          {/* TOPBAR */}
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-16 flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0 print:hidden">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#009BDE]/30">
                <Menu className="w-5 h-5" />
              </button>
              <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
              <h1 className="text-sm font-semibold text-[#002B49] hidden sm:block tracking-wide uppercase">
                Gestión de Patrimonio Informático
              </h1>
            </div>
            
            <div className="flex items-center">
               <div className="w-8 h-8 rounded-full bg-[#009BDE]/10 flex items-center justify-center text-[#002B49] font-bold text-xs border border-[#009BDE]/20 shadow-sm">
                 AD {/* */}
               </div>
            </div>
          </header>

          {/* ÁREA DE LA PÁGINA */}
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