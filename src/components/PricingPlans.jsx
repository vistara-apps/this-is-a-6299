import React, { useState } from 'react';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { StripeService } from '../services/stripeService';

export function PricingPlans({ onSelectPlan, showCurrentPlan = true }) {
  const { currentTier, getTierComparison } = useSubscription();
  const [isLoading, setIsLoading] = useState(null);

  const tiers = getTierComparison();

  const handleSelectPlan = async (tier) => {
    if (tier.isCurrent) return;
    
    setIsLoading(tier.id);
    try {
      await onSelectPlan(tier);
    } finally {
      setIsLoading(null);
    }
  };

  const getTierIcon = (tierId) => {
    switch (tierId) {
      case 'free':
        return <Star className="w-6 h-6" />;
      case 'premium':
        return <Zap className="w-6 h-6" />;
      case 'pro':
        return <Crown className="w-6 h-6" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  const getTierColor = (tierId) => {
    switch (tierId) {
      case 'free':
        return 'border-gray-200 bg-white';
      case 'premium':
        return 'border-blue-200 bg-blue-50';
      case 'pro':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getButtonStyle = (tier) => {
    if (tier.isCurrent && showCurrentPlan) {
      return 'bg-gray-100 text-gray-500 cursor-not-allowed';
    }
    
    switch (tier.id) {
      case 'free':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'premium':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'pro':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={`relative rounded-lg border-2 p-6 ${getTierColor(tier.id)} ${
            tier.isCurrent && showCurrentPlan ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          {tier.isCurrent && showCurrentPlan && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Current Plan
              </span>
            </div>
          )}

          {tier.id === 'premium' && (
            <div className="absolute -top-3 right-4">
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Popular
              </span>
            </div>
          )}

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-full ${
                tier.id === 'free' ? 'bg-gray-100' :
                tier.id === 'premium' ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
                {getTierIcon(tier.id)}
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
            
            <div className="mb-4">
              <span className="text-3xl font-bold">
                {tier.formattedPrice}
              </span>
              {tier.price > 0 && (
                <span className="text-gray-500 ml-1">/month</span>
              )}
            </div>

            <button
              onClick={() => handleSelectPlan(tier)}
              disabled={tier.isCurrent && showCurrentPlan || isLoading === tier.id}
              className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${getButtonStyle(tier)}`}
            >
              {isLoading === tier.id ? (
                'Processing...'
              ) : tier.isCurrent && showCurrentPlan ? (
                'Current Plan'
              ) : tier.id === 'free' ? (
                'Get Started'
              ) : (
                'Upgrade Now'
              )}
            </button>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-3">Features included:</h4>
            <ul className="space-y-2">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {tier.id === 'pro' && (
            <div className="mt-4 p-3 bg-purple-100 rounded-md">
              <p className="text-sm text-purple-800 font-medium">
                🎯 Perfect for serious traders who want personalized coaching and advanced analytics
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PricingComparison() {
  const features = [
    { name: 'Daily Trades', free: '10', premium: 'Unlimited', pro: 'Unlimited' },
    { name: 'AI Feedback', free: '5/day', premium: 'Unlimited', pro: 'Unlimited' },
    { name: 'Trading Scenarios', free: 'Basic', premium: 'All', pro: 'All + Custom' },
    { name: 'Tutorials', free: 'Basic', premium: 'Complete Library', pro: 'Complete Library' },
    { name: 'Analytics', free: '❌', premium: 'Advanced', pro: 'Advanced + Risk Tools' },
    { name: 'Personalized Coaching', free: '❌', premium: '❌', pro: '✅' },
    { name: 'Priority Support', free: '❌', premium: '❌', pro: '✅' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Features</th>
            <th className="text-center p-4">Free</th>
            <th className="text-center p-4">Premium</th>
            <th className="text-center p-4">Pro</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="p-4 font-medium">{feature.name}</td>
              <td className="p-4 text-center">{feature.free}</td>
              <td className="p-4 text-center">{feature.premium}</td>
              <td className="p-4 text-center">{feature.pro}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
