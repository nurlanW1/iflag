'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Crown, Check } from 'lucide-react';

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/subscriptions');
      return;
    }

    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      const [plansData, subscriptionData] = await Promise.all([
        api.getPlans(),
        api.getMySubscription(),
      ]);
      setPlans(plansData || []);
      setSubscription(subscriptionData.subscription);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDuration = (days: number) => {
    if (days === 7) return 'Weekly';
    if (days === 30) return 'Monthly';
    return `${days} days`;
  };

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-3xl) var(--spacing-lg)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 'var(--spacing-3xl) var(--spacing-lg)' }}>
      <div className="container">
        <h1 style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
          Premium Subscriptions
        </h1>

        {subscription && (
          <div className="card" style={{ marginBottom: 'var(--spacing-xl)', maxWidth: '600px', margin: '0 auto var(--spacing-xl)' }}>
            <div className="card-body">
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Current Subscription</h2>
              <p>
                <strong>Status:</strong> <span className="badge badge-success">{subscription.status}</span>
              </p>
              <p>
                <strong>Period:</strong> {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
              {subscription.cancel_at_period_end && (
                <p style={{ color: 'var(--color-warning)' }}>
                  Subscription will cancel at the end of the current period.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-xl)', maxWidth: '800px', margin: '0 auto' }}>
          {plans.map((plan) => (
            <div key={plan.id} className="card" style={{ position: 'relative' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                  <Crown size={24} style={{ color: 'var(--color-warning)' }} />
                  <h2>{plan.name}</h2>
                </div>

                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {formatPrice(plan.price_cents)}
                  </div>
                  <div style={{ color: 'var(--color-gray-600)' }}>
                    per {formatDuration(plan.duration_days).toLowerCase()}
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 'var(--spacing-lg)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <Check size={18} style={{ color: 'var(--color-success)' }} />
                    Unlimited premium downloads
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <Check size={18} style={{ color: 'var(--color-success)' }} />
                    No watermarks
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <Check size={18} style={{ color: 'var(--color-success)' }} />
                    High-resolution assets
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <Check size={18} style={{ color: 'var(--color-success)' }} />
                    Commercial license
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Check size={18} style={{ color: 'var(--color-success)' }} />
                    Cancel anytime
                  </li>
                </ul>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    // TODO: Integrate with Stripe checkout
                    alert('Stripe integration coming soon!');
                  }}
                >
                  Subscribe Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)', color: 'var(--color-gray-600)' }}>
          <p>All subscriptions include full commercial licensing for all premium assets.</p>
        </div>
      </div>
    </main>
  );
}
