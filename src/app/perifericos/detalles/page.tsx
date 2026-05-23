'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
// 1. Importamos la librería para Excel
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Settings2, 
  Network, 
  Monitor, 
  PackageOpen, 
  QrCode, 
  Printer,
  ClipboardList,
  FileSpreadsheet, // <-- Icono para Excel
  FileDown // <-- Icono para PDF
} from 'lucide-react';

export default function DetallePerifericoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [periferico, setPeriferico] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para el QR
  const [qrUrl, setQrUrl] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      cargarDetalles();
      // Forzamos tu dominio de Vercel y la ruta exacta con el parámetro ?id=
      const currentUrl = `https://proyecto-inventario-three.vercel.app/perifericos/detalles?id=${id}`;
      setQrUrl(currentUrl);
    } else {
      setLoading(false);
    }
  }, [id]);

  async function cargarDetalles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('perifericos')
      .select('*, equipos(nombre_red_pc)')
      .eq('id_periferico', id)
      .single();

    if (error) {
      alert('Error al cargar los detalles: ' + error.message);
      router.push('/perifericos');
      return;
    }

    if (data) {
      setPeriferico(data);
    }
    setLoading(false);
  }

  // ==========================================
  // 🔥 ACCIÓN: EXPORTAR A EXCEL
  // ==========================================
  const exportarAExcel = () => {
    if (!periferico) return;
    const libro = XLSX.utils.book_new();

    const datosPeriferico = [
      { 'Categoría': 'GENERAL', 'Propiedad': 'Tipo de Componente', 'Valor': periferico.tipo_periferico },
      { 'Categoría': 'GENERAL', 'Propiedad': 'Marca y Modelo', 'Valor': `${periferico.marca || 'N/A'} ${periferico.modelo ? `- ${periferico.modelo}` : ''}` },
      { 'Categoría': 'GENERAL', 'Propiedad': 'Número de Serie', 'Valor': periferico.n_serie || periferico.numero_serie || 'N/A' },
      { 'Categoría': 'INVENTARIO', 'Propiedad': 'Cód. Etiqueta Azul (SBN)', 'Valor': periferico.cod_patrimonio_azul || periferico.cod_patrimonio || 'N/A' },
      { 'Categoría': 'INVENTARIO', 'Propiedad': 'Cód. Etiqueta Verde', 'Valor': periferico.cod_patrimonio_verde || 'N/A' },
      { 'Categoría': 'ESTADO', 'Propiedad': 'Estado Técnico', 'Valor': periferico.estado || periferico.estado_fisico || 'OPERATIVO' },
      { 'Categoría': 'HARDWARE', 'Propiedad': 'Especificaciones Técnicas', 'Valor': periferico.detalle_tecnico || 'Sin detalles registrados' },
      { 'Categoría': 'ASIGNACIÓN', 'Propiedad': 'Computadora Vinculada', 'Valor': periferico.equipos ? periferico.equipos.nombre_red_pc : 'Almacén / Stock Libre' },
      { 'Categoría': 'LOGÍSTICA', 'Propiedad': 'Observaciones', 'Valor': periferico.observaciones_almacen || 'Sin observaciones' },
    ];
    
    const hoja = XLSX.utils.json_to_sheet(datosPeriferico);
    XLSX.utils.book_append_sheet(libro, hoja, 'Ficha Periférico');

    XLSX.writeFile(libro, `Ficha_Periferico_${periferico.cod_patrimonio_azul || periferico.cod_patrimonio || id}.xlsx`);
  };

  // ==========================================
  // 🔥 ACCIÓN: EXPORTAR A PDF (Ficha Completa A4)
  // ==========================================
  const exportarAPDF = () => {
    window.print();
  };

  // Función nativa optimizada para impresión de stickers de inventario
  const handlePrintQR = () => {
    const printContent = qrRef.current?.innerHTML;
    if (printContent) {
      const win = window.open('', '', 'height=400,width=400');
      win?.document.write(`
        <html>
          <head>
            <title>Sticker Inventario - Periférico</title>
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
            <div class="label-id">CÓD. INTERNO: #PER-${id}</div>
            <div class="label-pat">SBN: ${periferico?.cod_patrimonio_azul || periferico?.cod_patrimonio || 'S/N'}</div>
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
    const stateUpper = (estado || '').toUpperCase();
    if (stateUpper === 'MALOGRADO' || stateUpper === 'BAJA') return 'bg-red-100 text-red-800 border-red-200 print:border-none print:p-0';
    if (stateUpper === 'OBSOLETO' || stateUpper === 'REPARACIÓN') return 'bg-orange-100 text-orange-800 border-orange-200 print:border-none print:p-0';
    return 'bg-green-100 text-green-800 border-green-200 print:border-none print:p-0'; 
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Cargando ficha técnica...</div>;
  if (!periferico) return <div className="text-center py-20 text-red-500 font-bold">Error: Periférico no encontrado o falta el ID.</div>;

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen py-8 px-4 text-gray-900 animate-fadeIn print:bg-white print:p-0">
      
      {/* CABECERA EXCLUSIVA IMPRESIÓN (Visible solo en PDF) */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ficha Técnica de Periférico - MedTrack</h1>
        <p className="text-xs text-gray-500 mt-1">Generado automáticamente el {new Date().toLocaleDateString()}</p>
      </div>

      {/* CABECERA WEB */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Ficha Técnica del Periférico</h2>
          <div className="text-gray-500 mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">Tipo:</span> 
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase">{periferico.tipo_periferico}</span> 
            
            {periferico.cod_patrimonio_verde && (
              <>
                <span className="text-gray-300">|</span>
                <span className="font-medium">Etiqueta Verde:</span>
                <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">{periferico.cod_patrimonio_verde}</span>
              </>
            )}

            {(periferico.cod_patrimonio_azul || periferico.cod_patrimonio) && (
              <>
                <span className="text-gray-300">|</span>
                <span className="font-medium">Etiqueta Azul:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{periferico.cod_patrimonio_azul || periferico.cod_patrimonio}</span>
              </>
            )}
            
            <span className="text-gray-300">|</span>
            <span className="font-medium">Estado:</span> 
            <span className={`font-bold px-2 py-0.5 rounded border text-xs ${getBadgeEstado(periferico.estado || periferico.estado_fisico)}`}>
              {periferico.estado || periferico.estado_fisico || 'OPERATIVO'}
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
          <Link href="/perifericos" className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition shadow-xs">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <Link href={`/perifericos/editar/${periferico.id_periferico}`} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition shadow-sm">
            <Edit className="w-4 h-4" /> Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: DATOS Y ASIGNACIÓN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TARJETA: DATOS GENERALES */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:shadow-none print:border-gray-300">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 print:border-gray-300">
              <FileText className="w-5 h-5 text-blue-500 print:hidden" /> Información General
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Tipo de Componente</p><p className="font-bold text-gray-700 mt-0.5">{periferico.tipo_periferico}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Marca / Modelo</p><p className="font-bold text-gray-700 mt-0.5">{periferico.marca || 'N/A'} {periferico.modelo ? `- ${periferico.modelo}` : ''}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Número de Serie</p><p className="font-mono font-medium text-gray-600 mt-0.5">{periferico.n_serie || periferico.numero_serie || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Estado Técnico</p><p className="font-bold text-gray-800 mt-0.5">{periferico.estado || periferico.estado_fisico || 'OPERATIVO'}</p></div>
              
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Cód. Etiqueta Verde</p>
                <p className={`font-bold mt-0.5 ${periferico.cod_patrimonio_verde ? 'text-green-600' : 'text-gray-400'}`}>
                  {periferico.cod_patrimonio_verde || 'Sin etiqueta verde'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Cód. Etiqueta Azul</p>
                <p className={`font-bold mt-0.5 ${periferico.cod_patrimonio_azul || periferico.cod_patrimonio ? 'text-blue-700 print:text-gray-800' : 'text-gray-400'}`}>
                  {periferico.cod_patrimonio_azul || periferico.cod_patrimonio || 'Sin etiqueta azul'}
                </p>
              </div>
            </div>
          </div>

          {/* TARJETA: DETALLES TÉCNICOS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:shadow-none print:border-gray-300">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 print:border-gray-300">
              <Settings2 className="w-5 h-5 text-indigo-500 print:hidden" /> Hardware Específico
            </h3>
            <div className="text-sm">
              <p className="text-gray-400 text-xs font-semibold uppercase mb-2 print:text-gray-600">Detalle / Capacidad / Conexión</p>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-gray-700 font-medium print:bg-transparent print:border-none print:p-0">
                {periferico.detalle_tecnico || <span className="italic text-gray-400">No hay detalles técnicos específicos registrados para este componente.</span>}
              </div>
            </div>
          </div>

          {/* TARJETA: ASIGNACIÓN */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:shadow-none print:border-gray-300">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 print:border-gray-300">
              <Network className="w-5 h-5 text-teal-500 print:hidden" /> Asignación Actual
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 print:text-gray-600">Computadora (Red)</p>
                {periferico.equipos ? (
                  <div className="flex items-center gap-3 bg-blue-50/60 p-4 rounded-xl border border-blue-100/70 print:border-none print:p-0 print:bg-transparent">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center print:border print:border-gray-300 print:bg-white print:text-gray-800">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-blue-900 print:text-gray-900">{periferico.equipos.nombre_red_pc}</p>
                      <p className="text-xs text-blue-600/90 font-medium print:text-gray-600">Hardware vinculado operativamente.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-amber-50/60 p-4 rounded-xl border border-amber-100/70 print:border-none print:p-0 print:bg-transparent">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center print:border print:border-gray-300 print:bg-white print:text-gray-800">
                      <PackageOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-amber-900 print:text-gray-900">En Almacén / Stock Libre</p>
                      <p className="text-xs text-amber-700/90 font-medium print:text-gray-600">No está conectado a ninguna PC en este momento.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: QR Y LOGÍSTICA */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* GENERADOR QR MINIMALISTA */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center text-center print:shadow-none print:border-gray-300 print:break-inside-avoid">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mb-4 self-start">
              <QrCode className="w-4 h-4 text-blue-500 print:hidden" /> Identificador Físico QR
            </h4>
            
            <div ref={qrRef} className="bg-white p-3 rounded-xl border border-slate-100 shadow-inner mb-4 print:border-none print:shadow-none print:p-0">
              {qrUrl ? (
                <QRCodeSVG 
                  value={qrUrl} 
                  size={140} 
                  level="H" 
                  includeMargin={false}
                />
              ) : (
                <div className="w-[140px] h-[140px] bg-slate-100 animate-pulse rounded-xl" />
              )}
            </div>

            <p className="text-xs text-gray-400 px-2 mb-4 leading-relaxed print:hidden">
              Escanea para acceder directo a la ficha técnica física de este periférico en tiempo real.
            </p>

            <button
              onClick={handlePrintQR}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs print:hidden"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Etiqueta
            </button>
          </div>

          {/* TARJETA LOGÍSTICA */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:shadow-none print:border-gray-300 print:break-inside-avoid">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 print:border-gray-300">
              <ClipboardList className="w-5 h-5 text-amber-500 print:hidden" /> Logística y Almacén
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 print:text-gray-600">Observaciones de Inventario</p>
                {periferico.observaciones_almacen ? (
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed print:bg-transparent print:border-none print:p-0">
                    {periferico.observaciones_almacen}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100 text-center print:bg-transparent print:border-none print:p-0 print:text-left">
                    Sin observaciones logísticas registradas.
                  </p>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 print:border-gray-300">
                <p className="text-xs text-gray-400 text-center font-mono bg-gray-50 py-1.5 rounded-lg border border-gray-100 print:bg-transparent print:border-none print:p-0 print:text-left">
                  ID Sistema: PER-{periferico.id_periferico}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}