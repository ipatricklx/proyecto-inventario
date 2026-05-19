'use client';
import { useEffect, useState, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react'; // 👈 Importador del generador de QR
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Cpu, 
  Monitor, 
  User, 
  History, 
  QrCode, 
  Printer,
  ShieldCheck,
  AlertTriangle,
  XCircle
} from 'lucide-react'; // Iconos profesionales

export default function DetallesEquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [equipo, setEquipo] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDatos();
  }, [id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      // Genera la URL absoluta basándose en el dominio actual de la app
      const currentUrl = `https://proyecto-inventario-three.vercel.app/detalles-equipo/${id}`;
      setQrUrl(currentUrl);
    }
  }, [id]);

  async function getDatos() {
    const { data: equipoData } = await supabase
      .from('equipos')
      .select(`
        *, 
        ubicaciones(servicio, area),
        usuarios(nombres, apellidos, anexo, email_institucional)
      `)
      .eq('id_equipo', Number(id))
      .single();

    if (equipoData) setEquipo(equipoData);

    const { data: historialData } = await supabase
      .from('estados_equipo')
      .select('*')
      .eq('id_equipo', Number(id))
      .order('fecha', { ascending: false });

    if (historialData) setHistorial(historialData);
    
    setLoading(false);
  }

  // Función nativa optimizada para impresión de stickers de inventario
  const handlePrintQR = () => {
    const printContent = qrRef.current?.innerHTML;
    if (printContent) {
      const win = window.open('', '', 'height=400,width=400');
      win?.document.write(`
        <html>
          <head>
            <title>Sticker Inventario - MedTrack</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                text-align: center;
              }
              .qr-box { padding: 5px; background: white; }
              .label-id { font-size: 14px; font-weight: 800; margin-top: 10px; color: #1e293b; letter-spacing: 0.5px; }
              .label-pat { font-size: 11px; font-weight: 600; margin-top: 2px; color: #475569; font-family: monospace; }
              .brand { font-size: 9px; color: #94a3b8; margin-top: 8px; font-weight: 700; letter-spacing: 1px; }
            </style>
          </head>
          <body>
            <div class="qr-box">${printContent}</div>
            <div class="label-id">CÓD. INTERNO: #EQ-${id}</div>
            <div class="label-pat">SBN: ${equipo?.cod_patrimonio || 'S/N'}</div>
            <div class="brand">MEDTRACK INVENTARIO</div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      win?.document.close();
    }
  };

  // Helper visual para colores de estados en sistema
  const getBadgeEstado = (estado: string) => {
    switch(estado?.toUpperCase()) {
      case 'GARANTIA': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'OBSOLETO': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'BAJA': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Cargando ficha técnica...</div>;
  if (!equipo) return <div className="text-center py-20 text-red-500 font-bold">Error: Equipo no encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Ficha Técnica del Equipo</h2>
          <div className="text-gray-500 mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">Patrimonio SBN:</span> 
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{equipo.cod_patrimonio || 'N/A'}</span> 
            
            {equipo.cod_patrimonio_verde && (
              <>
                <span className="text-gray-300">|</span>
                <span className="font-medium">Etiqueta Verde:</span>
                <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">{equipo.cod_patrimonio_verde}</span>
              </>
            )}
            
            <span className="text-gray-300">|</span>
            <span className="font-medium">Estado:</span> 
            <span className={`font-bold px-2 py-0.5 rounded border text-xs ${getBadgeEstado(equipo.estado)}`}>
              {equipo.estado}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <Link href="/equipos" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition shadow-xs">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <Link href={`/editar-equipo/${id}`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm">
            <Edit className="w-4 h-4" /> Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: DATOS Y HARDWARE */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TARJETA: DATOS GENERALES */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> Información General
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Tipo de Equipo</p><p className="font-bold text-gray-700 mt-0.5">{equipo.tipo_equipo}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Marca / Modelo</p><p className="font-bold text-gray-700 mt-0.5">{equipo.marca || 'N/A'} {equipo.modelo ? `- ${equipo.modelo}` : ''}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Número de Serie</p><p className="font-mono font-medium text-gray-600 mt-0.5">{equipo.numero_serie || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Cód. Etiqueta Verde</p><p className={`font-bold mt-0.5 ${equipo.cod_patrimonio_verde ? 'text-green-600' : 'text-gray-400'}`}>{equipo.cod_patrimonio_verde || 'Sin etiqueta'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Cód. Etiqueta Azul (SBN)</p><p className={`font-bold mt-0.5 ${equipo.cod_patrimonio ? 'text-blue-700' : 'text-gray-400'}`}>{equipo.cod_patrimonio || 'Sin etiqueta'}</p></div>
              <div className="sm:col-span-2"><p className="text-gray-400 text-xs font-semibold uppercase">Ubicación Física</p><p className="font-bold text-blue-700 mt-0.5">{equipo.ubicaciones ? `${equipo.ubicaciones.servicio} — ${equipo.ubicaciones.area}` : 'Almacén / Sin Asignar'}</p></div>
            </div>
          </div>

          {/* TARJETA: HARDWARE Y RED */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" /> Hardware y Red
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Procesador</p><p className="font-semibold text-gray-700 mt-0.5">{equipo.procesador || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Memoria RAM</p><p className="font-semibold text-gray-700 mt-0.5">{equipo.memoria_ram || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Almacenamiento</p><p className="font-semibold text-gray-700 mt-0.5">{equipo.almacenamiento || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Nombre en Red</p><p className="font-mono font-bold text-gray-700 mt-0.5">{equipo.nombre_red_pc || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Dirección IP</p><p className="font-mono text-blue-600 font-bold mt-0.5">{equipo.direccion_ip || 'DHCP/N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Dirección MAC</p><p className="font-mono text-gray-500 mt-0.5">{equipo.direccion_mac || 'N/A'}</p></div>
            </div>
          </div>

          {/* TARJETA: SOFTWARE */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-emerald-500" /> Software y Soporte Remote
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Sistema Operativo</p><p className="font-semibold text-gray-700 mt-0.5">{equipo.sistema_operativo || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase">Antivirus</p><p className="font-semibold text-gray-700 mt-0.5">{equipo.antivirus || 'N/A'}</p></div>
              <div className="col-span-2">
                <p className="text-gray-400 text-xs font-semibold uppercase">Clave VNC (Acceso Remoto)</p>
                <p className="font-mono bg-red-50 border border-red-100 px-2.5 py-1 inline-block rounded-lg text-red-600 font-bold tracking-wider mt-1 text-xs">
                  {equipo.clave_vnc || 'No registrada'}
                </p>
              </div>
            </div>
          </div>

          {/* TARJETA: ASIGNACIÓN Y ACCESOS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-500" /> Asignación y Permisos de Red
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Usuario Responsable</p>
                {equipo.usuarios ? (
                  <div className="flex items-center gap-3 bg-blue-50/60 p-3 rounded-xl border border-blue-100/70">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {equipo.usuarios.nombres.charAt(0)}{equipo.usuarios.apellidos.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-blue-900">{equipo.usuarios.apellidos}, {equipo.usuarios.nombres}</p>
                      <p className="text-xs text-blue-600/90 font-medium">Anexo Central: {equipo.usuarios.anexo || 'N/A'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-gray-500 italic text-sm">
                    Equipo libre / Stock Almacén
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Sistemas y Accesos Autorizados</p>
                <div className="flex flex-wrap gap-1.5">
                  {equipo.tiene_sap && <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs px-2 py-0.5 rounded font-bold">SAP</span>}
                  {equipo.tiene_ses && <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs px-2 py-0.5 rounded font-bold">SES</span>}
                  {equipo.tiene_winepi && <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs px-2 py-0.5 rounded font-bold">WINEPI</span>}
                  {equipo.tiene_sinadef && <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs px-2 py-0.5 rounded font-bold">SINADEF</span>}
                  {equipo.en_dominio && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded font-bold">Dominio Intranet</span>}
                  {equipo.tiene_internet && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded font-bold">Internet Global</span>}
                  
                  {(!equipo.tiene_sap && !equipo.tiene_ses && !equipo.tiene_winepi && !equipo.tiene_sinadef && !equipo.en_dominio && !equipo.tiene_internet) && (
                    <span className="text-gray-400 italic text-xs">Instalación Base Limpia</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: GENERACIÓN DE QR + HISTORIAL */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* SECCIÓN NUEVA: GENERADOR QR MINIMALISTA */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center text-center">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mb-4 self-start">
              <QrCode className="w-4 h-4 text-blue-500" /> Identificador Físico QR
            </h4>
            
            {/* El div que captura la ventana de impresión */}
            <div ref={qrRef} className="bg-white p-3 rounded-xl border border-slate-100 shadow-inner mb-4">
              {qrUrl ? (
                <QRCodeSVG 
                  value={qrUrl} 
                  size={140} 
                  level="H" // Tolerancia alta a rayaduras o suciedad física
                  includeMargin={false}
                />
              ) : (
                <div className="w-[140px] h-[140px] bg-slate-100 animate-pulse rounded-xl" />
              )}
            </div>

            <p className="text-xs text-gray-400 px-2 mb-4 leading-relaxed">
              Escanea con cualquier smartphone corporativo para acceder directo a la ficha técnica física en tiempo real.
            </p>

            <button
              onClick={handlePrintQR}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Etiqueta SBN
            </button>
          </div>

          {/* BITÁCORA HISTÓRICA DE ESTADOS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" /> Bitácora Técnica
            </h3>
            
            {historial.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">Sin novedades registradas.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:bg-gray-100">
                {historial.map((hito, index) => (
                  <div key={hito.id_estado || index} className="relative flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full border-2 border-white mt-1.5 shrink-0 z-10 ml-1.5 shadow-xs ${
                      hito.tipo_estado === 'BAJA' ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold ${hito.tipo_estado === 'BAJA' ? 'text-red-600' : 'text-blue-600'}`}>{hito.tipo_estado}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-medium">
                          {new Date(hito.fecha || hito.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-normal">{hito.motivo || 'Cambio operativo de estado general.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}