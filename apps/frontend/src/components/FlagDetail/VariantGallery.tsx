'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Variant {
  id: string;
  variant_type: string;
  variant_name?: string;
  preview_url?: string;
  is_default: boolean;
}

interface VariantGalleryProps {
  variants: Variant[];
  selectedVariantId: string | null;
  onVariantSelect: (variantId: string) => void;
}

export default function VariantGallery({
  variants,
  selectedVariantId,
  onVariantSelect,
}: VariantGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [variants]);

  const checkScrollability = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const scrollToVariant = (variantId: string) => {
    if (!scrollRef.current) return;
    const variantIndex = variants.findIndex(v => v.id === variantId);
    if (variantIndex === -1) return;

    const variantElement = scrollRef.current.children[variantIndex] as HTMLElement;
    if (variantElement) {
      variantElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  useEffect(() => {
    if (selectedVariantId) {
      scrollToVariant(selectedVariantId);
    }
  }, [selectedVariantId]);

  if (variants.length <= 1) return null;

  return (
    <div style={{ position: 'relative', marginBottom: 'var(--spacing-lg)' }}>
      {/* Scroll Buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            backgroundColor: 'white',
            border: '1px solid var(--color-gray-300)',
            borderRadius: 'var(--radius-full)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* Variant Carousel */}
      <div
        ref={scrollRef}
        onScroll={checkScrollability}
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          padding: 'var(--spacing-sm) 0',
        }}
      >
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onVariantSelect(variant.id)}
            style={{
              flexShrink: 0,
              width: '120px',
              padding: 'var(--spacing-sm)',
              border: selectedVariantId === variant.id
                ? '2px solid var(--color-primary)'
                : '1px solid var(--color-gray-300)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: selectedVariantId === variant.id
                ? 'rgba(37, 99, 235, 0.1)'
                : 'white',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              textAlign: 'center',
            }}
          >
            {variant.preview_url ? (
              <img
                src={variant.preview_url}
                alt={variant.variant_type}
                style={{
                  width: '100%',
                  aspectRatio: '16/10',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--spacing-xs)',
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: '16/10',
                backgroundColor: 'var(--color-gray-100)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--spacing-xs)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gray-400)',
                fontSize: '0.75rem',
              }}>
                No preview
              </div>
            )}
            <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>
              {variant.variant_name || variant.variant_type.replace('_', ' ')}
            </div>
            {variant.is_default && (
              <span className="badge" style={{ fontSize: '0.625rem', marginTop: 'var(--spacing-xs)' }}>
                Default
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            backgroundColor: 'white',
            border: '1px solid var(--color-gray-300)',
            borderRadius: 'var(--radius-full)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
