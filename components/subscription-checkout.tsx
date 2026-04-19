'use client'

import React from "react"

import { useCallback, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { createCheckoutSession } from '@/app/actions/stripe'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface SubscriptionCheckoutProps {
  productId: string
  billingPeriod?: 'monthly' | 'yearly'
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function SubscriptionCheckout({ 
  productId, 
  billingPeriod = 'monthly',
  trigger,
  onSuccess
}: SubscriptionCheckoutProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchClientSecret = useCallback(async () => {
    setIsLoading(true)
    try {
      const clientSecret = await createCheckoutSession(productId, billingPeriod)
      return clientSecret
    } finally {
      setIsLoading(false)
    }
  }, [productId, billingPeriod])

  const handleComplete = useCallback(() => {
    setIsOpen(false)
    onSuccess?.()
    // Refresh the page to update the UI
    window.location.reload()
  }, [onSuccess])

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setIsOpen(true)} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              読み込み中...
            </>
          ) : (
            'アップグレード'
          )}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>サブスクリプション登録</DialogTitle>
          </DialogHeader>
          
          {isOpen && (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ 
                fetchClientSecret,
                onComplete: handleComplete,
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
