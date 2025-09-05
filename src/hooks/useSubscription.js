import { useState, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { StripeService } from '../services/stripeService';

export function useSubscription() {
  const { user } = useUserStore();
  const [usage, setUsage] = useState({
    tradesPerDay: 0,
    feedbackPerDay: 0,
    lastResetDate: new Date().toDateString()
  });

  // Reset daily usage counters
  useEffect(() => {
    const today = new Date().toDateString();
    if (usage.lastResetDate !== today) {
      setUsage({
        tradesPerDay: 0,
        feedbackPerDay: 0,
        lastResetDate: today
      });
    }
  }, [usage.lastResetDate]);

  // Get current subscription tier
  const getCurrentTier = () => {
    if (!user) return StripeService.getTierById('free');
    return StripeService.getTierById(user.subscription_tier || 'free');
  };

  // Check if user can perform an action
  const canPerformAction = (action, additionalData = {}) => {
    if (!user) return false;
    
    const currentUsage = {
      ...usage,
      ...additionalData
    };
    
    return StripeService.canPerformAction(user.subscription_tier || 'free', action, currentUsage);
  };

  // Increment usage counter
  const incrementUsage = (action) => {
    setUsage(prev => {
      const newUsage = { ...prev };
      
      switch (action) {
        case 'trade':
          newUsage.tradesPerDay = (prev.tradesPerDay || 0) + 1;
          break;
        case 'feedback':
          newUsage.feedbackPerDay = (prev.feedbackPerDay || 0) + 1;
          break;
      }
      
      // Store in localStorage for persistence
      localStorage.setItem('simutrade_usage', JSON.stringify(newUsage));
      return newUsage;
    });
  };

  // Load usage from localStorage on mount
  useEffect(() => {
    const storedUsage = localStorage.getItem('simutrade_usage');
    if (storedUsage) {
      try {
        const parsedUsage = JSON.parse(storedUsage);
        const today = new Date().toDateString();
        
        // Reset if it's a new day
        if (parsedUsage.lastResetDate !== today) {
          setUsage({
            tradesPerDay: 0,
            feedbackPerDay: 0,
            lastResetDate: today
          });
        } else {
          setUsage(parsedUsage);
        }
      } catch (error) {
        console.error('Error parsing usage data:', error);
      }
    }
  }, []);

  // Get upgrade suggestion when action is blocked
  const getUpgradeSuggestion = (blockedAction) => {
    if (!user) return null;
    return StripeService.getUpgradeSuggestion(user.subscription_tier || 'free', blockedAction);
  };

  // Get remaining usage for current tier
  const getRemainingUsage = () => {
    const tier = getCurrentTier();
    
    return {
      trades: tier.limits.tradesPerDay === -1 
        ? 'unlimited' 
        : Math.max(0, tier.limits.tradesPerDay - (usage.tradesPerDay || 0)),
      feedback: tier.limits.feedbackPerDay === -1 
        ? 'unlimited' 
        : Math.max(0, tier.limits.feedbackPerDay - (usage.feedbackPerDay || 0))
    };
  };

  // Check if user has premium features
  const hasPremiumFeatures = () => {
    const tier = getCurrentTier();
    return tier.id !== 'free';
  };

  // Check if user has pro features
  const hasProFeatures = () => {
    const tier = getCurrentTier();
    return tier.id === 'pro';
  };

  // Get feature availability
  const getFeatureAvailability = () => {
    const tier = getCurrentTier();
    
    return {
      unlimitedTrades: tier.limits.tradesPerDay === -1,
      unlimitedFeedback: tier.limits.feedbackPerDay === -1,
      allScenarios: tier.limits.scenarios === 'all',
      allTutorials: tier.limits.tutorials === 'all',
      personalizedCoaching: tier.limits.personalizedCoaching === true,
      riskManagement: tier.limits.riskManagement === true,
      customScenarios: tier.limits.customScenarios === true,
      advancedAnalytics: tier.id !== 'free'
    };
  };

  // Get usage percentage for progress bars
  const getUsagePercentage = (action) => {
    const tier = getCurrentTier();
    
    switch (action) {
      case 'trade':
        if (tier.limits.tradesPerDay === -1) return 0; // unlimited
        return Math.min(100, ((usage.tradesPerDay || 0) / tier.limits.tradesPerDay) * 100);
        
      case 'feedback':
        if (tier.limits.feedbackPerDay === -1) return 0; // unlimited
        return Math.min(100, ((usage.feedbackPerDay || 0) / tier.limits.feedbackPerDay) * 100);
        
      default:
        return 0;
    }
  };

  // Check if user is approaching limits
  const isApproachingLimit = (action, threshold = 0.8) => {
    const percentage = getUsagePercentage(action);
    return percentage >= (threshold * 100);
  };

  // Get tier comparison data
  const getTierComparison = () => {
    return Object.values(StripeService.SUBSCRIPTION_TIERS).map(tier => ({
      ...tier,
      isCurrent: tier.id === (user?.subscription_tier || 'free'),
      formattedPrice: tier.price === 0 ? 'Free' : `$${tier.price}/month`
    }));
  };

  return {
    // Current state
    currentTier: getCurrentTier(),
    usage,
    
    // Actions
    canPerformAction,
    incrementUsage,
    
    // Utilities
    getUpgradeSuggestion,
    getRemainingUsage,
    hasPremiumFeatures,
    hasProFeatures,
    getFeatureAvailability,
    getUsagePercentage,
    isApproachingLimit,
    getTierComparison,
    
    // Tier info
    isFreeTier: getCurrentTier().id === 'free',
    isPremiumTier: getCurrentTier().id === 'premium',
    isProTier: getCurrentTier().id === 'pro'
  };
}
