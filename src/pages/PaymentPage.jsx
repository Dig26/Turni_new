// src/pages/PaymentPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import StripePaymentForm from '../components/payment/StripePaymentForm';

const PaymentPage = () => {
  const pageStyles = {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f7f9fc 0%, #ffffff 100%)',
    padding: '20px 20px 40px'
  };
  
  const headerStyles = {
    maxWidth: '600px',
    margin: '0 auto 30px'
  };
  
  const linkStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s'
  };
  
  return (
    <div className="payment-page" style={pageStyles}>
      <div className="payment-page-header" style={headerStyles}>
        <Link 
          to="/negozi" 
          className="back-link"
          style={linkStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <i className="fas fa-arrow-left"></i> Torna ai negozi
        </Link>
      </div>
      
      <StripePaymentForm />
    </div>
  );
};

export default PaymentPage;