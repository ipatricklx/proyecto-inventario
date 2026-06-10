'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import ExcelJS from 'exceljs';
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
  FileSpreadsheet,
  FileDown
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

  
  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    try {
      const soloFecha = fecha.split('T')[0]; 
      const [year, month, day] = soloFecha.split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      return fecha;
    }
  };

  const formatearFechaLarga = (fecha: string) => {
    if (!fecha) return 'No registrada';
    try {
      return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (error) {
      return 'No registrada';
    }
  };

  // ==========================================
  // 🔥 ACCIÓN: EXPORTAR A EXCEL
  // ==========================================
 // ==========================================
  // 🔥 ACCIÓN: EXPORTAR A EXCEL (ESTILO EQUIPOS)
  // ==========================================
  const exportarAExcel = async () => {
    if (!periferico) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ficha Periférico');

    worksheet.views = [{ showGridLines: true }];

    // Título Principal
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'FICHA TÉCNICA Y CONTROL DE COMPONENTE PERIFÉRICO';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0070C0' } }; // Azul Institucional
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Sección I: Identificación General
    worksheet.mergeCells('A3:E3');
    const secGen = worksheet.getCell('A3');
    secGen.value = 'I. DATOS DE IDENTIFICACIÓN GENERAL';
    secGen.font = { bold: true }; 
    secGen.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E1F2' } }; // Celeste claro

    const genData = [
      ['Tipo Componente:', periferico.tipo_periferico || 'N/A', '', 'Estado Técnico:', periferico.estado || periferico.estado_fisico || 'OPERATIVO'],
      ['Marca / Modelo:', `${periferico.marca || 'N/A'} ${periferico.modelo ? `- ${periferico.modelo}` : ''}`, '', 'Número de Serie:', periferico.n_serie || periferico.numero_serie || 'N/A']
    ];

    genData.forEach((row, idx) => {
      worksheet.getCell(`A${4 + idx}`).value = row[0];
      worksheet.getCell(`B${4 + idx}`).value = row[1];
      worksheet.getCell(`D${4 + idx}`).value = row[3];
      worksheet.getCell(`E${4 + idx}`).value = row[4];
      worksheet.getCell(`A${4 + idx}`).font = { bold: true };
      worksheet.getCell(`D${4 + idx}`).font = { bold: true };
    });

    // Sección II: Especificaciones y Logística
    worksheet.mergeCells('A7:E7');
    const secLog = worksheet.getCell('A7');
    secLog.value = 'II. ESPECIFICACIONES TÉCNICAS Y LOGÍSTICA';
    secLog.font = { bold: true }; 
    secLog.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E1F2' } };

    const logData = [
      ['Cód. Patrimonio SBN:', periferico.cod_patrimonio_azul || periferico.cod_patrimonio || 'N/A', '', 'Cód. Etiqueta Verde:', periferico.cod_patrimonio_verde || 'Sin Etiqueta'],
      ['Fecha Ingreso:', formatearFechaLarga(periferico.created_at), '', 'Detalles Hardware:', periferico.detalle_tecnico || 'Sin especificaciones']
    ];

    logData.forEach((row, idx) => {
      worksheet.getCell(`A${8 + idx}`).value = row[0];
      worksheet.getCell(`B${8 + idx}`).value = row[1];
      worksheet.getCell(`D${8 + idx}`).value = row[3];
      worksheet.getCell(`E${8 + idx}`).value = row[4];
      worksheet.getCell(`A${8 + idx}`).font = { bold: true };
      worksheet.getCell(`D${8 + idx}`).font = { bold: true };
    });

    // Fila extra para Observaciones (ocupando todo el ancho para que quepa el texto)
    worksheet.getCell('A10').value = 'Observaciones:';
    worksheet.getCell('A10').font = { bold: true };
    worksheet.getCell('B10').value = periferico.observaciones_almacen || 'Sin observaciones logísticas registradas.';
    worksheet.mergeCells('B10:E10'); // Combinamos para que el texto largo no se corte

    // Sección III: Asignación y Vinculación
    worksheet.mergeCells('A12:E12');
    const secAsig = worksheet.getCell('A12');
    secAsig.value = 'III. ASIGNACIÓN Y VINCULACIÓN EN RED';
    secAsig.font = { bold: true }; 
    secAsig.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E1F2' } };

    worksheet.getCell('A13').value = 'Computadora Destino:';
    worksheet.getCell('A13').font = { bold: true };
    worksheet.getCell('B13').value = periferico.equipos ? `Vinculado al Hostname: ${periferico.equipos.nombre_red_pc}` : 'No asignado — En Almacén / Stock Libre';
    worksheet.mergeCells('B13:E13');

    // Ancho de columnas adaptado exactamente igual al de Equipos
    worksheet.getColumn('A').width = 22;
    worksheet.getColumn('B').width = 25;
    worksheet.getColumn('C').width = 5;  // Columna C como espaciador visual
    worksheet.getColumn('D').width = 20;
    worksheet.getColumn('E').width = 25;

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ficha_Periferico_#PER-${id}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ==========================================
  // 🔥 ACCIÓN: EXPORTAR A PDF (TABLA ÚNICA COMPACTA)
  // ==========================================
  const exportarAPDF = () => {
    if (!periferico) return;

    const win = window.open('', '', 'height=900,width=750');
    if (!win) return;

    const fechaImpresion = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const fechaIngreso = formatearFechaLarga(periferico.created_at);
    const baseUrl = window.location.origin;

    win.document.write(`
      <html>
        <head>
          <title>Ficha Técnica de Periférico - EsSalud</title>
          <style>
            @page { 
              size: A4; 
              margin: 0; 
            }
            body { 
              font-family: 'Arial', sans-serif; 
              color: #000000; 
              margin: 0; 
              padding: 12mm 15mm;
              font-size: 10px;
              line-height: 1.3;
            }
            .header-layout-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
            }
            .header-layout-table td {
              border: none !important;
              padding: 0 !important;
              vertical-align: middle;
            }
            .logo-img {
              max-height: 150px; 
              width: auto;
              display: block;
              margin-top: -20px; 
              margin-bottom: -20px; 
              object-fit: contain;
            }
            .header-sub {
              font-size: 10px; 
              color: #000000; 
              text-transform: uppercase;
              font-weight: bold;
              margin-top: 2px;
            }
            .main-doc-title {
              text-align: center; 
              font-size: 11px; 
              font-weight: bold; 
              background-color: #d9e1f2; 
              color: #000000;
              padding: 6px; 
              border: 1px solid #cbd5e0;
              border-radius: 2px;
              margin-bottom: 12px;
              text-transform: uppercase;
            }
            .unified-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px;
            }
            .unified-table td { 
              padding: 5px; 
              border: 1px solid #cbd5e0; 
              vertical-align: middle;
              font-size: 10px;
              color: #000000;
            }
            .section-banner {
              font-weight: bold;
              background-color: #d9e1f2; 
              padding: 5px !important;
              border: 1px solid #cbd5e0 !important;
            }
            .label { 
              font-weight: bold; 
              background-color: #f2f2f2; 
              width: 22%;
            }
            .value { 
              width: 28%;
            }
            .signatures-container {
              margin-top: 40px;
              width: 100%;
              border-collapse: collapse;
              page-break-inside: avoid;
            }
            .signatures-container td {
              width: 50%;
              text-align: center;
              border: none;
              padding: 0;
              font-size: 10px;
              color: #000000;
            }
            .line-signature {
              width: 180px;
              border-bottom: 1px solid #000000;
              margin: 0 auto 6px auto;
            }
            .footer-note {
              margin-top: 25px;
              font-size: 8.5px;
              color: #000000;
              text-align: center;
              border-top: 1px dashed #cbd5e0;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          
          <table class="header-layout-table">
            <tr>
              <td>
                <img src="${baseUrl}/logo-essalud.png" alt="Logo EsSalud" class="logo-img" />
                <div class="header-sub">Oficina de Soporte Informático y Telecomunicaciones</div>
              </td>
              <td style="text-align: right; font-size: 10px; color: #000000; line-height: 1.3;">
                <strong>Código de Registro:</strong> #PER-${id}<br>
                <strong>Fecha Impresión:</strong> ${fechaImpresion}
              </td>
            </tr>
          </table>

          <div class="main-doc-title">FICHA TÉCNICA Y CONTROL DE COMPONENTE PERIFÉRICO</div>

          <table class="unified-table">
            
            <tr>
              <td colspan="4" class="section-banner">I. DATOS DE IDENTIFICACIÓN GENERAL</td>
            </tr>
            <tr>
              <td class="label">Tipo Componente:</td>
              <td class="value" style="font-weight: bold;">${periferico.tipo_periferico || 'N/A'}</td>
              <td class="label">Estado Técnico:</td>
              <td class="value">${periferico.estado || periferico.estado_fisico || 'OPERATIVO'}</td>
            </tr>
            <tr>
              <td class="label">Marca / Modelo:</td>
              <td class="value">${periferico.marca || 'N/A'} ${periferico.modelo ? `— ${periferico.modelo}` : ''}</td>
              <td class="label">Número de Serie:</td>
              <td class="value">${periferico.n_serie || periferico.numero_serie || 'N/A'}</td>
            </tr>

            <tr>
              <td colspan="4" class="section-banner">II. ESPECIFICACIONES TÉCNICAS Y LOGÍSTICA</td>
            </tr>
            <tr>
              <td class="label">Cód. Patrimonio SBN:</td>
              <td class="value">${periferico.cod_patrimonio_azul || periferico.cod_patrimonio || 'N/A'}</td>
              <td class="label">Cód. Etiqueta Verde:</td>
              <td class="value">${periferico.cod_patrimonio_verde || 'Sin Etiqueta'}</td>
            </tr>
            <tr>
              <td class="label">Fecha Ingreso:</td>
              <td class="value" colspan="3">${fechaIngreso}</td>
            </tr>
            <tr>
              <td class="label">Detalles de Hardware:</td>
              <td class="value" colspan="3">${periferico.detalle_tecnico || 'Sin especificaciones técnicas adicionales.'}</td>
            </tr>
            <tr>
              <td class="label">Observaciones:</td>
              <td class="value" colspan="3">${periferico.observaciones_almacen || 'Sin observaciones logísticas registradas.'}</td>
            </tr>

            <tr>
              <td colspan="4" class="section-banner">III. ASIGNACIÓN Y VINCULACIÓN EN RED</td>
            </tr>
            <tr>
              <td class="label">Computadora Destino:</td>
              <td class="value" colspan="3">
                ${periferico.equipos ? `Vinculado al Hostname: ${periferico.equipos.nombre_red_pc}` : 'No asignado — En Almacén / Stock Libre'}
              </td>
            </tr>
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.close(); 
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    win.document.close();
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
      
      {/* CABECERA EXCLUSIVA IMPRESIÓN (Visible solo en PDF directo del navegador) */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ficha Técnica de Periférico</h1>
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

               <div>
                <p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Fecha de Ingreso al Sistema</p>
                <p className="font-bold text-indigo-700 mt-0.5">
                  {formatearFechaLarga(periferico.created_at)}
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