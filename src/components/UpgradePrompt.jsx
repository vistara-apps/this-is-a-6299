import React, { useState } from 'react';
import { X, ArrowUp, Zap, Crown } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { StripeService } from '../services/stripeService';

export function UpgradePrompt({ 
  isOpen, 
  onClose, 
  blockedAction, 
  onUpgrade,
  title,
  description 
}) {
  const { getUpgradeSuggestion, currentTier } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const suggestion = getUpgradeSuggestion(blockedAction);
  
  if (!suggestion) {
    return null;
  }

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await onUpgrade(suggestion.suggestedTier);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierIcon = (tierId) => {
    switch (tierId) {
      case 'premium':
        return <Zap className="w-8 h-8 text-blue-500" />;
      case 'pro':
        return <Crown className="w-8 h-8 text-purple-500" />;
      default:
        return <ArrowUp className="w-8 h-8 text-gray-500" />;
    }
  };

  const getTierColor = (tierId) => {
    switch (tierId) {
      case 'premium':
        return 'from-blue-500 to-blue-600';
      case 'pro':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            {getTierIcon(suggestion.suggestedTier.id)}
          </div>
          
          <h3 className="text-xl font-semibold mb-2">
            {title || 'Upgrade Required'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {description || suggestion.reason}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold">{suggestion.suggestedTier.name}</h4>
              <p className="text-sm text-gray-600">
                {suggestion.suggestedTier.price === 0 
                  ? 'Free' 
                  : `$${suggestion.suggestedTier.price}/month`
                }
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500">Current: {currentTier.name}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-medium text-sm">What you'll get:</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              {suggestion.suggestedTier.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
          
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-md text-white font-medium transition-colors bg-gradient-to-r ${getTierColor(suggestion.suggestedTier.id)} hover:opacity-90 disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : `Upgrade to ${suggestion.suggestedTier.name}`}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Cancel anytime. No long-term commitments.
        </p>
      </div>
    </div>
  );
}

export function UsageLimitBanner({ action, onUpgrade }) {
  const { 
    getUsagePercentage, 
    isApproachingLimit, 
    getRemainingUsage,
    currentTier 
  } = useSubscription();

  const percentage = getUsagePercentage(action);
  const isNearLimit = isApproachingLimit(action, 0.8);
  const remaining = getRemainingUsage();

  if (currentTier.id !== 'free' || !isNearLimit) {
    return null;
  }

  const actionText = action === 'trade' ? 'trades' : 'feedback requests';
  const remainingCount = remaining[action === 'trade' ? 'trades' : 'feedback'];

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <ArrowUp className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <h4 className="font-medium text-yellow-800">
              {remainingCount === 0 
                ? `Daily ${actionText} limit reached` 
                : `${remainingCount} ${actionText} remaining today`
              }
            </h4>
            <p className="text-sm text-yellow-700">
              Upgrade to Premium for unlimited {actionText}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => onUpgrade(StripeService.SUBSCRIPTION_TIERS.PREMIUM)}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Upgrade
        </button>
      </div>
      
      {remainingCount > 0 && (
        <div className="mt-3">
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div 
              className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FeatureLockedCard({ feature, requiredTier, onUpgrade }) {
  const { currentTier } = useSubscription();
  
  const getTierIcon = (tierId) => {
    switch (tierId) {
      case 'premium':
        return <Zap className="w-5 h-5" />;
      case 'pro':
        return <Crown className="w-5 h-5" />;
      default:
        return <ArrowUp className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <div className="flex justify-center mb-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          {getTierIcon(requiredTier)}
        </div>
      </div>
      
      <h3 className="font-semibold mb-2">{feature} (Premium Feature)</h3>
      <p className="text-gray-600 text-sm mb-4">
        This feature is available with {requiredTier === 'premium' ? 'Premium' : 'Pro'} subscription
      </p>
      
      <button
        onClick={() => onUpgrade(StripeService.getTierById(requiredTier))}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Upgrade to {requiredTier === 'premium' ? 'Premium' : 'Pro'}
      </button>
    </div>
  );
}
