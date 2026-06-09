import ExcelJS from 'exceljs';

/**
 * Lee un archivo Excel subido por el usuario y lo convierte en un array de objetos.
 * @param file El archivo capturado desde el input
 * @param expectedHeaders Las cabeceras exactas que esperamos en la fila 1 para validar el archivo
 */
export const importFromExcel = async (file: File, expectedHeaders: string[]): Promise<any[]> => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error('El archivo Excel está vacío.');

    const data: any[] = [];
    const headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value?.toString().trim() || '';
        });

        const isFormatValid = expectedHeaders.every(h => headers.includes(h));
        if (!isFormatValid) {
          throw new Error('El formato del Excel no es válido. Faltan columnas requeridas.');
        }
      } else {
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const headerName = headers[colNumber];
          if (headerName) {
            rowData[headerName] = cell.value;
          }
        });
        
        if (Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      }
    });

    return data;
  } catch (error) {
    throw error;
  }
};