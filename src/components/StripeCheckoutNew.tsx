import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard } from 'lucide-react';
import { API_BASE } from '@/lib/api-config';
import type { ShippingInfo } from '@/types';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface StripeCheckoutProps {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variant: string;
  }>;
  shippingInfo: ShippingInfo;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function StripeCheckout({ items, shippingInfo, onSuccess, onError }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      onError?.('No items in cart');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent on backend
      const response = await fetch(`${API_BASE}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, shippingInfo }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Load Stripe
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Confirm payment. `redirect: 'if_required'` keeps the shopper on this
      // page for cards (no redirect needed) instead of always navigating to
      // return_url - which isn't even a route this site defines - and
      // silently skipping the onSuccess/onError callbacks below.
      const { error, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/success`,
          payment_method_data: {
            billing_details: {
              email: shippingInfo.email,
              phone: shippingInfo.phone,
            },
          },
          shipping: {
            name: shippingInfo.full_name,
            phone: shippingInfo.phone,
            address: {
              line1: shippingInfo.address_1,
              line2: shippingInfo.address_2 || undefined,
              city: shippingInfo.city,
              state: shippingInfo.state,
              postal_code: shippingInfo.postcode,
              country: shippingInfo.country,
            },
          },
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        onError?.(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment successful:', paymentIntent.id);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      onError?.(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full bg-primary text-primary-foreground px-4 py-2 font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          Processing...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <CreditCard className="w-4 h-4" />
          Pay with Card
        </span>
      )}
    </button>
  );
}
