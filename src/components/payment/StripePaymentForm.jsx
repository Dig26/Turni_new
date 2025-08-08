// src/components/payment/StripePaymentForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../../app/slices/uiSlice';
import axios from 'axios';
import './StripePaymentForm.css';

const StripePaymentForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  
  const [numberOfShops, setNumberOfShops] = useState(1);
  const [totalPrice, setTotalPrice] = useState(10);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Calcola il prezzo totale
  useEffect(() => {
    let price = numberOfShops * 10;
    if (numberOfShops > 20) {
      price = price * 0.75; // Sconto del 25%
      setHasDiscount(true);
    } else {
      setHasDiscount(false);
    }
    setTotalPrice(price);
  }, [numberOfShops]);
  
  // Gestisce il checkout con Stripe
  const handleCheckout = async () => {
    if (!user?.email || !user?.id) {
      dispatch(addNotification({
        type: 'error',
        message: 'Errore: utente non identificato. Effettua il login e riprova.',
        duration: 5000
      }));
      return;
    }

    try {
      setProcessing(true);
      
      console.log('🚀 Creazione sessione di checkout...');
      
      const checkoutData = {
        email: user.email,
        userId: user.id,
        numberOfShops: numberOfShops,
        successUrl: `${window.location.origin}/negozi/nuovo?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment`
      };
      
      const response = await axios.post('http://localhost:3001/api/create-checkout-session', checkoutData);
      
      console.log('✅ Sessione creata, reindirizzamento a Stripe...');
      
      // Reindirizza a Stripe Checkout
      window.location.href = response.data.url;
      
    } catch (error) {
      console.error('Errore nella creazione della sessione di checkout:', error);
      
      let errorMessage = 'Errore nella preparazione del pagamento. Riprova.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000
      }));
      setProcessing(false);
    }
  };

  // Gestisce i cambiamenti del numero di negozi
  const handleShopsChange = (newValue) => {
    const value = Math.max(1, Math.min(100, parseInt(newValue) || 1));
    setNumberOfShops(value);
  };

  const incrementShops = () => {
    if (numberOfShops < 100) {
      setNumberOfShops(numberOfShops + 1);
    }
  };

  const decrementShops = () => {
    if (numberOfShops > 1) {
      setNumberOfShops(numberOfShops - 1);
    }
  };
  
  return (
    <div className="stripe-payment-container">
      <div className="payment-header">
        <h2>Abbonamento Negozi</h2>
        <p className="payment-subtitle">
          Ogni negozio costa <strong>10€ al mese</strong> con <strong>7 giorni di prova gratuita</strong>
        </p>
      </div>
      
      <div className="shop-selector">
        <label htmlFor="numberOfShops">Numero di negozi da acquistare:</label>
        <div className="shop-input-group">
          <button 
            className="btn-adjust" 
            onClick={decrementShops}
            disabled={numberOfShops <= 1}
            type="button"
            aria-label="Diminuisci numero negozi"
          >
            -
          </button>
          <input
            type="number"
            id="numberOfShops"
            value={numberOfShops}
            onChange={(e) => handleShopsChange(e.target.value)}
            min="1"
            max="100"
            aria-label="Numero di negozi"
          />
          <button 
            className="btn-adjust" 
            onClick={incrementShops}
            disabled={numberOfShops >= 100}
            type="button"
            aria-label="Aumenta numero negozi"
          >
            +
          </button>
        </div>
        
        {hasDiscount && (
          <div className="discount-badge">
            <i className="fas fa-tag"></i> 
            Sconto del 25% applicato per ordini superiori a 20 negozi!
          </div>
        )}
      </div>
      
      <div className="price-summary">
        <div className="price-row">
          <span>Prezzo unitario:</span>
          <span>10€/mese</span>
        </div>
        <div className="price-row">
          <span>Numero negozi:</span>
          <span>{numberOfShops}</span>
        </div>
        {hasDiscount && (
          <>
            <div className="price-row">
              <span>Subtotale:</span>
              <span className="price-strikethrough">{(numberOfShops * 10).toFixed(2)}€</span>
            </div>
            <div className="price-row discount">
              <span>Sconto (25%):</span>
              <span>-{(numberOfShops * 10 * 0.25).toFixed(2)}€</span>
            </div>
          </>
        )}
        <div className="price-row total">
          <span>Totale mensile:</span>
          <span className="price-total">{totalPrice.toFixed(2)}€/mese</span>
        </div>
        <div className="trial-info">
          <i className="fas fa-info-circle"></i>
          <div>
            <strong>Prova gratuita di 7 giorni</strong><br />
            Non verrai addebitato fino alla fine del periodo di prova. Puoi cancellare in qualsiasi momento.
          </div>
        </div>
      </div>
      
      <button 
        className="btn-create-subscription"
        onClick={handleCheckout}
        disabled={!numberOfShops || processing || !user}
      >
        {processing ? (
          <>
            <i className="fas fa-spinner fa-spin"></i> Reindirizzamento...
          </>
        ) : (
          <>
            <i className="fas fa-credit-card"></i> 
            Inizia la prova gratuita di 7 giorni
          </>
        )}
      </button>
      
      <div className="security-info">
        <i className="fas fa-shield-alt"></i>
        <div>
          <p>
            <strong>Pagamento sicuro con Stripe</strong><br />
            Verrai reindirizzato a Stripe per completare il pagamento in sicurezza. 
            Non memorizziamo mai i dati della tua carta di credito.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StripePaymentForm;