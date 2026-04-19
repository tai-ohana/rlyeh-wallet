import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Lazy-initialize to avoid build-time errors when env vars aren't available
let _supabaseAdmin: SupabaseClient | null = null
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      // Keep payment_intent.succeeded as a fallback for one-time payments
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id

  if (!userId) {
    console.error('Missing supabase_user_id in checkout session metadata')
    return
  }

  if (session.mode === 'payment') {
    // Buy-once wallet purchase — permanent access, no expiry date
    const { error } = await getSupabaseAdmin()
      .from('profiles')
      .update({
        tier: 'pro',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: null,
        tier_started_at: new Date().toISOString(),
        tier_expires_at: null, // permanent — never expires
        is_pro: true,
        is_streamer: false,
        former_tier: null,
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update profile after wallet purchase:', error)
      throw error
    }

    console.log(`Wallet purchased for user ${userId}`)
  }
}

// Fallback: if checkout.session.completed metadata is missing,
// try payment_intent.succeeded which also carries metadata
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.supabase_user_id

  if (!userId) return

  // Check if already upgraded (idempotent)
  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single()

  if (profile?.tier === 'pro' || profile?.tier === 'streamer') return

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      tier: 'pro',
      stripe_customer_id: paymentIntent.customer as string | null,
      stripe_subscription_id: null,
      tier_started_at: new Date().toISOString(),
      tier_expires_at: null,
      is_pro: true,
      is_streamer: false,
      former_tier: null,
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update profile after payment_intent.succeeded:', error)
  }
}
