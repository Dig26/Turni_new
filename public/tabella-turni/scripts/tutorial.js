const tutorialSteps = [
    {
      target: 'body', // Selezione dell'intero body come primo elemento
      title: 'Benvenuto nella Gestione Turni',
      content: 'Questa guida ti mostrerà come utilizzare la tabella dei turni. Premi "Avanti" per continuare o "Salta" per saltare il tutorial.',
      position: 'center'
    },
    {
      target: '.htCore tbody tr:first-child td:nth-child(3)', // Prima colonna di un dipendente
      title: 'Colonne dei Dipendenti',
      content: 'Ogni dipendente ha due colonne: una per la visualizzazione dell\'orario di lavoro (Es. "09:00 - 17:00") e l\'altra per mostrare il totale delle ore.',
      position: 'bottom'
    },
    {
      target: '.htCore tbody tr:nth-child(2) td:nth-child(3)', // Cella di un dipendente
      title: 'Inserire un Turno',
      content: 'Clicca su una cella per inserire un turno. Puoi scegliere tra "Lavora" e inserire l\'orario oppure "A Casa" e selezionare una motivazione.',
      position: 'bottom'
    },
    {
      target: '.htCore tbody tr:first-child td:nth-child(3)', // Header di un dipendente
      title: 'Gestione Variazioni',
      content: 'Clicca sull\'intestazione di un dipendente per gestire le variazioni di orario per periodi specifici.',
      position: 'bottom'
    },
    {
      target: '#periodoDisplay', // Display del periodo
      title: 'Periodo Visualizzato',
      content: 'Qui puoi vedere il mese e l\'anno attualmente visualizzati nella tabella.',
      position: 'bottom'
    },
    {
      target: '.htCore tbody tr:nth-last-child(8)', // Riga Ore Lavorate
      title: 'Riepilogo Ore',
      content: 'Queste righe mostrano il riepilogo delle ore lavorate, ferie, ROL e altre informazioni rilevanti.',
      position: 'top'
    },
    {
      target: '.htCore tbody tr:nth-child(1) td:last-child', // Colonna particolarità
      title: 'Particolarità',
      content: 'In questa colonna puoi inserire le particolarità come turni notturni, straordinari, ecc.',
      position: 'left'
    }
  ];
  
  // Classe per gestire il tutorial
  class TutorialManager {
    constructor() {
      this.currentStep = 0;
      this.tutorialActive = false;
      this.overlay = null;
      this.popup = null;
      this.tutorialSeen = localStorage.getItem('tutorial_seen') === 'true';
      
      // Inizializza solo se il tutorial non è stato già visto
      if (!this.tutorialSeen) {
        this.init();
      }
      
      // Aggiunge il pulsante info per riaprire il tutorial in ogni caso
      this.addInfoButton();
    }
    
    init() {
      // Aggiungi una piccola pausa per assicurarti che la tabella sia completamente caricata
      setTimeout(() => {
        this.showTutorial();
      }, 1000);
    }
    
    // Aggiunge il pulsante info per riavviare il tutorial
    addInfoButton() {
      const infoButton = document.createElement('button');
      infoButton.id = 'tutorialInfoButton';
      infoButton.innerHTML = '<i class="fas fa-info-circle"></i>';
      infoButton.title = 'Mostra il tutorial';
      infoButton.addEventListener('click', () => this.showTutorial());
      
      // Stili inline per il pulsante
      infoButton.style.position = 'fixed';
      infoButton.style.bottom = '20px';
      infoButton.style.right = '20px';
      infoButton.style.width = '50px';
      infoButton.style.height = '50px';
      infoButton.style.borderRadius = '50%';
      infoButton.style.backgroundColor = '#3498db';
      infoButton.style.color = 'white';
      infoButton.style.border = 'none';
      infoButton.style.fontSize = '24px';
      infoButton.style.cursor = 'pointer';
      infoButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      infoButton.style.zIndex = '800';
      
      document.body.appendChild(infoButton);
    }
    
    // Mostra il tutorial
    showTutorial() {
      if (this.tutorialActive) return;
      
      this.tutorialActive = true;
      this.currentStep = 0;
      
      // Crea l'overlay per oscurare la pagina
      this.createOverlay();
      
      // Mostra il primo passo
      this.showStep(0);
    }
    
    // Crea l'overlay per oscurare la pagina
    createOverlay() {
      // Rimuovi eventuali overlay esistenti
      const existingOverlay = document.getElementById('tutorialOverlay');
      if (existingOverlay) existingOverlay.remove();
      
      // Crea un nuovo overlay
      this.overlay = document.createElement('div');
      this.overlay.id = 'tutorialOverlay';
      this.overlay.style.position = 'fixed';
      this.overlay.style.top = '0';
      this.overlay.style.left = '0';
      this.overlay.style.width = '100%';
      this.overlay.style.height = '100%';
      this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      this.overlay.style.zIndex = '900';
      this.overlay.style.backdropFilter = 'blur(2px)';
      
      document.body.appendChild(this.overlay);
    }
    
    // Mostra un passo specifico del tutorial
    showStep(stepIndex) {
      if (stepIndex >= tutorialSteps.length) {
        this.endTutorial();
        return;
      }
      
      this.currentStep = stepIndex;
      const step = tutorialSteps[stepIndex];
      
      // Trova l'elemento target
      let targetElement;
      if (step.target === 'body') {
        targetElement = document.body;
      } else {
        targetElement = document.querySelector(step.target);
      }
      
      if (!targetElement) {
        console.warn(`Target element "${step.target}" not found. Skipping to next step.`);
        this.showStep(stepIndex + 1);
        return;
      }
      
      // Evidenzia l'elemento target
      this.highlightElement(targetElement);
      
      // Crea il popup
      this.createPopup(step, targetElement);
    }
    
    // Evidenzia un elemento specifico
    highlightElement(element) {
      // Calcola la posizione dell'elemento
      const rect = element.getBoundingClientRect();
      
      // Rimuovi l'highlight esistente se presente
      const existingHighlight = document.getElementById('tutorialHighlight');
      if (existingHighlight) existingHighlight.remove();
      
      // Crea un nuovo highlight
      const highlight = document.createElement('div');
      highlight.id = 'tutorialHighlight';
      highlight.style.position = 'absolute';
      highlight.style.top = rect.top + 'px';
      highlight.style.left = rect.left + 'px';
      highlight.style.width = rect.width + 'px';
      highlight.style.height = rect.height + 'px';
      highlight.style.border = '2px solid #3498db';
      highlight.style.borderRadius = '4px';
      highlight.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.7)';
      highlight.style.zIndex = '950';
      highlight.style.pointerEvents = 'none';
      
      document.body.appendChild(highlight);
    }
    
    // Crea il popup per un passo
    createPopup(step, targetElement) {
      // Rimuovi il popup esistente se presente
      const existingPopup = document.getElementById('tutorialPopup');
      if (existingPopup) existingPopup.remove();
      
      // Crea un nuovo popup
      this.popup = document.createElement('div');
      this.popup.id = 'tutorialPopup';
      this.popup.style.position = 'absolute';
      this.popup.style.width = '300px';
      this.popup.style.backgroundColor = 'white';
      this.popup.style.borderRadius = '8px';
      this.popup.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
      this.popup.style.padding = '15px';
      this.popup.style.zIndex = '1000';
      
      // Contenuto del popup
      this.popup.innerHTML = `
        <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
          <h3 style="margin: 0; color: #3498db;">${step.title}</h3>
        </div>
        <p style="margin-bottom: 20px;">${step.content}</p>
        <div style="display: flex; justify-content: space-between;">
          <button id="tutorialSkipBtn" style="background: #f1f2f6; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
            Salta Tutorial
          </button>
          <div>
            <button id="tutorialPrevBtn" style="background: #f1f2f6; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;" ${this.currentStep === 0 ? 'disabled' : ''}>
              Indietro
            </button>
            <button id="tutorialNextBtn" style="background: #3498db; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
              ${this.currentStep === tutorialSteps.length - 1 ? 'Fine' : 'Avanti'}
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(this.popup);
      
      // Posiziona il popup vicino all'elemento
      this.positionPopup(this.popup, targetElement, step.position || 'bottom');
      
      // Aggiungi gli event listener
      document.getElementById('tutorialSkipBtn').addEventListener('click', () => this.endTutorial());
      document.getElementById('tutorialPrevBtn').addEventListener('click', () => this.showStep(this.currentStep - 1));
      document.getElementById('tutorialNextBtn').addEventListener('click', () => this.showStep(this.currentStep + 1));
    }
    
    // Posiziona il popup vicino all'elemento target
    positionPopup(popup, targetElement, position) {
      const popupRect = popup.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      
      let top, left;
      
      switch (position) {
        case 'top':
          top = targetRect.top - popupRect.height - 10;
          left = targetRect.left + (targetRect.width - popupRect.width) / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + 10;
          left = targetRect.left + (targetRect.width - popupRect.width) / 2;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - popupRect.height) / 2;
          left = targetRect.left - popupRect.width - 10;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - popupRect.height) / 2;
          left = targetRect.right + 10;
          break;
        case 'center':
          top = window.innerHeight / 2 - popupRect.height / 2;
          left = window.innerWidth / 2 - popupRect.width / 2;
          break;
        default:
          top = targetRect.bottom + 10;
          left = targetRect.left + (targetRect.width - popupRect.width) / 2;
      }
      
      // Assicurati che il popup rimanga all'interno della finestra
      if (left < 10) left = 10;
      if (left + popupRect.width > window.innerWidth - 10) left = window.innerWidth - popupRect.width - 10;
      if (top < 10) top = 10;
      if (top + popupRect.height > window.innerHeight - 10) top = window.innerHeight - popupRect.height - 10;
      
      popup.style.top = top + 'px';
      popup.style.left = left + 'px';
    }
    
    // Termina il tutorial
    endTutorial() {
      // Segna il tutorial come visto
      localStorage.setItem('tutorial_seen', 'true');
      this.tutorialSeen = true;
      
      // Rimuovi l'overlay e l'highlight
      const overlay = document.getElementById('tutorialOverlay');
      if (overlay) overlay.remove();
      
      const highlight = document.getElementById('tutorialHighlight');
      if (highlight) highlight.remove();
      
      // Rimuovi il popup
      const popup = document.getElementById('tutorialPopup');
      if (popup) popup.remove();
      
      this.tutorialActive = false;
    }
  }
  
  // Inizializza il tutorial quando il documento è pronto
  document.addEventListener('DOMContentLoaded', function() {
    // Assicurati che la tabella sia stata inizializzata
    if (typeof window.hot !== 'undefined') {
      window.tutorialManager = new TutorialManager();
    } else {
      // Se la tabella non è ancora pronta, aspetta che lo sia
      const checkInterval = setInterval(() => {
        if (typeof window.hot !== 'undefined') {
          window.tutorialManager = new TutorialManager();
          clearInterval(checkInterval);
        }
      }, 500);
      
      // Ferma il controllo dopo 10 secondi per evitare loop infiniti
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
  });
  
  // Aggiungi stili per il tutorial
  const tutorialStyles = document.createElement('style');
  tutorialStyles.textContent = `
    #tutorialInfoButton:hover {
      background-color: #2980b9 !important;
      transform: scale(1.05);
    }
    
    #tutorialOverlay {
      transition: opacity 0.3s ease;
    }
    
    #tutorialHighlight {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 2px #3498db; }
      50% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 5px #3498db; }
      100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 2px #3498db; }
    }
    
    #tutorialPopup {
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed !important;
    }
  `;
  document.head.appendChild(tutorialStyles);