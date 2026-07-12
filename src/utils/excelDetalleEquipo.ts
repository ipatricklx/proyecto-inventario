// utils/excelDetalleEquipo.ts
import ExcelJS from 'exceljs';

export const exportarDetalleEquipoExcel = async (equipo: any, perifericos: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ficha de Equipo');


  worksheet.views = [{ showGridLines: true }];

  // 1. TÍTULO PRINCIPAL
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'FICHA TÉCNICA Y CONTROL DE ACTIVO INFORMÁTICO';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0073C3' } }; // Azul EsSalud
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 35;

  // 2. BLOQUE DE DATOS DEL RESPONSABLE
  worksheet.mergeCells('A3:F3');
  const sectionUser = worksheet.getCell('A3');
  sectionUser.value = 'I. DATOS DEL USUARIO RESPONSABLE';
  sectionUser.font = { name: 'Arial', size: 11, bold: true, color: { argb: '1F2937' } };
  sectionUser.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0F2FE' } };

  worksheet.getCell('A4').value = 'Apellidos y Nombres:';
  worksheet.getCell('B4').value = `${equipo.usuarios?.apellidos || ''}, ${equipo.usuarios?.nombres || ''}`;
  worksheet.getCell('D4').value = 'Código Planilla:';
  worksheet.getCell('E4').value = equipo.usuarios?.cod_planilla || 'N/A';

  worksheet.getCell('A5').value = 'Usuario de Red:';
  worksheet.getCell('B5').value = equipo.usuarios?.usuario_red_windows || 'N/A';
  worksheet.getCell('D5').value = 'Anexo / Contacto:';
  worksheet.getCell('E5').value = equipo.usuarios?.anexo || 'N/A';

  // Estilar bloque de usuario (Negritas para etiquetas)
  ['A4', 'A5', 'D4', 'D5'].forEach(cell => worksheet.getCell(cell).font = { bold: true, size: 10 });

  // 3. BLOQUE DEL EQUIPO PRINCIPAL
  worksheet.mergeCells('A7:F7');
  const sectionEquip = worksheet.getCell('A7');
  sectionEquip.value = 'II. ESPECIFICACIONES DEL EQUIPO PRINCIPAL';
  sectionEquip.font = { name: 'Arial', size: 11, bold: true, color: { argb: '1F2937' } };
  sectionEquip.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0F2FE' } };

  worksheet.getCell('A8').value = 'Tipo Dispositivo:';
  worksheet.getCell('B8').value = equipo.tipo_dispositivo || '-';
  worksheet.getCell('D8').value = 'Cód. Patrimonial:';
  worksheet.getCell('E8').value = equipo.cod_patrimonial || '-';

  worksheet.getCell('A9').value = 'Marca / Modelo:';
  worksheet.getCell('B9').value = `${equipo.marca || ''} ${equipo.modelo || ''}`;
  worksheet.getCell('D9').value = 'Número de Serie:';
  worksheet.getCell('E9').value = equipo.num_serie || '-';

  worksheet.getCell('A10').value = 'Nombre en Red (Hostname):';
  worksheet.getCell('B10').value = equipo.nombre_red_computadora || '-';
  worksheet.getCell('D10').value = 'Dirección IP:';
  worksheet.getCell('E10').value = equipo.direccion_ip || 'DHCP';

  worksheet.getCell('A11').value = 'Sistema Operativo:';
  worksheet.getCell('B11').value = equipo.sistema_operativo || '-';
  worksheet.getCell('D11').value = 'Estado Físico:';
  worksheet.getCell('E11').value = equipo.estado?.toUpperCase() || '-';

  ['A8', 'A9', 'A10', 'A11', 'D8', 'D9', 'D10', 'D11'].forEach(cell => worksheet.getCell(cell).font = { bold: true, size: 10 });

  // 4. TABLA DE PERIFÉRICOS ASIGNADOS
  worksheet.mergeCells('A13:F13');
  const sectionPeri = worksheet.getCell('A13');
  sectionPeri.value = 'III. COMPONENTES Y PERIFÉRICOS ADICIONALES VINCULADOS';
  sectionPeri.font = { name: 'Arial', size: 11, bold: true, color: { argb: '1F2937' } };
  sectionPeri.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0F2FE' } };

  // Encabezados de la subtabla
  const headers = ['Componente/Periférico', 'Marca', 'Modelo', 'Número de Serie', 'Cód. Patrimonial', 'Estado'];
  headers.forEach((h, idx) => {
    const cell = worksheet.getCell(14, idx + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '475569' } }; // Gris oscuro
    cell.alignment = { horizontal: 'center' };
  });

  // Insertar registros de periféricos
  let filaActual = 15;
  if (perifericos.length === 0) {
    worksheet.mergeCells(`A${filaActual}:F${filaActual}`);
    worksheet.getCell(`A${filaActual}`).value = 'No cuenta con periféricos asignados.';
    worksheet.getCell(`A${filaActual}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`A${filaActual}`).font = { italic: true, color: { argb: '9CA3AF' } };
    filaActual++;
  } else {
    perifericos.forEach((p) => {
      worksheet.getCell(filaActual, 1).value = p.tipo_periferico || '-';
      worksheet.getCell(filaActual, 2).value = p.marca || '-';
      worksheet.getCell(filaActual, 3).value = p.modelo || '-';
      worksheet.getCell(filaActual, 4).value = p.num_serie || '-';
      worksheet.getCell(filaActual, 5).value = p.cod_patrimonial || '-';
      worksheet.getCell(filaActual, 6).value = p.estado || '-';
      
      // Zebra striping ligero
      if (filaActual % 2 === 0) {
        for (let i = 1; i <= 6; i++) {
          worksheet.getCell(filaActual, i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
        }
      }
      filaActual++;
    });
  }

  // Autoajustar anchos de columna de forma segura
  worksheet.columns.forEach((col) => {
    col.width = 22; 
  });

  // Exportar y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ficha_Activo_${equipo.cod_patrimonial || equipo.id_equipo}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};