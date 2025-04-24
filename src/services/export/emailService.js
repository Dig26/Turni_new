// services/export/emailService.js
// Servizio per l'invio di email
// Nota: In un'app reale, questo utilizzerebbe un servizio di invio email (API, SMTP, ecc.)

// Funzione per simulare l'invio di un'email
const simulateSendEmail = (to, subject, content, options = {}) => {
    return new Promise((resolve, reject) => {
      // Simuliamo un ritardo per l'invio dell'email
      setTimeout(() => {
        console.log('Simulazione invio email:', { to, subject, content, options });
        
        // Simuliamo un tasso di successo del 95%
        const success = Math.random() < 0.95;
        
        if (success) {
          resolve({
            success: true,
            messageId: `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString()
          });
        } else {
          reject(new Error('Errore simulato nell\'invio dell\'email'));
        }
      }, 1500);
    });
  };
  
  // Funzione principale per inviare un'email
  export const sendEmail = async (to, subject, content, options = {}) => {
    try {
      // Validazione di base
      if (!to || !subject || !content) {
        throw new Error('Email, oggetto e contenuto sono obbligatori');
      }
      
      // In un'app reale, qui utilizzeremmo un servizio di invio email
      const result = await simulateSendEmail(to, subject, content, options);
      
      return {
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp,
        message: 'Email inviata correttamente (simulata)'
      };
    } catch (error) {
      console.error('Errore nell\'invio dell\'email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Funzione per inviare una tabella turni via email
  export const sendTableByEmail = async (tableData, emailOptions) => {
    try {
      const { to, subject, message } = emailOptions;
      
      // Creiamo un contenuto per l'email con la tabella
      const emailContent = `
  ${message || 'Ecco la tabella dei turni richiesta:'}
  
  [Immagine tabella turni]
  
  Riepilogo:
  - Periodo: ${tableData.period || 'Non specificato'}
  - Numero di dipendenti: ${tableData.employees?.length || 'Non specificato'}
  - Ore totali: ${tableData.totalHours || 'Non specificato'}
  
  Questa è un'email automatica, si prega di non rispondere.
      `;
      
      // Aggiungiamo la tabella come allegato (simulato)
      const options = {
        attachments: [
          {
            filename: `turni_${new Date().toISOString().slice(0, 10)}.pdf`,
            content: 'Simulazione di allegato PDF',
            contentType: 'application/pdf'
          }
        ]
      };
      
      const result = await sendEmail(to, subject || 'Tabella Turni', emailContent, options);
      
      return {
        ...result,
        message: 'Tabella turni inviata via email correttamente (simulata)'
      };
    } catch (error) {
      console.error('Errore nell\'invio della tabella via email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Funzione per inviare un report di statistiche via email
  export const sendStatsReportByEmail = async (stats, period, emailOptions) => {
    try {
      const { to, subject, message } = emailOptions;
      
      // Creiamo un contenuto per l'email con le statistiche
      const emailContent = `
  ${message || 'Ecco il report di statistiche richiesto:'}
  
  Riepilogo Statistiche:
  - Periodo: da ${period.start} a ${period.end}
  - Ore totali lavorate: ${stats.totalHours || 'N/D'}
  - Numero di dipendenti: ${stats.employeeCount || 'N/D'}
  - Media ore per dipendente: ${stats.averageHours || 'N/D'}
  
  [Grafici statistiche]
  
  Questa è un'email automatica, si prega di non rispondere.
      `;
      
      // Aggiungiamo il report come allegato (simulato)
      const options = {
        attachments: [
          {
            filename: `report_statistiche_${period.start}_${period.end}.pdf`,
            content: 'Simulazione di allegato PDF di statistiche',
            contentType: 'application/pdf'
          },
          {
            filename: `dati_statistiche_${period.start}_${period.end}.xlsx`,
            content: 'Simulazione di allegato Excel di statistiche',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        ]
      };
      
      const result = await sendEmail(to, subject || 'Report Statistiche Turni', emailContent, options);
      
      return {
        ...result,
        message: 'Report statistiche inviato via email correttamente (simulato)'
      };
    } catch (error) {
      console.error('Errore nell\'invio del report statistiche via email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Funzione per inviare una notifica ai dipendenti
  export const sendNotificationToEmployees = async (employees, notificationOptions) => {
    try {
      const { subject, message, includeSchedule } = notificationOptions;
      
      const results = [];
      
      // Invia un'email a ciascun dipendente (simulato)
      for (const employee of employees) {
        const emailContent = `
  Gentile ${employee.nome} ${employee.cognome},
  
  ${message || 'Ti informiamo che sono stati aggiornati i turni di lavoro.'}
  
  ${includeSchedule ? `I tuoi prossimi turni:
  - Lunedì: ${employee.schedule?.monday || 'N/D'}
  - Martedì: ${employee.schedule?.tuesday || 'N/D'}
  - Mercoledì: ${employee.schedule?.wednesday || 'N/D'}
  - Giovedì: ${employee.schedule?.thursday || 'N/D'}
  - Venerdì: ${employee.schedule?.friday || 'N/D'}
  - Sabato: ${employee.schedule?.saturday || 'N/D'}
  - Domenica: ${employee.schedule?.sunday || 'N/D'}` : ''}
  
  Cordiali saluti,
  Il sistema di gestione turni
        `;
        
        const options = includeSchedule ? {
          attachments: [
            {
              filename: `turni_personali_${employee.nome}_${employee.cognome}.pdf`,
              content: 'Simulazione di allegato PDF di turni personali',
              contentType: 'application/pdf'
            }
          ]
        } : {};
        
        try {
          const result = await sendEmail(
            employee.email,
            subject || 'Aggiornamento Turni Lavorativi',
            emailContent,
            options
          );
          
          results.push({
            employee: `${employee.nome} ${employee.cognome}`,
            email: employee.email,
            success: true,
            messageId: result.messageId
          });
        } catch (error) {
          results.push({
            employee: `${employee.nome} ${employee.cognome}`,
            email: employee.email,
            success: false,
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        totalSent: successCount,
        totalFailed: employees.length - successCount,
        results,
        message: `Notifiche inviate a ${successCount} dipendenti su ${employees.length} (simulate)`
      };
    } catch (error) {
      console.error('Errore nell\'invio delle notifiche ai dipendenti:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Funzione per inviare una copia della tabella turni via email
  export const shareTableByEmail = async (tableData, shareOptions) => {
    try {
      const { to, subject, message, format } = shareOptions;
      
      // Creiamo un contenuto per l'email con la tabella
      const emailContent = `
  ${message || 'Ecco la tabella dei turni condivisa:'}
  
  Tabella dei turni per il periodo: ${tableData.period || 'Non specificato'}
  
  Questa è un'email automatica, si prega di non rispondere.
      `;
      
      // Aggiungiamo la tabella come allegato nel formato richiesto (simulato)
      const options = {
        attachments: []
      };
      
      if (format === 'pdf' || format === 'all') {
        options.attachments.push({
          filename: `turni_${new Date().toISOString().slice(0, 10)}.pdf`,
          content: 'Simulazione di allegato PDF',
          contentType: 'application/pdf'
        });
      }
      
      if (format === 'excel' || format === 'all') {
        options.attachments.push({
          filename: `turni_${new Date().toISOString().slice(0, 10)}.xlsx`,
          content: 'Simulazione di allegato Excel',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }
      
      if (format === 'csv' || format === 'all') {
        options.attachments.push({
          filename: `turni_${new Date().toISOString().slice(0, 10)}.csv`,
          content: 'Simulazione di allegato CSV',
          contentType: 'text/csv'
        });
      }
      
      const result = await sendEmail(to, subject || 'Condivisione Tabella Turni', emailContent, options);
      
      return {
        ...result,
        message: `Tabella turni condivisa via email in formato ${format} correttamente (simulata)`
      };
    } catch (error) {
      console.error('Errore nella condivisione della tabella via email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };