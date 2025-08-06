// stripe-server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Configurazione CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Endpoint per creare una sessione di checkout
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { email, userId, numberOfShops, successUrl, cancelUrl } = req.body;
    
    console.log('📦 Creazione sessione checkout per:', email, 'negozi:', numberOfShops);
    
    // Calcola il prezzo
    let unitPrice = 1000; // 10€ in centesimi
    let totalPrice = unitPrice * numberOfShops;
    let discountPercent = 0;
    
    // Applica sconto del 25% se più di 20 negozi
    if (numberOfShops > 20) {
      totalPrice = Math.round(totalPrice * 0.75);
      discountPercent = 25;
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
    
    // Crea il prodotto e il prezzo
    const product = await stripe.products.create({
      name: `Abbonamento ${numberOfShops} Negozi`,
      description: `Piano mensile per ${numberOfShops} negozi${discountPercent > 0 ? ` (sconto del ${discountPercent}% applicato)` : ''}`,
      metadata: {
        numberOfShops: numberOfShops.toString()
      }
    });
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: totalPrice,
      currency: 'eur',
      recurring: {
        interval: 'month'
      }
    });
    
    // Crea la sessione di checkout
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: price.id,
        quantity: 1
      }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          numberOfShops: numberOfShops.toString(),
          userId: userId.toString()
        }
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: 'it',
      metadata: {
        numberOfShops: numberOfShops.toString(),
        userId: userId.toString()
      },
      // Opzioni aggiuntive per migliorare l'esperienza
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });
    
    console.log('✅ Sessione di checkout creata:', session.id);
    
    res.json({
      sessionId: session.id,
      url: session.url
    });
    
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint per verificare lo stato di una sessione (opzionale, utile per confermare il pagamento)
app.post('/api/verify-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      status: session.payment_status,
      subscriptionId: session.subscription,
      customerId: session.customer,
      numberOfShops: session.metadata.numberOfShops
    });
    
  } catch (error) {
    console.error('❌ Error verifying session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook per gestire gli eventi di Stripe (opzionale ma consigliato)
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`❌ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Gestisci gli eventi
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('✅ Checkout completato:', session.id);
      // Qui puoi aggiornare il tuo database, inviare email di conferma, etc.
      break;
      
    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('✅ Nuova subscription creata:', subscription.id);
      break;
      
    case 'customer.subscription.deleted':
      const cancelledSubscription = event.data.object;
      console.log('⚠️ Subscription cancellata:', cancelledSubscription.id);
      break;
      
    default:
      console.log(`Evento non gestito: ${event.type}`);
  }
  
  res.json({received: true});
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server Stripe funzionante con Checkout!' });
});

const PORT = process.env.STRIPE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Server Stripe avviato!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔧 Endpoints disponibili:`);
  console.log(`   - POST http://localhost:${PORT}/api/create-checkout-session`);
  console.log(`   - POST http://localhost:${PORT}/api/verify-session`);
  console.log(`   - POST http://localhost:${PORT}/api/stripe-webhook`);
  console.log(`   - GET  http://localhost:${PORT}/api/health\n`);
});