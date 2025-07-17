// src/utils/excelExportUtils.js
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { preparaDatiPerExport, MESI } from './tabellaCalcoloUtils';

/**
 * Esporta la tabella di calcolo in formato Excel
 * @param {Array} tableData - Dati della tabella
 * @param {Object} metadata - Metadati (negozio, anno, ecc.)
 */
export function exportTabellaCalcoloToExcel(tableData, metadata) {
  try {
    // Prepara i dati per l'export
    const exportData = preparaDatiPerExport(tableData, metadata);
    
    // Crea un nuovo workbook
    const wb = XLSX.utils.book_new();
    
    // Crea il foglio principale
    const ws = createMainSheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Tabella Calcolo');
    
    // Crea il foglio riepilogo
    const summarySheet = createSummarySheet(tableData, metadata);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Riepilogo');
    
    // Genera il file Excel
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    
    // Salva il file
    const fileName = `tabella_calcolo_${metadata.negozioNome}_${metadata.anno}.xlsx`;
    saveAs(new Blob([s2ab(wbout)], { type: 'application/octet-stream' }), fileName);
    
    return true;
  } catch (error) {
    console.error('Errore nell\'export Excel:', error);
    throw error;
  }
}

/**
 * Crea il foglio principale con i dati della tabella
 */
function createMainSheet(exportData) {
  const { headers, rows } = exportData;
  
  // Crea array di dati con headers
  const sheetData = [headers, ...rows];
  
  // Converti in worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Applica stili e formattazione
  applyMainSheetStyles(ws, exportData);
  
  // Imposta larghezza colonne
  const colWidths = [
    { wch: 25 }, // Cognome e Nome
    { wch: 15 }, // Data Assunzione
    { wch: 15 }, // Data Cessazione
    { wch: 25 }, // Descrizione Ratio
    { wch: 10 }, // Tipo Ratio
    { wch: 20 }, // Residuo Anno Prec. 1
    { wch: 20 }, // Residuo Anno Prec. 2
    ...MESI.map(() => ({ wch: 8 })), // Mesi
    { wch: 12 }, // Totale Annuo
    { wch: 12 }  // Residuo
  ];
  ws['!cols'] = colWidths;
  
  // Aggiungi merge cells per le prime 3 colonne
  const merges = [];
  let rowIndex = 1; // Salta header
  
  // Per ogni gruppo di 6 righe (dipendente)
  while (rowIndex < rows.length) {
    // Merge cognome nome (colonna A)
    merges.push({
      s: { r: rowIndex, c: 0 },
      e: { r: rowIndex + 5, c: 0 }
    });
    
    // Merge data assunzione (colonna B)
    merges.push({
      s: { r: rowIndex, c: 1 },
      e: { r: rowIndex + 5, c: 1 }
    });
    
    // Merge data cessazione (colonna C)
    merges.push({
      s: { r: rowIndex, c: 2 },
      e: { r: rowIndex + 5, c: 2 }
    });
    
    rowIndex += 6;
  }
  
  ws['!merges'] = merges;
  
  return ws;
}

/**
 * Crea il foglio riepilogo con statistiche
 */
