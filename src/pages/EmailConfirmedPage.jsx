// src/pages/EmailConfirmedPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const EmailConfirmedPage = () => {
  return (
    <div className="email-confirmed-page">
      <div className="confirmed-container">
        <div className="confirmed-card">
          {/* Icona di successo */}
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>

          {/* Titolo principale */}
          <div className="confirmed-header">
            <h1>Email confermata!</h1>
            <p className="subtitle">
              Il tuo indirizzo email è stato verificato con successo
            </p>
          </div>

          {/* Contenuto principale */}
          <div className="confirmed-content">
            <div className="success-message">
              <div className="message-box">
                <i className="fas fa-shield-alt"></i>
                <div className="message-text">
                  <h3>Verifica completata</h3>
                  <p>
                    Il tuo account è ora attivo e pronto per essere utilizzato. 
                    Puoi accedere con le tue credenziali e iniziare a utilizzare tutti i servizi disponibili.
                  </p>
                </div>
              </div>
            </div>

            <div className="next-steps">
              <h3>Cosa puoi fare ora:</h3>
              <div className="steps-grid">
                <div className="step-item">
                  <i className="fas fa-sign-in-alt"></i>
                  <h4>Accedi al tuo account</h4>
                  <p>Utilizza le tue credenziali per accedere</p>
                </div>
                <div className="step-item">
                  <i className="fas fa-user-cog"></i>
                  <h4>Completa il profilo</h4>
                  <p>Personalizza il tuo account</p>
                </div>
                <div className="step-item">
                  <i className="fas fa-rocket"></i>
                  <h4>Inizia ad esplorare</h4>
                  <p>Scopri tutte le funzionalità</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="confirmed-actions">
            <Link to="/login" className="login-button">
              <i className="fas fa-sign-in-alt"></i>
              Accedi ora
            </Link>
            
            <Link to="/" className="home-link">
              <i className="fas fa-home"></i>
              Torna alla home
            </Link>
          </div>

          {/* Footer informativo */}
          <div className="confirmed-footer">
            <div className="security-note">
              <i className="fas fa-info-circle"></i>
              <span>
                Per la tua sicurezza, chiudi questa pagina dopo aver effettuato l'accesso
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .email-confirmed-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .confirmed-container {
          width: 100%;
          max-width: 600px;
        }

        .confirmed-card {
          background: var(--card-bg, white);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          padding: 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .confirmed-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #27ae60, #2ecc71);
        }

        .success-icon {
          margin-bottom: 32px;
        }

        .success-icon i {
          font-size: 5rem;
          color: #27ae60;
          animation: successPulse 2s ease-in-out infinite;
        }

        @keyframes successPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .confirmed-header {
          margin-bottom: 40px;
        }

        .confirmed-header h1 {
          color: var(--text-color, #2c3e50);
          margin: 0 0 16px 0;
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: var(--text-light, #7f8c8d);
          margin: 0;
          font-size: 1.2rem;
          line-height: 1.5;
        }

        .confirmed-content {
          margin-bottom: 40px;
        }

        .success-message {
          margin-bottom: 40px;
        }

        .message-box {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 24px;
          background: #f8fff9;
          border: 1px solid #d4edda;
          border-radius: 12px;
          text-align: left;
        }

        .message-box i {
          color: #27ae60;
          font-size: 2rem;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .message-text h3 {
          color: var(--text-color, #2c3e50);
          margin: 0 0 12px 0;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .message-text p {
          color: var(--text-light, #7f8c8d);
          margin: 0;
          line-height: 1.6;
        }

        .next-steps h3 {
          color: var(--text-color, #2c3e50);
          margin: 0 0 24px 0;
          font-size: 1.4rem;
          font-weight: 600;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .step-item {
          padding: 20px 16px;
          background: #f8f9fa;
          border-radius: 10px;
          border: 1px solid #e9ecef;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .step-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .step-item i {
          color: var(--primary-color, #007bff);
          font-size: 2rem;
          margin-bottom: 12px;
        }

        .step-item h4 {
          color: var(--text-color, #2c3e50);
          margin: 0 0 8px 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .step-item p {
          color: var(--text-light, #7f8c8d);
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .confirmed-actions {
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }

        .login-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
        }

        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
        }

        .login-button i {
          font-size: 1.2rem;
        }

        .home-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-light, #7f8c8d);
          text-decoration: none;
          font-size: 1rem;
          transition: color 0.2s;
        }

        .home-link:hover {
          color: var(--primary-color, #007bff);
        }

        .confirmed-footer {
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--text-light, #7f8c8d);
          font-size: 0.9rem;
        }

        .security-note i {
          color: #ffc107;
        }

        @media (max-width: 600px) {
          .confirmed-card {
            padding: 32px 24px;
          }
          
          .confirmed-header h1 {
            font-size: 2rem;
          }
          
          .success-icon i {
            font-size: 4rem;
          }
          
          .steps-grid {
            grid-template-columns: 1fr;
          }
          
          .message-box {
            flex-direction: column;
            text-align: center;
          }
          
          .message-box i {
            margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default EmailConfirmedPage;