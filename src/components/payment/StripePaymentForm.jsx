// src/components/payment/StripePaymentForm.jsx
import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../../app/slices/uiSlice';
import axios from 'axios';
import './StripePaymentForm.css';

const StripePaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  
  const [numberOfShops, setNumberOfShops] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [setupIntentId, setSetupIntentId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [priceId, setPriceId] = useState('');
  const [totalPrice, setTotalPrice] = useState(10);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  
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
  
  // Crea la subscription quando l'utente clicca il bottone
  const createSubscription = async () => {
    try {
      console.log('🚀 Chiamata API a:', 'http://localhost:3001/api/create-subscription');
      console.log('📦 Dati inviati:', {
        email: user.email,
        userId: user.id,
        numberOfShops: numberOfShops
      });
      
      const response = await axios.post('http://localhost:3001/api/create-subscription', {
        email: user.email,
        userId: user.id,
        numberOfShops: numberOfShops
      });
      
      console.log('✅ Risposta ricevuta:', response.data);
      
      setClientSecret(response.data.clientSecret);
      setSetupIntentId(response.data.setupIntentId);
      setCustomerId(response.data.customerId);
      setPriceId(response.data.priceId);
      setPaymentReady(true);
    } catch (error) {
      console.error('Errore nella creazione della subscription:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Errore nella preparazione del pagamento. Riprova.',
        duration: 5000
      }));
    }
  };
  
  // Gestisce il submit del form
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    
    try {
      // Conferma il setup della carta per salvare il metodo di pagamento
      const result = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.origin + '/negozi/nuovo',
        }
      });
      
      if (result.error) {
        dispatch(addNotification({
          type: 'error',
          message: result.error.message,
          duration: 5000
        }));
      } else {
        // Setup riuscito, ora creiamo la subscription
        console.log('✅ Metodo di pagamento salvato, creazione subscription...');
        
        const confirmResponse = await axios.post('http://localhost:3001/api/confirm-subscription', {
          setupIntentId: setupIntentId,
          priceId: priceId,
          customerId: customerId,
          numberOfShops: numberOfShops
        });
        
        if (confirmResponse.data.status === 'trialing' || confirmResponse.data.status === 'active') {
          dispatch(addNotification({
            type: 'success',
            message: 'Abbonamento attivato con successo! Hai 7 giorni di prova gratuita.',
            duration: 5000
          }));
          
          // Salva il numero di negozi acquistati nel localStorage
          localStorage.setItem('pendingShops', numberOfShops);
          
          // Redirect al form di creazione del primo negozio
          navigate('/negozi/nuovo');
        }
      }
    } catch (error) {
      console.error('Errore durante il pagamento:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Errore durante il pagamento. Riprova.',
        duration: 5000
      }));
    }
    
    setProcessing(false);
  };
  
  // Opzioni per il Payment Element
  const paymentElementOptions = {
    layout: {
      type: 'tabs',
      defaultCollapsed: false,
      radios: false,
      spacedAccordionItems: false
    },
    paymentMethodOrder: ['card'],
    fields: {
      billingDetails: {
        email: 'never' // Email già fornita
      }
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
      
      {!paymentReady && (
        <>
          <div className="shop-selector">
            <label htmlFor="numberOfShops">Numero di negozi da acquistare:</label>
            <div className="shop-input-group">
              <button 
                className="btn-adjust" 
                onClick={() => setNumberOfShops(Math.max(1, numberOfShops - 1))}
                disabled={numberOfShops <= 1}
              >
                -
              </button>
              <input
                type="number"
                id="numberOfShops"
                value={numberOfShops}
                onChange={(e) => setNumberOfShops(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="100"
              />
              <button 
                className="btn-adjust" 
                onClick={() => setNumberOfShops(numberOfShops + 1)}
                disabled={numberOfShops >= 100}
              >
                +
              </button>
            </div>
            
            {numberOfShops > 20 && (
              <div className="discount-badge">
                <i className="fas fa-tag"></i> Sconto del 25% applicato!
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
              I primi 7 giorni sono gratuiti. Puoi cancellare in qualsiasi momento.
            </div>
          </div>
          
          <button 
            className="btn-create-subscription"
            onClick={createSubscription}
            disabled={!numberOfShops}
          >
            <i className="fas fa-credit-card"></i> Procedi al pagamento
          </button>
        </>
      )}
      
      {clientSecret && paymentReady && (
        <div className="payment-section">
          <button 
            className="btn-back"
            onClick={() => {
              setPaymentReady(false);
              setClientSecret('');
            }}
          >
            <i className="fas fa-arrow-left"></i> Modifica ordine
          </button>
          
          <div className="order-summary">
            <h3>Riepilogo ordine</h3>
            <div className="summary-item">
              <span>Abbonamento {numberOfShops} negozi</span>
              <span>{totalPrice.toFixed(2)}€/mese</span>
            </div>
            <div className="summary-note">
              <i className="fas fa-info-circle"></i>
              Addebito dopo 7 giorni di prova gratuita
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="payment-element-container">
              <PaymentElement 
                options={paymentElementOptions}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={!stripe || processing}
              className="btn-submit-payment"
            >
              {processing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Elaborazione...
                </>
              ) : (
                <>
                  <i className="fas fa-lock"></i> Attiva abbonamento
                </>
              )}
            </button>
          </form>
        </div>
      )}
      
      <div className="security-info">
        <i className="fas fa-shield-alt"></i>
        <p>
          I tuoi dati di pagamento sono protetti da Stripe. 
          Non memorizziamo mai i dati della tua carta.
        </p>
      </div>
    </div>
  );
};

export default StripePaymentForm;