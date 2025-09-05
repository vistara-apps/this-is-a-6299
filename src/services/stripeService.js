import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Limited trades per day (10)',
      'Basic AI feedback',
      'Access to beginner scenarios',
      'Basic tutorials'
    ],
    limits: {
      tradesPerDay: 10,
      feedbackPerDay: 5,
      scenarios: ['earnings_beat'],
      tutorials: 'basic'
    }
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 15,
    priceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Unlimited trades',
      'Advanced AI feedback',
      'All trading scenarios',
      'Complete tutorial library',
      'Advanced analytics'
    ],
    limits: {
      tradesPerDay: -1, // unlimited
      feedbackPerDay: -1,
      scenarios: 'all',
      tutorials: 'all'
    }
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 30,
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    features: [
      'Everything in Premium',
      'Personalized AI coaching',
      'Risk management tools',
      'Performance analytics dashboard',
      'Priority support',
      'Custom scenarios'
    ],
    limits: {
      tradesPerDay: -1,
      feedbackPerDay: -1,
      scenarios: 'all',
      tutorials: 'all',
      personalizedCoaching: true,
      riskManagement: true,
      customScenarios: true
    }
  }
};

export class StripeService {
  // Create checkout session for subscription
  static async createCheckoutSession(priceId, userId, successUrl, cancelUrl) {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
          successUrl,
          cancelUrl
        }),
      });

      const session = await response.json();
      
      if (!response.ok) {
        throw new Error(session.error || 'Failed to create checkout session');
      }

      return { session, error: null };
    } catch (error) {
      console.error('Stripe Checkout Error:', error);
      return { session: null, error: error.message };
    }
  }

  // Redirect to Stripe Checkout
  static async redirectToCheckout(sessionId) {
    try {
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
      
      return { error: null };
    } catch (error) {
      console.error('Stripe Redirect Error:', error);
      return { error: error.message };
    }
  }

  // Create subscription upgrade/downgrade
  static async updateSubscription(subscriptionId, newPriceId) {
    try {
      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          newPriceId
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update subscription');
      }

      return { subscription: result.subscription, error: null };
    } catch (error) {
      console.error('Stripe Update Subscription Error:', error);
      return { subscription: null, error: error.message };
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      return { subscription: result.subscription, error: null };
    } catch (error) {
      console.error('Stripe Cancel Subscription Error:', error);
      return { subscription: null, error: error.message };
    }
  }

  // Get customer portal URL
  static async createCustomerPortalSession(customerId, returnUrl) {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          returnUrl
        }),
      });

      const session = await response.json();
      
      if (!response.ok) {
        throw new Error(session.error || 'Failed to create portal session');
      }

      return { url: session.url, error: null };
    } catch (error) {
      console.error('Stripe Portal Error:', error);
      return { url: null, error: error.message };
    }
  }

  // Get subscription details
  static async getSubscription(subscriptionId) {
    try {
      const response = await fetch(`/api/subscription/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const subscription = await response.json();
      
      if (!response.ok) {
        throw new Error(subscription.error || 'Failed to get subscription');
      }

      return { subscription, error: null };
    } catch (error) {
      console.error('Stripe Get Subscription Error:', error);
      return { subscription: null, error: error.message };
    }
  }

  // Utility functions
  static getTierByPriceId(priceId) {
    return Object.values(SUBSCRIPTION_TIERS).find(tier => tier.priceId === priceId) || SUBSCRIPTION_TIERS.FREE;
  }

  static getTierById(tierId) {
    return SUBSCRIPTION_TIERS[tierId.toUpperCase()] || SUBSCRIPTION_TIERS.FREE;
  }

  static formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  static isStripeConfigured() {
    return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  }

  // Check if user can perform action based on subscription tier
  static canPerformAction(userTier, action, currentUsage = {}) {
    const tier = this.getTierById(userTier);
    
    switch (action) {
      case 'trade':
        if (tier.limits.tradesPerDay === -1) return true;
        return (currentUsage.tradesPerDay || 0) < tier.limits.tradesPerDay;
        
      case 'feedback':
        if (tier.limits.feedbackPerDay === -1) return true;
        return (currentUsage.feedbackPerDay || 0) < tier.limits.feedbackPerDay;
        
      case 'scenario':
        if (tier.limits.scenarios === 'all') return true;
        return tier.limits.scenarios.includes(currentUsage.scenarioId);
        
      case 'tutorial':
        return tier.limits.tutorials === 'all' || tier.limits.tutorials === 'basic';
        
      case 'personalizedCoaching':
        return tier.limits.personalizedCoaching === true;
        
      case 'riskManagement':
        return tier.limits.riskManagement === true;
        
      case 'customScenarios':
        return tier.limits.customScenarios === true;
        
      default:
        return false;
    }
  }

  // Get upgrade suggestions
  static getUpgradeSuggestion(currentTier, blockedAction) {
    const current = this.getTierById(currentTier);
    
    if (current.id === 'free') {
      return {
        suggestedTier: SUBSCRIPTION_TIERS.PREMIUM,
        reason: `Upgrade to Premium for unlimited ${blockedAction}s and advanced features`
      };
    }
    
    if (current.id === 'premium' && ['personalizedCoaching', 'riskManagement', 'customScenarios'].includes(blockedAction)) {
      return {
        suggestedTier: SUBSCRIPTION_TIERS.PRO,
        reason: `Upgrade to Pro for ${blockedAction} and premium coaching features`
      };
    }
    
    return null;
  }
}
