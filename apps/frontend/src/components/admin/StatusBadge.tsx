'use client';

import { CheckCircle, Clock, Crown, Archive } from 'lucide-react';

interface StatusBadgeProps {
  status: 'draft' | 'published' | 'archived';
  isPremium?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, isPremium = false, size = 'md' }: StatusBadgeProps) {
  const sizeMap = {
    sm: { icon: 12, padding: '2px 8px', fontSize: '0.75rem' },
    md: { icon: 14, padding: '4px 10px', fontSize: '0.8125rem' },
    lg: { icon: 16, padding: '6px 12px', fontSize: '0.875rem' },
  };

  const styles = sizeMap[size];

  const statusConfig = {
    draft: {
      label: 'Draft',
      color: '#9CA3AF',
      bgColor: '#F3F4F6',
      icon: Clock,
    },
    published: {
      label: 'Published',
      color: '#10B981',
      bgColor: '#D1FAE5',
      icon: CheckCircle,
    },
    archived: {
      label: 'Archived',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      icon: Archive,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: styles.padding,
          backgroundColor: config.bgColor,
          color: config.color,
          borderRadius: 'var(--radius-full)',
          fontSize: styles.fontSize,
          fontWeight: 500,
        }}
      >
        <Icon size={styles.icon} />
        {config.label}
      </span>

      {isPremium && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: styles.padding,
            backgroundColor: '#FEF3C7',
            color: '#F59E0B',
            borderRadius: 'var(--radius-full)',
            fontSize: styles.fontSize,
            fontWeight: 500,
          }}
        >
          <Crown size={styles.icon} />
          Premium
        </span>
      )}
    </div>
  );
}
