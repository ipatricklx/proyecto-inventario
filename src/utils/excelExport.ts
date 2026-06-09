import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// -------------------------------------------------------------------------
// 1. TU FUNCIÓN ORIGINAL DE EXPORTAR REPORTES (Déjala como la tenías, aquí pongo la firma como referencia)
// -------------------------------------------------------------------------
export const exportToExcel = async (
  title: string,
  columns: any[],
  data: any[],
  fileName: string
) => {
  // ... (Aquí mantienes el código de exportToExcel que ya te funcionaba perfecto) ...
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte');

  // Título
  const titleRow = worksheet.addRow([title]);
  titleRow.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
  worksheet.mergeCells(1, 1, 1, columns.length);
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.addRow([]); // Espacio

  // Cabeceras
  const headerRow = worksheet.addRow(columns.map(c => c.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  columns.forEach((col, i) => {
    worksheet.getColumn(i + 1).width = col.width || 20;
  });

  // Datos
  data.forEach((item) => {
    const rowData = columns.map(col => item[col.key] || '-');
    worksheet.addRow(rowData);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};

// -------------------------------------------------------------------------
// 2. LA NUEVA FUNCIÓN GENÉRICA DE PLANTILLAS
// -------------------------------------------------------------------------
/**
 * Genera y descarga una plantilla Excel limpia para cualquier módulo.
 * @param columns Array con los nombres técnicos (ej. ['red_asistencial', 'departamento'])
 * @param fileName Nombre del archivo a descargar
 * @param exampleRow Array opcional con datos de ejemplo para guiar al usuario (ej. ['Almenara', 'Cirugía'])
 */
export const downloadExcelTemplate = async (
  columns: string[],
  fileName: string,
  exampleRow?: string[]
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Plantilla_Importacion');

  // 1. Crear la Fila 1 con los nombres técnicos
  const headerRow = worksheet.addRow(columns);
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '10B981' }, 
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // 2. Añadir la fila de ejemplo SOLO si la enviamos desde el page.tsx
  if (exampleRow && exampleRow.length > 0) {
    const ejemploRow = worksheet.addRow(exampleRow);
    ejemploRow.eachCell((cell) => {
      cell.font = { italic: true, color: { argb: '6B7280' } }; 
    });
  }

  // 3. Ajustar el ancho
  worksheet.columns.forEach(column => {
    column.width = 25;
  });

  // 4. Descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};