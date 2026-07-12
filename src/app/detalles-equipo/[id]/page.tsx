'use client';
import { useEffect, useState, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react'; 
import ExcelJS from 'exceljs';
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
  FileDown,
  FileSignature
} from 'lucide-react'; 

export default function DetallesEquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [equipo, setEquipo] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [perifericos, setPerifericos] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);
  const [showFupModal, setShowFupModal] = useState(false);
  const [fupTramite, setFupTramite] = useState('Asignación');
  const [fupDni, setFupDni] = useState('');
  const [fupEmpresa, setFupEmpresa] = useState('');
  const [fupDireccion, setFupDireccion] = useState('');

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
    // 1. Obtener Equipo
    const { data: equipoData } = await supabase
      .from('equipos')
      .select(`
        *, 
        ubicaciones(servicio, area),
        usuarios(nombres, apellidos, anexo, email_institucional, cod_planilla)
      `)
      .eq('id_equipo', Number(id))
      .single();

    if (equipoData) setEquipo(equipoData);

    // 2. Obtener Historial
    const { data: historialData } = await supabase
      .from('estados_equipo')
      .select('*')
      .eq('id_equipo', Number(id))
      .order('fecha', { ascending: false });

    if (historialData) setHistorial(historialData);
    
    // Obtener Periféricos vinculados al equipo
    const { data: perifericosData } = await supabase
      .from('perifericos')
      .select('*')
      .eq('id_equipo', Number(id));
      
    if (perifericosData) setPerifericos(perifericosData);

    setLoading(false);
  }

  // EXPORTAR A EXCEL (IDÉNTICO A LA IMAGEN)
  const exportarAExcel = async () => {
    if (!equipo) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ficha Técnica');

    worksheet.views = [{ showGridLines: true }];

    // Título Principal
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'FICHA TÉCNICA Y CONTROL DE ACTIVO INFORMÁTICO';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0070C0' } }; // Azul
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Sección I: Usuario / Ubicación
    worksheet.mergeCells('A3:E3');
    const secUser = worksheet.getCell('A3');
    secUser.value = 'I. DATOS DEL USUARIO ASIGNADO / UBICACIÓN';
    secUser.font = { bold: true }; secUser.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E1F2' } }; // Celeste claro

    worksheet.getCell('A4').value = 'Responsable:';
    worksheet.getCell('B4').value = equipo.usuarios ? `${equipo.usuarios.apellidos}, ${equipo.usuarios.nombres}` : 'Sin Asignar';
    worksheet.getCell('D4').value = 'Ubicación:';
    worksheet.getCell('E4').value = equipo.ubicaciones ? `${equipo.ubicaciones.servicio} - ${equipo.ubicaciones.area}` : 'Almacén';

    // Sección II: Especificaciones del Equipo
    worksheet.mergeCells('A6:E6');
    const secEq = worksheet.getCell('A6');
    secEq.value = 'II. ESPECIFICACIONES TÉCNICAS DEL EQUIPO';
    secEq.font = { bold: true }; secEq.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E1F2' } };

    const eqData = [
      ['Tipo Dispositivo:', equipo.tipo_equipo, '', 'Cód. Patrimonial:', equipo.cod_patrimonio],
      ['Marca / Modelo:', `${equipo.marca || ''} ${equipo.modelo || ''}`, '', 'Número de Serie:', equipo.numero_serie],
      ['Procesador:', equipo.procesador, '', 'Memoria RAM:', equipo.memoria_ram],
      ['Hostname:', equipo.nombre_red_pc, '', 'Dirección IP:', equipo.direccion_ip],
      ['Direccion Mac:', equipo.direccion_mac, '', 'Amacenamiento:', equipo.almacenamiento],
      ['Sistema Operativo:', equipo.sistema_operativo, '', 'Estado Actual:', equipo.estado]
    ];

    eqData.forEach((row, idx) => {
      worksheet.getCell(`A${7 + idx}`).value = row[0];
      worksheet.getCell(`B${7 + idx}`).value = row[1];
      worksheet.getCell(`D${7 + idx}`).value = row[3];
      worksheet.getCell(`E${7 + idx}`).value = row[4];
      worksheet.getCell(`A${7 + idx}`).font = { bold: true };
      worksheet.getCell(`D${7 + idx}`).font = { bold: true };
    });

    // Sección III: Periféricos Asignados
    let fila = 13;
    worksheet.mergeCells(`A${fila}:E${fila}`);
    const secPeri = worksheet.getCell(`A${fila}`);
    secPeri.value = 'III. PERIFÉRICOS ASIGNADOS';
    secPeri.font = { bold: true }; secPeri.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E1F2' } };
    fila++;

    const headers = ['Tipo', 'Marca', 'Modelo', 'Serie', 'Patrimonio'];
    headers.forEach((h, i) => {
      const c = worksheet.getCell(fila, i + 1);
      c.value = h; 
      c.font = { bold: true, color: { argb: 'FFFFFF' } }; 
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '34495E' } }; // Gris oscuro como en tu imagen
    });
    fila++;

    if (perifericos.length === 0) {
      worksheet.getCell(`A${fila}`).value = 'Sin periféricos';
    } else {
      perifericos.forEach(p => {
        worksheet.getRow(fila).values = [p.tipo_periferico, p.marca, p.modelo, p.n_serie || p.numero_serie, p.cod_patrimonio_verde || p.cod_patrimonio_azul];
        fila++;
      });
    }

    // Ancho de columnas ajustado
    worksheet.getColumn('A').width = 20;
    worksheet.getColumn('B').width = 25;
    worksheet.getColumn('C').width = 15; // Espacio
    worksheet.getColumn('D').width = 20;
    worksheet.getColumn('E').width = 25;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ficha_Activo_${equipo.cod_patrimonio || id}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  // FORMATO PDF
 const exportarAPDF = () => {
    if (!equipo) return;

    const win = window.open('', '', 'height=900,width=750');
    if (!win) return;

    const fechaImpresion = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const fechaIngreso = equipo.created_at ? new Date(equipo.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No registrada';
    
    const baseUrl = window.location.origin;

    // Filas de periféricos con estilos 100% unificados
    const perifericosRows = perifericos.length === 0 
      ? '<tr><td colspan="4" style="text-align:center; font-style:italic; padding: 5px;">No registra periféricos asociados.</td></tr>'
      : perifericos.map(p => `
          <tr>
            <td style="padding: 5px; border: 1px solid #cbd5e0; font-weight: bold;">${p.tipo_periferico || 'N/A'}</td>
            <td style="padding: 5px; border: 1px solid #cbd5e0;">${p.marca || 'N/A'} ${p.modelo ? `/ ${p.modelo}` : ''}</td>
            <td style="padding: 5px; border: 1px solid #cbd5e0;">${p.n_serie || p.numero_serie || 'N/A'}</td>
            <td style="padding: 5px; border: 1px solid #cbd5e0;">${p.cod_patrimonio_verde || p.cod_patrimonio_azul || 'N/A'}</td>
          </tr>
        `).join('');

    const sistemasList = [
      equipo.tiene_sap && 'SAP',
      equipo.tiene_ses && 'SES',
      equipo.tiene_winepi && 'WINEPI',
      equipo.tiene_sinadef && 'SINADEF',
      equipo.en_dominio && 'DOMINIO',
      equipo.tiene_internet && 'INTERNET'
    ].filter(Boolean).join(', ') || 'Instalación Base';

    win.document.write(`
      <html>
        <head>
          <title>Ficha Técnica de Activo Informático - EsSalud</title>
          <style>
            @page { 
              size: A4; 
              margin: 0; 
            }
            /* Fuente, tamaño y color unificados a nivel global */
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
            /* Tus márgenes personalizados corregidos */
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
            .perifericos-header-row td {
              background-color: #f2f2f2;
              font-weight: bold;
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
              width: 100px;
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
                <strong>Código de Registro:</strong> #EQ-${id}<br>
                <strong>Fecha Impresión:</strong> ${fechaImpresion}
              </td>
            </tr>
          </table>

          <div class="main-doc-title">FICHA TÉCNICA Y CONTROL DE ACTIVO INFORMÁTICO</div>

          <table class="unified-table">
            
            <tr>
              <td colspan="4" class="section-banner">I. DATOS DEL USUARIO ASIGNADO / UBICACIÓN</td>
            </tr>
            <tr>
              <td class="label">Responsable:</td>
              <td class="value" colspan="3">
                ${equipo.usuarios ? `${equipo.usuarios.apellidos}, ${equipo.usuarios.nombres}` : 'Sin Asignar / Custodia Provisional'}
              </td>
            </tr>
            <tr>
              <td class="label">Código de Planilla:</td>
              <td class="value">
                ${equipo.usuarios?.cod_planilla || 'S/N (Personal Externo)'}
              </td>
              <td class="label">Ubicación / Servicio:</td>
              <td class="value">
                ${equipo.ubicaciones ? `${equipo.ubicaciones.servicio} — ${equipo.ubicaciones.area}` : 'Almacén / Stock'}
              </td>
            </tr>

            <tr>
              <td colspan="4" class="section-banner">II. ESPECIFICACIONES TÉCNICAS DEL EQUIPO</td>
            </tr>
            <tr>
              <td class="label">Tipo Dispositivo:</td>
              <td class="value">${equipo.tipo_equipo || 'N/A'}</td>
              <td class="label">Cód. Patrimonial:</td>
              <td class="value">${equipo.cod_patrimonio || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Marca / Modelo:</td>
              <td class="value">${equipo.marca || 'N/A'} ${equipo.modelo ? `— ${equipo.modelo}` : ''}</td>
              <td class="label">Número de Serie:</td>
              <td class="value">${equipo.numero_serie || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Procesador:</td>
              <td class="value">${equipo.procesador || 'N/A'}</td>
              <td class="label">Memoria RAM:</td>
              <td class="value">${equipo.memoria_ram || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Almacenamiento:</td>
              <td class="value">${equipo.almacenamiento || 'N/A'}</td>
              <td class="label">Hostname:</td>
              <td class="value">${equipo.nombre_red_pc || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Dirección IP:</td>
              <td class="value">${equipo.direccion_ip || 'DHCP'}</td>
              <td class="label">Dirección MAC:</td>
              <td class="value">${equipo.direccion_mac || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Sistema Operativo:</td>
              <td class="value">${equipo.sistema_operativo || 'N/A'}</td>
              <td class="label">Estado Actual:</td>
              <td class="value">${equipo.estado || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Antivirus Instalado:</td>
              <td class="value">${equipo.antivirus || 'N/A'}</td>
              <td class="label">Clave Acceso VNC:</td>
              <td class="value">${equipo.clave_vnc || 'N/R'}</td>
            </tr>
            <tr>
              <td class="label">Sistemas Autorizados:</td>
              <td class="value" colspan="3">${sistemasList}</td>
            </tr>
            <tr>
              <td class="label">Fecha Ingreso:</td>
              <td class="value">${fechaIngreso}</td>
              <td class="label">Cód. Etiqueta Verde:</td>
              <td class="value">${equipo.cod_patrimonio_verde || 'Sin Etiqueta'}</td>
            </tr>

            <tr>
              <td colspan="4" class="section-banner">III. COMPONENTES PERIFÉRICOS ASIGNADOS</td>
            </tr>
            <tr class="perifericos-header-row">
              <td>Tipo Dispositivo</td>
              <td>Marca / Modelo</td>
              <td>Número de Serie</td>
              <td>Cód. Patrimonio</td>
            </tr>
            ${perifericosRows}
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

  // ====================================================
  // NUEVA FUNCIÓN CORREGIDA: GENERAR FUP
  // ====================================================
  const generarFUP = () => {
    if (!equipo) return;

    const idString = String(id || equipo.id_equipo || '0');
    const fechaHoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const correlativo = `FUP-${new Date().getFullYear()}-${idString.padStart(4, '0')}`;
    
    const isAsignacion = fupTramite === 'Asignación' ? 'X' : '&nbsp;&nbsp;';
    const isMantenimiento = fupTramite === 'Salida por Mantenimiento' ? 'X' : '&nbsp;&nbsp;';
    const isDevolucion = fupTramite === 'Acta de Devolución' ? 'X' : '&nbsp;&nbsp;';

    // 3. Generar la tabla de Bienes
    let filaItem = 1;
    let bienesRows = `
      <tr>
        <td style="text-align: center;">${filaItem++}</td>
        <td style="text-align: center;">${equipo.cod_patrimonio || 'S/N'}</td>
        <td>${equipo.tipo_equipo || 'N/A'}</td>
        <td style="text-align: center;">${equipo.marca || 'N/A'}</td>
        <td style="text-align: center;">${equipo.numero_serie || 'N/A'}</td>
        <td style="text-align: center;">${equipo.modelo || 'N/A'}</td>
        <td style="text-align: center;">${equipo.estado || 'N/A'}</td>
      </tr>
    `;

    // Validar que existan periféricos antes de recorrerlos
    if (perifericos && perifericos.length > 0) {
      perifericos.forEach(p => {
        bienesRows += `
          <tr>
            <td style="text-align: center;">${filaItem++}</td>
            <td style="text-align: center;">${p.cod_patrimonio_verde || p.cod_patrimonio_azul || 'S/N'}</td>
            <td>${p.tipo_periferico || 'N/A'}</td>
            <td style="text-align: center;">${p.marca || 'N/A'}</td>
            <td style="text-align: center;">${p.n_serie || p.numero_serie || 'N/A'}</td>
            <td style="text-align: center;">${p.modelo || 'N/A'}</td>
            <td style="text-align: center;">${p.estado || 'Bueno'}</td>
          </tr>
        `;
      });
    }

    // Rellenar filas en blanco para mantener el diseño
    for(let i = filaItem; i <= 5; i++){
       bienesRows += `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    }

    // Variables de usuario seguras
    const nombreUsuario = equipo.usuarios ? `${equipo.usuarios.apellidos || ''}, ${equipo.usuarios.nombres || ''}` : '---';
    const codPlanilla = equipo.usuarios?.cod_planilla || '---';
    const servicio = equipo.ubicaciones?.servicio || '---';
    const area = equipo.ubicaciones?.area || '---';

    // 4. Crear el HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FUP - ${correlativo}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Arial', sans-serif; font-size: 11px; margin: 0; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #000; padding: 6px; vertical-align: middle; }
            .header-title { font-weight: bold; font-size: 14px; text-align: center; }
            .section-title { font-weight: bold; background-color: #e0e0e0; text-align: left; padding: 4px; }
            .checkbox-box { display: inline-block; width: 14px; height: 14px; border: 1px solid #000; text-align: center; line-height: 14px; font-weight: bold; margin-right: 5px; }
            .signatures { margin-top: 60px; width: 100%; border: none !important; }
            .signatures td { border: none !important; text-align: center; vertical-align: bottom; height: 80px; }
            .line { border-top: 1px solid #000; width: 80%; margin: 0 auto 5px auto; }
            .notes { font-size: 9px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <td style="width: 25%; text-align:center; border-right:none;">
                <strong>EsSalud</strong><br><span style="font-size:9px;">Seguridad Social para todos</span>
              </td>
              <td style="width: 50%; border-left:none; border-right:none; text-align:center;">
                <div class="header-title">FORMULARIO ÚNICO PATRIMONIAL</div>
                <div style="font-size:10px;">(Uso Interno)</div>
              </td>
              <td style="width: 25%; border-left:none; font-size:10px;">
                <div>N°: <strong>${correlativo}</strong></div>
                <div>Fecha: <strong>${fechaHoy}</strong></div>
              </td>
            </tr>
          </table>

          <table>
            <tr><td colspan="3" class="section-title">I. MOTIVO DEL TRÁMITE</td></tr>
            <tr>
              <td><span class="checkbox-box">&nbsp;&nbsp;</span> Toma de Inventario</td>
              <td><span class="checkbox-box">${isAsignacion}</span> Cuadro de Asignación</td>
              <td><span class="checkbox-box">&nbsp;&nbsp;</span> Desplazamiento Interno</td>
            </tr>
            <tr>
              <td><span class="checkbox-box">${isMantenimiento}</span> Salida por Mantenimiento (*)</td>
              <td colspan="2"><span class="checkbox-box">${isDevolucion}</span> Acta de Devolución</td>
            </tr>
          </table>

          <table>
            <tr><td colspan="4" class="section-title">II. DATOS DEL ORIGEN / ASIGNACIÓN</td></tr>
            <tr>
              <td style="width: 18%; font-weight:bold;">Trabajador / Responsable:</td>
              <td style="width: 32%;">${nombreUsuario}</td>
              <td style="width: 18%; font-weight:bold;">Código Planilla / DNI:</td>
              <td style="width: 32%;">${codPlanilla}</td>
            </tr>
            <tr>
              <td style="font-weight:bold;">Dependencia / Servicio:</td>
              <td>${servicio}</td>
              <td style="font-weight:bold;">Ambiente / Área:</td>
              <td>${area}</td>
            </tr>
          </table>

          <table>
            <tr><td colspan="7" class="section-title">III. DATOS DE LOS BIENES INFORMÁTICOS</td></tr>
            <tr style="text-align:center; font-weight:bold; background-color:#f5f5f5;">
              <td style="width:5%;">Ítem</td>
              <td style="width:15%;">Cód. Patrimonial</td>
              <td style="width:25%;">Descripción</td>
              <td style="width:15%;">Marca</td>
              <td style="width:15%;">Serie</td>
              <td style="width:15%;">Modelo</td>
              <td style="width:10%;">Estado</td>
            </tr>
            ${bienesRows}
          </table>

          <table>
            <tr><td colspan="4" class="section-title">IV. DATOS DEL DESTINO EXTERNO / MANTENIMIENTO</td></tr>
            <tr>
              <td style="width: 25%; font-weight:bold;">DNI del Responsable de Traslado (*):</td>
              <td style="width: 25%;">${fupDni || '---'}</td>
              <td style="width: 25%; font-weight:bold;">Razón Social Empresa (**):</td>
              <td style="width: 25%;">${fupEmpresa || '---'}</td>
            </tr>
            <tr>
              <td style="font-weight:bold;">Dirección de la Empresa (***):</td>
              <td colspan="3">${fupDireccion || '---'}</td>
            </tr>
          </table>

          <div class="notes">
            (*) En caso de usar Salida por Mantenimiento ingresar el número de DNI de la persona responsable del desplazamiento.<br>
            (**) En caso de usar Salida por Mantenimiento ingresar la Razón Social de la Empresa que ejecutará el mantenimiento.<br>
            (***) En caso de usar Salida por Mantenimiento ingresar la Dirección de la Empresa que ejecutará el mantenimiento.
          </div>

          <table class="signatures">
            <tr>
              <td>
                <div class="line"></div>
                <strong>Firma del Trabajador / Usuario</strong>
              </td>
              <td>
                <div class="line"></div>
                <strong>Jefe Inmediato de la Dependencia</strong>
              </td>
              <td>
                <div class="line"></div>
                <strong>Área de Soporte Informático</strong>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // 5. Escribir y Ejecutar Impresión de Forma Segura
    const win = window.open('', '_blank', 'height=900,width=750');
    if (win) {
      win.document.open();
      win.document.write(htmlContent);
      win.document.close();
      
      // Cerrar el modal en tu pantalla original
      setShowFupModal(false);

      // Usar setTimeout asegurando que la ventana popup ejecute la impresión tras cargar el HTML
      setTimeout(() => {
        win.focus();
        win.print();
      }, 500);
    } else {
      alert("Por favor permite las ventanas emergentes (pop-ups) en tu navegador para generar el PDF.");
    }
  };
  // Impresión de stickers de inventario
  const handlePrintQR = () => {
    const printContent = qrRef.current?.innerHTML;
    if (printContent) {
      const win = window.open('', '', 'height=400,width=400');
      win?.document.write(`
        <html>
          <head>
            <title>Sticker Inventario</title>
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
      {showFupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileSignature className="w-6 h-6 text-indigo-600" />
              Generar Formulario Patrimonial
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Motivo del Trámite</label>
                <select 
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={fupTramite}
                  onChange={(e) => {
                    setFupTramite(e.target.value);
                    if (e.target.value !== 'Salida por Mantenimiento') {
                      setFupDni(''); setFupEmpresa(''); setFupDireccion('');
                    }
                  }}
                >
                  <option value="Asignación">Cuadro de Asignación / Entrega</option>
                  <option value="Acta de Devolución">Acta de Devolución</option>
                  <option value="Salida por Mantenimiento">Salida por Mantenimiento (Externo)</option>
                </select>
              </div>

              {/* CAMPOS CONDICIONALES PARA MANTENIMIENTO */}
              {fupTramite === 'Salida por Mantenimiento' && (
                <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Datos Obligatorios de Salida</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">DNI Responsable Traslado (*)</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" value={fupDni} onChange={(e) => setFupDni(e.target.value)} placeholder="Ej. 12345678" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Razón Social Empresa (**)</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" value={fupEmpresa} onChange={(e) => setFupEmpresa(e.target.value)} placeholder="Nombre del Taller / Proveedor" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dirección Empresa (***)</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" value={fupDireccion} onChange={(e) => setFupDireccion(e.target.value)} placeholder="Dirección exacta" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowFupModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancelar
              </button>
              {/* ESTE BOTÓN SÍ LLAMA A LA FUNCIÓN DE IMPRESIÓN */}
              <button 
                onClick={generarFUP}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md"
              >
                Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}
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
          <button 
          onClick={() => setShowFupModal(true)} 
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition shadow-xs cursor-pointer"
        >
          <FileSignature className="w-4 h-4" />
          <span className="hidden sm:inline">Generar FUP</span>
        </button>
          <button onClick={exportarAExcel} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition shadow-xs cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={exportarAPDF} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition shadow-xs cursor-pointer">
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
          
          {/* TARJETA: DATOS GENERALES */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs print:shadow-none print:border-gray-300">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2 print:border-gray-300">
              <FileText className="w-5 h-5 text-blue-500 print:hidden" /> Información General
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Tipo de Equipo</p><p className="font-bold text-gray-700 mt-0.5">{equipo.tipo_equipo}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Marca / Modelo</p><p className="font-bold text-gray-700 mt-0.5">{equipo.marca || 'N/A'} {equipo.modelo ? `- ${equipo.modelo}` : ''}</p></div>
              <div><p className="text-gray-400 text-xs font-semibold uppercase print:text-gray-600">Número de Serie</p><p className="font-mono font-medium text-gray-600 mt-0.5">{equipo.numero_serie || 'N/A'}</p></div>
              
              {/* FECHA DE REGISTRO */}
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
          
          {/* TARJETA DE USUARIO */}
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

            {/* Imprimir sticker */}
            <button onClick={handlePrintQR} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs print:hidden">
              <Printer className="w-3.5 h-3.5" /> Imprimir Etiqueta (Sticker)
            </button>
          </div>

            
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
  )
}