function createSummarySheet(tableData, metadata) {
  const stats = calculateExportStats(tableData);
  
  const summaryData = [
    ['RIEPILOGO TABELLA CALCOLO'],
    [],
    ['Negozio:', metadata.negozioNome],
    ['Anno:', metadata.anno],
    ['Data Export:', new Date().toLocaleDateString('it-IT')],
    [],
    ['STATISTICHE GENERALI'],
    ['Numero Dipendenti:', stats.numeroDipendenti],
    [],
    ['ROL'],
    ['Totale Maturati:', stats.totaleROLMaturati + ' ore'],
    ['Totale Goduti:', stats.totaleROLGoduti + ' ore'],
    ['Totale Residuo:', stats.totaleResiduoROL + ' ore'],
    [],
    ['EX FESTIVITÀ'],
    ['Totale Maturate:', stats.totaleExFestMaturate + ' ore'],
    ['Totale Godute:', stats.totaleExFestGodute + ' ore'],
    ['Totale Residuo:', stats.totaleResiduoExFest + ' ore'],
    [],
    ['FERIE'],
    ['Totale Spettanti:', (stats.numeroDipendenti * 26) + ' giorni'],
    ['Totale Godute:', stats.totaleFerieGodute + ' giorni'],
    ['Totale Residuo:', stats.totaleResiduoFerie + ' giorni']
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Applica stili al foglio riepilogo
  applySummarySheetStyles(ws);
  
  // Imposta larghezza colonne
  ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
  
  return ws;
}

/**
 * Applica stili al foglio principale
 */
function applyMainSheetStyles(ws, exportData) {
  // Header style
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '3498DB' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };
  
  // Applica stile agli headers
  for (let i = 0; i < exportData.headers.length; i++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = headerStyle;
  }
  
  // Stili per righe
  const rowStyles = {
    contratto: { fill: { fgColor: { rgb: 'E3F2FD' } } },
    rol: { fill: { fgColor: { rgb: 'F3E5F5' } } },
    exfest: { fill: { fgColor: { rgb: 'E8F5E9' } } },
    ferie: { fill: { fgColor: { rgb: 'FFF9C4' } } }
  };
  
  // Applica stili alle righe in base al tipo
  exportData.rows.forEach((row, rowIndex) => {
    const rigaTipo = ((rowIndex) % 6) + 1;
    let style;
    
    switch (rigaTipo) {
      case 1:
        style = rowStyles.contratto;
        break;
      case 2:
      case 3:
        style = rowStyles.rol;
        break;
      case 4:
      case 5:
        style = rowStyles.exfest;
        break;
      case 6:
        style = rowStyles.ferie;
        break;
    }
    
    // Applica lo stile a tutte le celle della riga
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = style;
    }
  });
}

/**
 * Applica stili al foglio riepilogo
 */
function applySummarySheetStyles(ws) {
  // Titolo principale
  const titleStyle = {
    font: { bold: true, size: 16 },
    alignment: { horizontal: 'center' }
  };
  
  // Headers sezioni
  const sectionStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: 'E0E0E0' } }
  };
  
  // Applica stili
  if (ws['A1']) ws['A1'].s = titleStyle;
  if (ws['A7']) ws['A7'].s = sectionStyle;
  if (ws['A10']) ws['A10'].s = sectionStyle;
  if (ws['A15']) ws['A15'].s = sectionStyle;
  if (ws['A20']) ws['A20'].s = sectionStyle;
}

/**
 * Calcola statistiche per l'export
 */
function calculateExportStats(tableData) {
  const stats = {
    numeroDipendenti: 0,
    totaleROLMaturati: 0,
    totaleROLGoduti: 0,
    totaleExFestMaturate: 0,
    totaleExFestGodute: 0,
    totaleFerieGodute: 0,
    totaleResiduoROL: 0,
    totaleResiduoExFest: 0,
    totaleResiduoFerie: 0
  };
  
  // Conta dipendenti unici
  const dipendentiIds = new Set(tableData.map(row => row.dipendenteId));
  stats.numeroDipendenti = dipendentiIds.size;
  
  // Calcola totali
  tableData.forEach(row => {
    switch (row.rigaTipo) {
      case 2: // ROL
        stats.totaleROLMaturati += parseFloat(row.totaleAnnuo) || 0;
        stats.totaleResiduoROL += parseFloat(row.residuo) || 0;
        break;
      case 3: // ROL goduti
        MESI.forEach(mese => {
          stats.totaleROLGoduti += parseFloat(row[mese]) || 0;
        });
        break;
      case 4: // Ex festività
        stats.totaleExFestMaturate += parseFloat(row.totaleAnnuo) || 0;
        stats.totaleResiduoExFest += parseFloat(row.residuo) || 0;
        break;
      case 5: // Ex festività godute
        MESI.forEach(mese => {
          stats.totaleExFestGodute += parseFloat(row[mese]) || 0;
        });
        break;
      case 6: // Ferie
        MESI.forEach(mese => {
          stats.totaleFerieGodute += parseFloat(row[mese]) || 0;
        });
        stats.totaleResiduoFerie += parseFloat(row.residuo) || 0;
        break;
    }
  });
  
  // Arrotonda i valori
  Object.keys(stats).forEach(key => {
    if (typeof stats[key] === 'number' && key !== 'numeroDipendenti') {
      stats[key] = stats[key].toFixed(2);
    }
  });
  
  return stats;
}

/**
 * Converte stringa in ArrayBuffer
 */
function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xFF;
  }
  return buf;
}

export default {
  exportTabellaCalcoloToExcel
};