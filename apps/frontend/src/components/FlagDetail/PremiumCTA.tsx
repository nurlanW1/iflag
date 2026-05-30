'use client';

import { Crown, X, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PRICING_MARKETING } from '@/lib/marketing/pricing-config';

interface PremiumCTAProps {
  premiumFormatsCount: number;
  onDismiss?: () => void;
  variant?: 'banner' | 'modal' | 'inline';
}

export default function PremiumCTA({
  premiumFormatsCount,
  onDismiss,
  variant = 'banner',
}: PremiumCTAProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed && (variant === 'banner' || variant === 'modal')) return null;

  const benefits = [
    PRICING_MARKETING.oneTimePerAsset,
    'One checkout — all formats for this design',
    'Official flat flags stay free',
    'Receipts and billing via Paddle',
  ];

  const ctaLabel = `Buy — ${PRICING_MARKETING.oneTimeShort}`;

  if (variant === 'modal') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={handleDismiss}
      >
        <div
          className="card"
          style={{ maxWidth: '500px', width: '90%' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Crown size={24} style={{ color: 'var(--color-warning)' }} />
              <h3 style={{ margin: 0 }}>Purchase required</h3>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--spacing-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              type="button"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: 'var(--spacing-lg)' }}>
              This asset has {premiumFormatsCount} paid format{premiumFormatsCount > 1 ? 's' : ''}.{' '}
              {PRICING_MARKETING.plansLine}.
            </p>

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: 'var(--spacing-sm)' }}>
                How it works:
              </strong>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {benefits.map((benefit, index) => (
                  <li
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      marginBottom: 'var(--spacing-xs)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <Check size={16} style={{ color: 'var(--color-success)' }} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/pricing" className="btn btn-primary" style={{ width: '100%' }}>
              <Crown size={18} />
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        style={{
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-warning)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
        }}
      >
        <Crown size={20} style={{ marginBottom: 'var(--spacing-xs)' }} />
        <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)' }}>
          {PRICING_MARKETING.oneTimePerAsset}
        </p>
        <Link href="/pricing" className="btn btn-sm" style={{ backgroundColor: 'white', color: 'var(--color-warning)' }}>
          {ctaLabel}
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--color-warning)',
        color: 'white',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--spacing-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <Crown size={24} />
        <div>
          <strong style={{ display: 'block', marginBottom: '2px' }}>
            Unlock {premiumFormatsCount} paid format{premiumFormatsCount > 1 ? 's' : ''}
          </strong>
          <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.9 }}>
            {PRICING_MARKETING.oneTimePerAsset}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <Link href="/pricing" className="btn btn-sm" style={{ backgroundColor: 'white', color: 'var(--color-warning)' }}>
          {ctaLabel}
        </Link>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: 'var(--spacing-xs)',
          }}
          type="button"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
