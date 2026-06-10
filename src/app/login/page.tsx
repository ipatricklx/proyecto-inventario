'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

// ==========================================
// COMPONENTE: SVG ANIMADO DE SEGURIDAD
// ==========================================
const AnimatedSecurityLogo = () => (
  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#009BDE]/10 mb-6 relative group">
    {/* Anillo exterior que hace "pulso" */}
    <div className="absolute inset-0 rounded-full animate-ping bg-[#009BDE] opacity-20 duration-1000"></div>
    
    <div className="relative flex items-center justify-center h-14 w-14 overflow-hidden">
      {/* SVG Principal: Escudo / Monitor */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-[#002B49] w-full h-full relative z-10 transition-transform duration-500 group-hover:scale-110"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        {/* Cruz Médica en el centro */}
        <path d="M12 8v8m-4-4h8" stroke="#009BDE" strokeWidth="2" className="animate-pulse" />
      </svg>
      
      {/* Línea de escáner animada */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#009BDE] opacity-70 z-20 shadow-[0_0_8px_#009BDE] animate-[bounce_2s_infinite]"></div>
    </div>
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setPassword(''); 
        setLoading(false);
      } else {
        // Si es exitoso, redireccionamos
        window.location.href = '/';
      }
    } catch (err) {
      setError("Ocurrió un error inesperado al intentar iniciar sesión.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F4F7FA] p-4 overflow-hidden">
      
      {/* ==========================================
          ELEMENTOS DECORATIVOS DE FONDO 
          ========================================== */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#009BDE]/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#002B49]/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* ==========================================
          TARJETA DE LOGIN
          ========================================== */}
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/90 backdrop-blur-xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white relative z-10">
        
        <div className="text-center">
          <AnimatedSecurityLogo />
          <h2 className="text-3xl font-black text-[#002B49] tracking-tight">EsSalud</h2>
          <p className="mt-2 text-sm font-medium text-[#009BDE] tracking-widest uppercase">
            Inventario
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          
          {/* ALERTA DE ERROR */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            {/* INPUT CORREO */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#009BDE] transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                placeholder="Correo electrónico"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-900 transition-all focus:border-[#009BDE] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#009BDE]/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* INPUT CONTRASEÑA */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#009BDE] transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                placeholder="Contraseña"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-900 transition-all focus:border-[#009BDE] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#009BDE]/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* BOTÓN DE SUBMIT */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full justify-center items-center gap-2 rounded-xl bg-[#002B49] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#002B49]/30 transition-all hover:bg-[#001f35] hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#002B49]/20 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed overflow-hidden"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
              
              {/* Brillo sutil en el botón */}
              <div className="absolute inset-0 -translate-x-full bg-white/20 skew-x-12 animate-[shimmer_3s_infinite]"></div>
            </button>
          </div>
          
        </form>
        
        {/* FOOTER DEL LOGIN */}
        <div className="pt-6 text-center text-xs text-gray-400 border-t border-gray-100">
          Uso exclusivo para personal.
        </div>
      </div>
    </div>
  );
}