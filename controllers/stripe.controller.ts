import { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20' as any,
});

export const createCheckoutSession = async (req: Request, res: Response) => {
  const { userId, email } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: 'http://localhost:3001/dashboard?payment=success',
      cancel_url: 'http://localhost:3001/pricing?payment=cancelled',
    });
    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const customerId = session.customer as string;
    const licenseToken = crypto.randomBytes(16).toString('hex');

    // Usamos better-sqlite3
    db.prepare(`
      UPDATE User 
      SET stripeCustomerId = ?, subscriptionStatus = 'active', licenseToken = ?
      WHERE id = ?
    `).run(customerId, licenseToken, userId);

    console.log(`✅ Usuario ${userId} suscrito. Token: ${licenseToken}`);
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    db.prepare(`
      UPDATE User 
      SET subscriptionStatus = 'canceled', licenseToken = NULL 
      WHERE stripeCustomerId = ?
    `).run(customerId);
  }
  res.json({ received: true });
};