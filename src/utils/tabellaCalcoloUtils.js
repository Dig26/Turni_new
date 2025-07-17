// src/utils/tabellaCalcoloUtils.js

/**
 * Utilità per i calcoli della tabella di calcolo ROL, Ex festività e Ferie
 */

// Costanti
export const MESI = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];
export const GIORNI_FERIE_ANNUALI = 26;
export const MOLTIPLICATORE_ROL = 0.15;
export const MOLTIPLICATORE_EX_FEST = 0.06675;

/**
 * Calcola l'anzianità di servizio in anni
 * @param {Date|string} dataAssunzione - Data di assunzione
 * @param {Date|string} dataRiferimento - Data di riferimento (default: oggi)
 * @returns {number} Anni di servizio
 */
export function calcolaAnniServizio(dataAssunzione, dataRiferimento = new Date()) {
  if (!dataAssunzione) return 0;
  
  const assunzione = new Date(dataAssunzione);
  const riferimento = new Date(dataRiferimento);
  
  let anni = riferimento.getFullYear() - assunzione.getFullYear();
  const mese = riferimento.getMonth() - assunzione.getMonth();
  
  if (mese < 0 || (mese === 0 && riferimento.getDate() < assunzione.getDate())) {
    anni--;
  }
  
  return Math.max(0, anni);
}

/**
 * Calcola le ore mensili da ore settimanali
 * @param {number} oreSettimanali - Ore settimanali di lavoro
 * @returns {number} Ore mensili calcolate
 */
export function calcolaOreMensili(oreSettimanali) {
  return Math.round((oreSettimanali * 52) / 12);
}

/**
 * Calcola ROL maturati in base all'anzianità
 * @param {number} oreMensili - Ore mensili di lavoro
 * @param {number} anniServizio - Anni di servizio
 * @returns {number} ROL maturati
 */
export function calcolaROL(oreMensili, anniServizio) {
  if (anniServizio < 2) return 0;
  if (anniServizio >= 2 && anniServizio < 4) {
    return (MOLTIPLICATORE_ROL * oreMensili) / 2;
  }
  return MOLTIPLICATORE_ROL * oreMensili;
}

/**
 * Calcola Ex festività maturate
 * @param {number} oreMensili - Ore mensili di lavoro
 * @returns {number} Ex festività maturate
 */
export function calcolaExFestivita(oreMensili) {
  return MOLTIPLICATORE_EX_FEST * oreMensili;
}

/**
 * Calcola i giorni lavorativi in un mese
 * @param {number} anno - Anno
 * @param {number} mese - Mese (1-12)
 * @param {number} giorniLavorativiSettimanali - Giorni lavorati a settimana
 * @returns {number} Giorni lavorativi nel mese
 */
export function calcolaGiorniLavorativi(anno, mese, giorniLavorativiSettimanali = 6) {
  const primoGiorno = new Date(anno, mese - 1, 1);
  const ultimoGiorno = new Date(anno, mese, 0);
  const giorniTotali = ultimoGiorno.getDate();
  
  let giorniLavorativi = 0;
  const giorniRiposoSettimanali = 7 - giorniLavorativiSettimanali;
  
  for (let giorno = 1; giorno <= giorniTotali; giorno++) {
    const data = new Date(anno, mese - 1, giorno);
    const giornoSettimana = data.getDay(); // 0 = domenica, 6 = sabato
    
    // Considera i giorni di riposo come gli ultimi della settimana
    // Se 1 giorno di riposo = domenica (0)
    // Se 2 giorni di riposo = sabato (6) e domenica (0)
    let isGiornoRiposo = false;
    
    if (giorniRiposoSettimanali >= 1 && giornoSettimana === 0) {
      isGiornoRiposo = true; // Domenica
    }
    if (giorniRiposoSettimanali >= 2 && giornoSettimana === 6) {
      isGiornoRiposo = true; // Sabato
    }
    
    if (!isGiornoRiposo) {
      giorniLavorativi++;
    }
  }
  
  return giorniLavorativi;
}

/**
 * Calcola ore con variazioni multiple nel mese
 * @param {Array} variazioniMese - Array di variazioni nel mese [{ore: 30, giorni: 10}, {ore: 40, giorni: 15}]
 * @param {number} giorniLavorativiMese - Totale giorni lavorativi nel mese
 * @returns {number} Media ponderata delle ore
 */
export function calcolaOreConVariazioni(variazioniMese, giorniLavorativiMese) {
  if (!variazioniMese || variazioniMese.length === 0) return 0;
  
  let sommaOre = 0;
  
  variazioniMese.forEach(variazione => {
    const coefficienteGiornaliero = variazione.ore / giorniLavorativiMese;
    const oreEffettive = coefficienteGiornaliero * variazione.giorni;
    sommaOre += oreEffettive;
  });
  
  return sommaOre;
}

/**
 * Formatta numero con decimali fissi
 * @param {number} valore - Valore da formattare
 * @param {number} decimali - Numero di decimali (default: 2)
 * @returns {string} Valore formattato
 */
export function formattaNumero(valore, decimali = 2) {
  if (typeof valore !== 'number' || isNaN(valore)) return '0';
  return valore.toFixed(decimali);
}

/**
 * Calcola il residuo per una tipologia
 * @param {number} totaleAnnuo - Totale maturato nell'anno
 * @param {number} totaleGoduto - Totale goduto nell'anno
 * @param {number} residuoPrecedente - Residuo anno precedente
 * @returns {number} Residuo calcolato
 */
