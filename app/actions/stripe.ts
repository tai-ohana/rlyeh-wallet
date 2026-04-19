'use server'

import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// Launch price: ¥980. Change to WALLET_REGULAR_PRICE_YEN = 1480 when promotion ends.
const WALLET_LAUNCH_PRICE_YEN = 980

export async function createCheckoutSession(_productId: string, _billingPeriod?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('認証が必要です')
  }

  // Check if already purchased
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, tier')
    .eq('id', user.id)
    .single()

  if (profile?.tier === 'pro' || profile?.tier === 'streamer') {
    throw new Error('すでにウォレットを購入済みです')
  }

  // Get or create Stripe customer
  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    })
    customerId = customer.id

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // One-time payment (buy-once wallet)
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: "R'lyeh Wallet",
            description: '買い切り — すべての機能をずっと利用できます',
          },
          unit_amount: WALLET_LAUNCH_PRICE_YEN,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    payment_intent_data: {
      metadata: {
        supabase_user_id: user.id,
        tier: 'pro',
      },
    },
    metadata: {
      supabase_user_id: user.id,
      tier: 'pro',
    },
  })

  return session.client_secret
}

export async function createCustomerPortalSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('認証が必要です')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    throw new Error('お支払い情報がありません')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
  })

  return session.url
}
