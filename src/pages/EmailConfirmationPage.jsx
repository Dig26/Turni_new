// src/pages/EmailConfirmationPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const EmailConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fromRegistration, setFromRegistration] = useState(false);

  useEffect(() => {
    // Recupera l'email e il flag dal state della navigazione
    if (location.state) {
      setEmail(location.state.email || '');
      setFromRegistration(location.state.fromRegistration || false);
    }
  }, [location.state]);

  const handleResendEmail = () => {
    // Placeholder per la funzione di invio email
    // In futuro potresti aggiungere una chiamata API qui
    console.log('📧 Richiesta reinvio email per:', email);
    alert('Funzione di reinvio email non ancora implementata');
  };

  return (
    <div className="email-confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-card">
          {/* Icona di successo */}
          <div className="success-icon">
            <i className="fas fa-envelope-circle-check"></i>
          </div>

          {/* Titolo principale */}
          <div className="confirmation-header">
            <h1>
              {fromRegistration ? 'Registrazione completata!' : 'Conferma la tua email'}
            </h1>
            <p className="subtitle">
              {fromRegistration 
                ? 'Il tuo account è stato creato con successo.' 
                : 'È necessario confermare il tuo indirizzo email per continuare.'
              }
            </p>
          </div>

          {/* Contenuto principale */}
          <div className="confirmation-content">
            <div className="email-info">
              <h3>Controlla la tua casella di posta</h3>
              <p>
                Ti abbiamo inviato un'email di conferma all'indirizzo:
              </p>
              <div className="email-display">
                <i className="fas fa-envelope"></i>
                <span>{email || 'il tuo indirizzo email'}</span>
              </div>
            </div>

            <div className="instructions">
              <h3>Cosa fare ora:</h3>
              <ol>
                <li>
                  <i className="fas fa-search"></i>
                  <div>
                    <strong>Controlla la tua casella di posta</strong>
                    <p>Cerca un'email da parte nostra con il link di conferma</p>
                  </div>
                </li>
                <li>
                  <i className="fas fa-folder"></i>
                  <div>
                    <strong>Controlla anche lo spam</strong>
                    <p>A volte le email di conferma finiscono nella cartella spam</p>
                  </div>
                </li>
                <li>
                  <i className="fas fa-mouse-pointer"></i>
                  <div>
                    <strong>Clicca sul link di conferma</strong>
                    <p>Una volta trovata l'email, clicca sul link per confermare il tuo account</p>
                  </div>
                </li>
                <li>
                  <i className="fas fa-sign-in-alt"></i>
                  <div>
                    <strong>Accedi al tuo account</strong>
                    <p>Dopo la conferma, potrai accedere e utilizzare tutti i servizi</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Sezione aiuto */}
            <div className="help-section">
              <h3>Non hai ricevuto l'email?</h3>
              <div className="help-actions">
                <button 
                  onClick={handleResendEmail}
                  className="resend-button"
                  disabled={!email}
                >
                  <i className="fas fa-paper-plane"></i>
                  Invia di nuovo
                </button>
                
                <div className="help-text">
                  <p>
                    Se continui ad avere problemi, contatta il nostro supporto.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer con link */}
          <div className="confirmation-footer">
            <Link to="/login" className="back-link">
              <i className="fas fa-arrow-left"></i>
              Torna al login
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .email-confirmation-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--background-color, #f5f7fa);
          padding: 20px;
        }

        .confirmation-container {
          width: 100%;
          max-width: 600px;
        }

        .confirmation-card {
          background: var(--card-bg, white);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 40px;
          text-align: center;
        }

        .success-icon {
          margin-bottom: 24px;
        }

        .success-icon i {
          font-size: 4rem;
          color: #27ae60;
        }

        .confirmation-header {
          margin-bottom: 32px;
        }

        .confirmation-header h1 {
          color: var(--text-color, #2c3e50);
          margin: 0 0 12px 0;
          font-size: 2rem;
          font-weight: 600;
        }

        .subtitle {
          color: var(--text-light, #7f8c8d);
          margin: 0;
          font-size: 1.1rem;
          line-height: 1.5;
        }

        .confirmation-content {
          text-align: left;
          margin-bottom: 32px;
        }

        .email-info {
          margin-bottom: 32px;
          text-align: center;
        }

        .email-info h3 {
          color: var(--text-color, #2c3e50);
          margin: 0 0 12px 0;
          font-size: 1.3rem;
        }

        .email-info p {
          color: var(--text-light, #7f8c8d);
          margin: 0 0 16px 0;
        }

        .email-display {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-weight: 500;
          color: var(--primary-color, #007bff);
        }

        .email-display i {
          font-size: 1.1rem;
        }

        .instructions h3 {
          color: var(--text-color, #2c3e50);
          margin: 0 0 20px 0;
          font-size: 1.3rem;
        }

        .instructions ol {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .instructions li {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid var(--primary-color, #007bff);
        }

        .instructions li i {
          color: var(--primary-color, #007bff);
          font-size: 1.2rem;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .instructions li div {
          flex: 1;
        }

        .instructions li strong {
          color: var(--text-color, #2c3e50);
          display: block;
          margin-bottom: 4px;
          font-size: 1rem;
        }

        .instructions li p {
          color: var(--text-light, #7f8c8d);
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .help-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #dee2e6;
          text-align: center;
        }

        .help-section h3 {
          color: var(--text-color, #2c3e50);
          margin: 0 0 20px 0;
          font-size: 1.2rem;
        }

        .help-actions {
          margin-bottom: 20px;
        }

        .resend-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: var(--primary-color, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .resend-button:hover:not(:disabled) {
          background-color: var(--primary-dark, #0056b3);
        }

        .resend-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .help-text p {
          color: var(--text-light, #7f8c8d);
          margin: 16px 0 0 0;
          font-size: 0.9rem;
        }

        .confirmation-footer {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid #dee2e6;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-light, #7f8c8d);
          text-decoration: none;
          font-size: 1rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--primary-color, #007bff);
        }

        .back-link i {
          font-size: 0.9rem;
        }

        @media (max-width: 600px) {
          .confirmation-card {
            padding: 24px;
          }
          
          .confirmation-header h1 {
            font-size: 1.5rem;
          }
          
          .success-icon i {
            font-size: 3rem;
          }
          
          .instructions li {
            flex-direction: column;
            text-align: center;
          }
          
          .instructions li i {
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default EmailConfirmationPage;