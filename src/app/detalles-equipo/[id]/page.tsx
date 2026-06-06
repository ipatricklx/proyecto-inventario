'use client';
import { useEffect, useState, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react'; 
import * as XLSX from 'xlsx';
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
  XCircle,
  FileSpreadsheet, 
  FileDown
} from 'lucide-react'; 

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

  // EXPORTAR A EXCEL
  const exportarAExcel = () => {
    if (!equipo) return;
    const libro = XLSX.utils.book_new();

    // Hoja 1: Especificaciones Técnicas (AÑADIDA LA FECHA DE REGISTRO AQUÍ)
    const datosEquipo = [
      { 'Categoría': 'INFORMACIÓN GENERAL', 'Propiedad': 'Fecha de Registro', 'Valor': equipo.created_at ? new Date(equipo.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No registrada' },
      { 'Categoría': 'INFORMACIÓN GENERAL', 'Propiedad': 'Tipo de Equipo', 'Valor': equipo.tipo_equipo },
      { 'Categoría': 'INFORMACIÓN GENERAL', 'Propiedad': 'Marca y Modelo', 'Valor': `${equipo.marca || 'N/A'} ${equipo.modelo ? `- ${equipo.modelo}` : ''}` },
      { 'Categoría': 'INFORMACIÓN GENERAL', 'Propiedad': 'Número de Serie', 'Valor': equipo.numero_serie || 'N/A' },
      { 'Categoría': 'INFORMACIÓN GENERAL', 'Propiedad': 'Cod. SBN', 'Valor': equipo.cod_patrimonio || 'N/A' },
      { 'Categoría': 'HARDWARE', 'Propiedad': 'Procesador', 'Valor': equipo.procesador || 'N/A' },
      { 'Categoría': 'HARDWARE', 'Propiedad': 'Memoria RAM', 'Valor': equipo.memoria_ram || 'N/A' },
      { 'Categoría': 'HARDWARE', 'Propiedad': 'Almacenamiento', 'Valor': equipo.almacenamiento || 'N/A' },
      { 'Categoría': 'RED', 'Propiedad': 'Nombre en Red', 'Valor': equipo.nombre_red_pc || 'N/A' },
      { 'Categoría': 'RED', 'Propiedad': 'Dirección IP', 'Valor': equipo.direccion_ip || 'DHCP/N/A' },
      { 'Categoría': 'RED', 'Propiedad': 'Dirección MAC', 'Valor': equipo.direccion_mac || 'N/A' },
      { 'Categoría': 'SOFTWARE', 'Propiedad': 'Sistema Operativo', 'Valor': equipo.sistema_operativo || 'N/A' },
      { 'Categoría': 'ASIGNACIÓN', 'Propiedad': 'Usuario Responsable', 'Valor': equipo.usuarios ? `${equipo.usuarios.apellidos}, ${equipo.usuarios.nombres}` : 'Almacén / Stock' },
      { 'Categoría': 'ASIGNACIÓN', 'Propiedad': 'Ubicación Física', 'Valor': equipo.ubicaciones ? `${equipo.ubicaciones.servicio} — ${equipo.ubicaciones.area}` : 'Sin Asignar' },
    ];
    const hojaEquipo = XLSX.utils.json_to_sheet(datosEquipo);
    XLSX.utils.book_append_sheet(libro, hojaEquipo, 'Ficha Técnica');

    // Hoja 2: Bitácora de Novedades
    const datosHistorial = historial.map(h => ({
      'Fecha de Registro': new Date(h.fecha || h.created_at).toLocaleDateString(),
      'Estado Reportado': h.tipo_estado,
      'Motivo / Detalle Técnico': h.motivo || 'Cambio operativo de estado general.'
    }));
    const hojaHistorial = XLSX.utils.json_to_sheet(datosHistorial);
    XLSX.utils.book_append_sheet(libro, hojaHistorial, 'Bitácora Histórica');

    // Descarga
    XLSX.writeFile(libro, `Ficha_Equipo_${equipo.cod_patrimonio || id}.xlsx`);
  };

  // EXPORTAR A PDF 
  const exportarAPDF = () => {
    window.print();
  };

  // impresión de stickers de inventario
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
                display: flex; flex-direction: column; align-items: center; justify-content: center; 
                height: 100vh; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center;
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

  const getBadgeEstado = (estado: string) => {
    switch(estado?.toUpperCase()) {
      case 'GARANTIA': return 'bg-amber-100 text-amber-800 border-amber-200 print:border-none print:p-0';
      case 'OBSOLETO': return 'bg-orange-100 text-orange-800 border-orange-200 print:border-none print:p-0';
      case 'BAJA': return 'bg-red-100 text-red-800 border-red-200 print:border-none print:p-0';
      default: return 'bg-green-100 text-green-800 border-green-200 print:border-none print:p-0';
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Cargando ficha técnica...</div>;
  if (!equipo) return <div className="text-center py-20 text-red-500 font-bold">Error: Equipo no encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn print:bg-white print:p-0">
      
      {/* CABECERA EXCLUSIVA IMPRESIÓN (Solo pdf) */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ficha Técnica de Hardware - MedTrack</h1>
        <p className="text-xs text-gray-500 mt-1">Generado automáticamente el {new Date().toLocaleDateString()}</p>
      </div>

      {/* CABECERA WEB */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
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
        
        {/* GRUPO DE BOTONES */}
        <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto">
          <button onClick={exportarAExcel} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition shadow-xs">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={exportarAPDF} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition shadow-xs">
            <FileDown className="w-4 h-4 text-slate-600" /> <span className="hidden sm:inline">Ficha PDF</span>
          </button>
          <Link href="/equipos" className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition shadow-xs">
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
          
          {/* TARJETA: DATOS GENERALES (FECHA DE REGISTRO AÑADIDA AQUÍ) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:shadow-none print:border-gray-300">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 print:border-gray-300">
              <FileText className="w-5 h-5 text-blue-500 print:hidden" /> Información General
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Tipo de Equipo</p><p className="font-bold text-gray-700 mt-0.5">{equipo.tipo_equipo}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Marca / Modelo</p><p className="font-bold text-gray-700 mt-0.5">{equipo.marca || 'N/A'} {equipo.modelo ? `- ${equipo.modelo}` : ''}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Número de Serie</p><p className="font-mono font-medium text-gray-600 mt-0.5">{equipo.numero_serie || 'N/A'}</p></div>
              
              {/* NUEVO BLOQUE: FECHA DE REGISTRO */}
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Fecha de Ingreso al Sistema</p>
                <p className="font-bold text-indigo-700 mt-0.5">
                  {equipo.created_at 
                    ? new Date(equipo.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric'})
                    : 'No registrada'}
                </p>
              </div>

              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Cód. Etiqueta Verde</p><p className={`font-bold mt-0.5 ${equipo.cod_patrimonio_verde ? 'text-green-600' : 'text-gray-400'}`}>{equipo.cod_patrimonio_verde || 'Sin etiqueta'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Cód. Etiqueta Azul (SBN)</p><p className={`font-bold mt-0.5 ${equipo.cod_patrimonio ? 'text-blue-700 print:text-gray-800' : 'text-gray-400'}`}>{equipo.cod_patrimonio || 'Sin etiqueta'}</p></div>
              <div className="sm:col-span-2"><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Ubicación Física</p><p className="font-bold text-blue-700 mt-0.5 print:text-gray-800">{equipo.ubicaciones ? `${equipo.ubicaciones.servicio} — ${equipo.ubicaciones.area}` : 'Almacén / Sin Asignar'}</p></div>
            </div>
          </div>

          {/* TARJETA: HARDWARE Y RED */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:shadow-none print:border-gray-300">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 print:border-gray-300">
              <Cpu className="w-5 h-5 text-indigo-500 print:hidden" /> Hardware y Red
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Procesador</p><p className="font-semibold text-gray-700 mt-0.5">{equipo.procesador || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Memoria RAM</p><p className="font-semibold text-gray-700 mt-0.5">{equipo.memoria_ram || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Almacenamiento</p><p className="font-semibold text-gray-700 mt-0.5">{equipo.almacenamiento || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Nombre en Red</p><p className="font-mono font-bold text-gray-700 mt-0.5">{equipo.nombre_red_pc || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Dirección IP</p><p className="font-mono text-blue-600 font-bold mt-0.5 print:text-gray-800">{equipo.direccion_ip || 'DHCP/N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Dirección MAC</p><p className="font-mono text-gray-500 mt-0.5">{equipo.direccion_mac || 'N/A'}</p></div>
            </div>
          </div>

          {/* TARJETA: SOFTWARE Y ACCESOS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:shadow-none print:border-gray-300">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 print:border-gray-300">
              <Monitor className="w-5 h-5 text-emerald-500 print:hidden" /> Software e Instalaciones
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Sistema Operativo</p><p className="font-semibold text-gray-700 mt-0.5">{equipo.sistema_operativo || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Antivirus</p><p className="font-semibold text-gray-700 mt-0.5">{equipo.antivirus || 'N/A'}</p></div>
              <div className="col-span-2">
                <p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Clave VNC (Acceso Remoto)</p>
                <p className="font-mono bg-red-50 border border-red-100 px-2.5 py-1 inline-block rounded-lg text-red-600 font-bold tracking-wider mt-1 text-xs print:border-none print:p-0 print:bg-transparent">
                  {equipo.clave_vnc || 'No registrada'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 print:border-gray-300">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2 print:text-gray-600">Sistemas y Permisos de Red Autorizados</p>
              <div className="flex flex-wrap gap-1.5 print:gap-2">
                {equipo.tiene_sap && <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs px-2 py-0.5 rounded font-bold print:border-none print:p-0 print:bg-transparent">SAP</span>}
                {equipo.tiene_ses && <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs px-2 py-0.5 rounded font-bold print:border-none print:p-0 print:bg-transparent">SES</span>}
                {equipo.tiene_winepi && <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs px-2 py-0.5 rounded font-bold print:border-none print:p-0 print:bg-transparent">WINEPI</span>}
                {equipo.tiene_sinadef && <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs px-2 py-0.5 rounded font-bold print:border-none print:p-0 print:bg-transparent">SINADEF</span>}
                {equipo.en_dominio && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded font-bold print:border-none print:p-0 print:bg-transparent">Dominio Intranet</span>}
                {equipo.tiene_internet && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded font-bold print:border-none print:p-0 print:bg-transparent">Internet Global</span>}
                
                {(!equipo.tiene_sap && !equipo.tiene_ses && !equipo.tiene_winepi && !equipo.tiene_sinadef && !equipo.en_dominio && !equipo.tiene_internet) && (
                  <span className="text-gray-400 italic text-xs">Instalación Base Limpia</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: GENERACIÓN DE QR + HISTORIAL */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* TARJETA DE USUARIO  */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:shadow-none print:border-gray-300">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 print:border-gray-300">
              <User className="w-5 h-5 text-teal-500 print:hidden" /> Usuario Asignado
            </h3>
            {equipo.usuarios ? (
              <div className="flex items-center gap-3 bg-blue-50/60 p-3 rounded-xl border border-blue-100/70 print:border-none print:p-0 print:bg-transparent">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm print:border print:border-gray-300 print:bg-white print:text-gray-800">
                  {equipo.usuarios.nombres.charAt(0)}{equipo.usuarios.apellidos.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-blue-900 print:text-gray-900">{equipo.usuarios.apellidos}, {equipo.usuarios.nombres}</p>
                  <p className="text-xs text-blue-600/90 font-medium print:text-gray-600">Anexo: {equipo.usuarios.anexo || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-gray-500 italic text-sm print:bg-transparent print:border-none print:p-0">
                Equipo libre / Stock Almacén
              </div>
            )}
          </div>

          {/* GENERADOR QR */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center text-center print:shadow-none print:border-gray-300 print:break-inside-avoid">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mb-4 self-start">
              <QrCode className="w-4 h-4 text-blue-500 print:hidden" /> Identificador Físico QR
            </h4>
            
            <div ref={qrRef} className="bg-white p-3 rounded-xl border border-slate-100 shadow-inner mb-4 print:border-none print:shadow-none print:p-0">
              {qrUrl ? (
                <QRCodeSVG value={qrUrl} size={140} level="H" includeMargin={false} />
              ) : (
                <div className="w-[140px] h-[140px] bg-slate-100 animate-pulse rounded-xl" />
              )}
            </div>

            <p className="text-xs text-gray-400 px-2 mb-4 leading-relaxed print:hidden">
              Escanea con cualquier smartphone corporativo para acceder directo a la ficha técnica física en tiempo real.
            </p>

            {/* imprimir boton */}
            <button onClick={handlePrintQR} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs print:hidden">
              <Printer className="w-3.5 h-3.5" /> Imprimir Etiqueta (Sticker)
            </button>
          </div>

          {/* BITÁCORA HISTÓRICA DE ESTADOS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:shadow-none print:border-gray-300 print:break-inside-avoid">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 print:border-gray-300">
              <History className="w-5 h-5 text-gray-500 print:hidden" /> Bitácora Técnica
            </h3>
            
            {historial.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4 print:text-left">Sin novedades registradas.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:bg-gray-100 print:before:bg-gray-300">
                {historial.map((hito, index) => (
                  <div key={hito.id_estado || index} className="relative flex items-start gap-4 print:break-inside-avoid">
                    <div className={`w-2 h-2 rounded-full border-2 border-white mt-1.5 shrink-0 z-10 ml-1.5 shadow-xs print:border-gray-400 ${
                      hito.tipo_estado === 'BAJA' ? 'bg-red-500 print:bg-red-500' : 'bg-blue-500 print:bg-gray-800'
                    }`}></div>
                    <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs print:bg-transparent print:border-none print:p-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold ${hito.tipo_estado === 'BAJA' ? 'text-red-600 print:text-gray-900' : 'text-blue-600 print:text-gray-900'}`}>{hito.tipo_estado}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-medium print:text-gray-600">
                          {new Date(hito.fecha || hito.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-normal print:text-gray-800">{hito.motivo || 'Cambio operativo de estado general.'}</p>
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