export function calcolaResiduo(totaleAnnuo, totaleGoduto, residuoPrecedente = 0) {
  return totaleAnnuo - totaleGoduto + residuoPrecedente;
}

/**
 * Valida ore settimanali
 * @param {number} ore - Ore da validare
 * @returns {boolean} True se valide
 */
export function validaOreSettimanali(ore) {
  return ore >= 0 && ore <= 48;
}

/**
 * Ottiene il nome del mese in italiano
 * @param {number} meseIndex - Indice del mese (0-11)
 * @returns {string} Nome del mese
 */
export function getNomeMese(meseIndex) {
  const nomiMesi = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  return nomiMesi[meseIndex] || '';
}

/**
 * Raggruppa dati per dipendente
 * @param {Array} tableData - Dati della tabella
 * @returns {Object} Dati raggruppati per dipendenteId
 */
export function raggruppaDatiPerDipendente(tableData) {
  const grouped = {};
  
  tableData.forEach(row => {
    if (!grouped[row.dipendenteId]) {
      grouped[row.dipendenteId] = {
        info: null,
        contratto: null,
        rol: null,
        rolGoduti: null,
        exFest: null,
        exFestGodute: null,
        ferie: null
      };
    }
    
    switch (row.rigaTipo) {
      case 1:
        grouped[row.dipendenteId].contratto = row;
        grouped[row.dipendenteId].info = {
          cognomeNome: row.cognomeNome,
          dataAssunzione: row.dataAssunzione,
          dataCessazione: row.dataCessazione
        };
        break;
      case 2:
        grouped[row.dipendenteId].rol = row;
        break;
      case 3:
        grouped[row.dipendenteId].rolGoduti = row;
        break;
      case 4:
        grouped[row.dipendenteId].exFest = row;
        break;
      case 5:
        grouped[row.dipendenteId].exFestGodute = row;
        break;
      case 6:
        grouped[row.dipendenteId].ferie = row;
        break;
    }
  });
  
  return grouped;
}

/**
 * Esporta dati per Excel
 * @param {Array} tableData - Dati della tabella
 * @param {Object} metadata - Metadati (negozio, anno, ecc.)
 * @returns {Object} Dati formattati per export Excel
 */
export function preparaDatiPerExport(tableData, metadata) {
  const headers = [
    'Cognome e Nome',
    'Data Assunzione',
    'Data Cessazione',
    'Descrizione Ratio',
    'Tipo Ratio',
    'Residuo Anno Prec. 1',
    'Residuo Anno Prec. 2',
    ...MESI,
    'Totale Annuo',
    'Residuo'
  ];
  
  const rows = tableData.map(row => [
    row.cognomeNome,
    row.dataAssunzione,
    row.dataCessazione,
    row.descrizioneRatio,
    row.tipoRatio,
    row.residuoCol1,
    row.residuoCol2,
    ...MESI.map(mese => row[mese]),
    row.totaleAnnuo,
    row.residuo
  ]);
  
  return {
    headers,
    rows,
    metadata: {
      negozio: metadata.negozioNome,
      anno: metadata.anno,
      dataExport: new Date().toLocaleDateString('it-IT')
    }
  };
}

/**
 * Calcola statistiche aggregate
 * @param {Array} tableData - Dati della tabella
 * @returns {Object} Statistiche aggregate
 */
export function calcolaStatistiche(tableData) {
  const datiRaggruppati = raggruppaDatiPerDipendente(tableData);
  const dipendenti = Object.values(datiRaggruppati);
  
  const stats = {
    numeroDipendenti: dipendenti.length,
    totaleROLMaturati: 0,
    totaleROLGoduti: 0,
    totaleExFestMaturate: 0,
    totaleExFestGodute: 0,
    totaleFerieGodute: 0,
    totaleResiduoROL: 0,
    totaleResiduoExFest: 0,
    totaleResiduoFerie: 0
  };
  
  dipendenti.forEach(dip => {
    if (dip.rol) {
      stats.totaleROLMaturati += parseFloat(dip.rol.totaleAnnuo) || 0;
      stats.totaleResiduoROL += parseFloat(dip.rol.residuo) || 0;
    }
    
    if (dip.rolGoduti) {
      MESI.forEach(mese => {
        stats.totaleROLGoduti += parseFloat(dip.rolGoduti[mese]) || 0;
      });
    }
    
    if (dip.exFest) {
      stats.totaleExFestMaturate += parseFloat(dip.exFest.totaleAnnuo) || 0;
      stats.totaleResiduoExFest += parseFloat(dip.exFest.residuo) || 0;
    }
    
    if (dip.exFestGodute) {
      MESI.forEach(mese => {
        stats.totaleExFestGodute += parseFloat(dip.exFestGodute[mese]) || 0;
      });
    }
    
    if (dip.ferie) {
      MESI.forEach(mese => {
        stats.totaleFerieGodute += parseFloat(dip.ferie[mese]) || 0;
      });
      stats.totaleResiduoFerie += parseFloat(dip.ferie.residuo) || 0;
    }
  });
  
  return stats;
}

export default {
  calcolaAnniServizio,
  calcolaOreMensili,
  calcolaROL,
  calcolaExFestivita,
  calcolaGiorniLavorativi,
  calcolaOreConVariazioni,
  formattaNumero,
  calcolaResiduo,
  validaOreSettimanali,
  getNomeMese,
  raggruppaDatiPerDipendente,
  preparaDatiPerExport,
  calcolaStatistiche
};