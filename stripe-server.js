// stripe-server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Aggiungi questa riga per caricare le variabili d'ambiente

// Usa la variabile d'ambiente per la chiave Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Configurazione CORS per permettere richieste da React
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Endpoint per creare una subscription
app.post('/api/create-subscription', async (req, res) => {
  try {
    const { email, userId, numberOfShops } = req.body;
    
    console.log('📦 Creazione subscription per:', email, 'negozi:', numberOfShops);
    
    // Calcola il prezzo
    let unitPrice = 1000; // 10€ in centesimi
    let totalPrice = unitPrice * numberOfShops;
    
    // Applica sconto del 25% se più di 20 negozi
    if (numberOfShops > 20) {
      totalPrice = Math.round(totalPrice * 0.75);
    }
    
    // Crea o recupera il customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('👤 Cliente esistente trovato:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId.toString()
        }
      });
      console.log('👤 Nuovo cliente creato:', customer.id);
    }
    
    // Crea il prodotto per i negozi
    const product = await stripe.products.create({
      name: `Abbonamento ${numberOfShops} Negozi`,
      metadata: {
        numberOfShops: numberOfShops.toString()
      }
    });
    
    // Crea il prezzo ricorrente
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: totalPrice,
      currency: 'eur',
      recurring: {
        interval: 'month'
      }
    });
    
    // Per gestire la trial period, creiamo un SetupIntent per salvare il metodo di pagamento
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session', // Permette pagamenti futuri automatici
      metadata: {
        priceId: price.id,
        numberOfShops: numberOfShops.toString(),
        userId: userId.toString()
      }
    });
    
    console.log('✅ Setup Intent creato:', setupIntent.id);
    
    res.json({
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
      priceId: price.id,
      totalPrice: totalPrice,
      discount: numberOfShops > 20
    });
    
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint per confermare la subscription dopo il setup del metodo di pagamento
app.post('/api/confirm-subscription', async (req, res) => {
  try {
    const { setupIntentId, priceId, customerId, numberOfShops } = req.body;
    
    console.log('🔄 Conferma subscription con setupIntent:', setupIntentId);
    
    // Recupera il setup intent per ottenere il metodo di pagamento
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    if (setupIntent.status !== 'succeeded') {
      throw new Error('Il pagamento non è stato completato');
    }
    
    // Crea la subscription con il metodo di pagamento salvato
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: priceId,
      }],
      default_payment_method: setupIntent.payment_method,
      trial_period_days: 7,
      metadata: {
        numberOfShops: numberOfShops.toString()
      }
    });
    
    console.log('✅ Subscription creata con successo:', subscription.id);
    
    res.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      numberOfShops: numberOfShops
    });
    
  } catch (error) {
    console.error('❌ Error confirming subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server Stripe funzionante!' });
});

// Endpoint per recuperare i metodi di pagamento salvati
app.post('/api/list-payment-methods', async (req, res) => {
  try {
    const { customerId } = req.body;
    
    if (!customerId) {
      return res.json({ paymentMethods: [] });
    }
    
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    
    res.json({
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year
      }))
    });
    
  } catch (error) {
    console.error('❌ Error listing payment methods:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.STRIPE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Server Stripe avviato!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔧 Endpoints disponibili:`);
  console.log(`   - POST http://localhost:${PORT}/api/create-subscription`);
  console.log(`   - POST http://localhost:${PORT}/api/confirm-subscription`);
  console.log(`   - POST http://localhost:${PORT}/api/list-payment-methods`);
  console.log(`   - GET  http://localhost:${PORT}/api/health\n`);
});