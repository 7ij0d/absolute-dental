import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { cleanColorLabel } from '../utils/boxInventoryEngine';
import { CheckCircle2, Ban, AlertTriangle, Layers, Info } from 'lucide-react';

/**
 * ABSOLUTE DENTAL — LUXURY BOX COLOR VARIANT SELECTOR
 * High-craftsmanship bi-directional component displaying:
 * - Row 1: "الألوان المتوفرة" (Available Colors)
 * - Row 2: "الألوان غير المتوفرة حالياً" (Currently Unavailable Colors)
 * - Prominent "جميع الألوان غير متوفرة حالياً" banner when no colors are in stock
 */
export const BoxColorVariantSelector = ({
  availableColors = [],
  unavailableColors = [],
  selectedColor = null,
  onSelectColor,
  boxName = ''
}) => {
  const { lang, isRtl } = useLanguage();
  const allUnavailable = availableColors.length === 0;

  const isColorSelected = (color) => {
    if (!selectedColor || !color) return false;
    return (
      (color.id && (color.id === selectedColor.id || color.id === selectedColor.variant_id)) ||
      (color.color_id && color.color_id === selectedColor.color_id)
    );
  };

  return (
    <div
      className="box-color-variant-system"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1.2rem',
        background: 'var(--surface-color, #FFFFFF)',
        border: '1px solid var(--border-color, #E5E7EB)',
        borderRadius: 'var(--radius-lg, 16px)',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
        direction: isRtl ? 'rtl' : 'ltr'
      }}
    >
      {/* ── HEADER & ACTIVE SELECTION LABEL ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.6rem',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          paddingBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🎨</span>
          <span
            style={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: 'var(--text-main, #1F2937)',
              letterSpacing: '-0.01em'
            }}
          >
            {lang === 'ar' ? 'خيارات ألوان البوكس:' : 'Box Color Options:'}
          </span>
        </div>

        {selectedColor && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              background: (selectedColor.available_stock > 0)
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${(selectedColor.available_stock > 0) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.25)'}`
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: selectedColor.hex_code || '#888',
                border: '1px solid rgba(0,0,0,0.2)',
                display: 'inline-block'
              }}
            />
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: (selectedColor.available_stock > 0) ? '#065F46' : '#991B1B'
              }}
            >
              {cleanColorLabel(selectedColor, lang)}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: (selectedColor.available_stock > 0) ? '#059669' : '#DC2626'
              }}
            >
              {selectedColor.available_stock > 0
                ? (lang === 'ar' ? '(متوفر)' : '(In Stock)')
                : (lang === 'ar' ? '(غير متوفر)' : '(Out of Stock)')}
            </span>
          </div>
        )}
      </div>

      {/* ── ALL UNAVAILABLE GLOBAL BANNER (Requirement 4) ── */}
      {allUnavailable && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.05))',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            color: '#B91C1C'
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Ban size={17} color="#DC2626" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>
              {lang === 'ar' ? 'جميع الألوان غير متوفرة حالياً' : 'All colors currently out of stock'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#7F1D1D', marginTop: '0.15rem' }}>
              {lang === 'ar'
                ? 'يتم حالياً جرد وتحديث المخزون الفعلي، سيتم تفعيل الألوان فور تأكيد الكميات.'
                : 'Inventory is currently being updated. Colors will become purchasable once stock is confirmed.'}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION A: AVAILABLE COLORS (Row 1) ── */}
      {availableColors.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.65rem'
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                display: 'inline-block'
              }}
            />
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#065F46',
                letterSpacing: '0.02em'
              }}
            >
              {lang === 'ar' ? 'الألوان المتوفرة' : 'Available Colors'}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#059669',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px'
              }}
            >
              {availableColors.length}
            </span>
          </div>

          {/* Smooth Horizontal Scrollable Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              overflowX: 'auto',
              paddingBlock: '0.35rem',
              paddingInline: '0.2rem',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin'
            }}
          >
            {availableColors.map((color) => {
              const selected = isColorSelected(color);
              const label = cleanColorLabel(color, lang);
              return (
                <button
                  key={color.id || color.color_id}
                  type="button"
                  onClick={() => onSelectColor(color)}
                  title={`${label} — ${lang === 'ar' ? 'متوفر' : 'In Stock'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.6rem',
                    borderRadius: '12px',
                    border: selected
                      ? '2px solid var(--primary, #3D352E)'
                      : '1px solid rgba(0,0,0,0.1)',
                    background: selected ? 'rgba(61, 53, 46, 0.05)' : '#FFFFFF',
                    boxShadow: selected
                      ? '0 0 0 2px var(--primary, #3D352E), 0 2px 6px rgba(0,0,0,0.1)'
                      : '0 1px 3px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: selected ? 'scale(1.05)' : 'scale(1)',
                    flexShrink: 0,
                    minWidth: '78px'
                  }}
                >
                  {/* Swatch circle with inner double-border */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: color.hex_code || '#888',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.15)',
                      border: '2px solid #FFFFFF'
                    }}
                  >
                    {selected && (
                      <CheckCircle2
                        size={18}
                        color="#FFFFFF"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.75))' }}
                      />
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: selected ? 'var(--primary, #3D352E)' : 'var(--text-main, #374151)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      maxWidth: '85px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {label}
                  </span>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#059669',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '1px 6px',
                      borderRadius: '999px'
                    }}
                  >
                    {lang === 'ar' ? 'متوفر' : 'In Stock'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION B: CURRENTLY UNAVAILABLE COLORS (Row 2) ── */}
      {unavailableColors.length > 0 && (
        <div style={{ marginTop: availableColors.length > 0 ? '0.35rem' : 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.65rem'
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#EF4444',
                display: 'inline-block'
              }}
            />
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#991B1B',
                letterSpacing: '0.02em'
              }}
            >
              {lang === 'ar' ? 'الألوان غير المتوفرة حالياً' : 'Currently Unavailable Colors'}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#DC2626',
                background: 'rgba(239, 68, 68, 0.12)',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px'
              }}
            >
              {unavailableColors.length}
            </span>
          </div>

          {/* Smooth Horizontal Scrollable Row for Unavailable Colors */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              overflowX: 'auto',
              paddingBlock: '0.35rem',
              paddingInline: '0.2rem',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin'
            }}
          >
            {unavailableColors.map((color) => {
              const selected = isColorSelected(color);
              const label = cleanColorLabel(color, lang);
              return (
                <button
                  key={color.id || color.color_id}
                  type="button"
                  onClick={() => onSelectColor(color)}
                  title={`${label} — ${lang === 'ar' ? 'غير متوفر حالياً' : 'Out of Stock'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.6rem',
                    borderRadius: '12px',
                    border: selected
                      ? '2px solid rgba(239, 68, 68, 0.6)'
                      : '1px dashed rgba(0,0,0,0.18)',
                    background: selected ? 'rgba(239, 68, 68, 0.05)' : '#FAFAFA',
                    opacity: 0.72,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0,
                    minWidth: '78px',
                    position: 'relative'
                  }}
                >
                  {/* Swatch circle with subtle diagonal line or grayscale */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: color.hex_code || '#888',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #FFFFFF',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Diagonal strike-through line */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '140%',
                        height: '2px',
                        background: 'rgba(255, 255, 255, 0.85)',
                        transform: 'rotate(-45deg)',
                        boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#6B7280',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      maxWidth: '85px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {label}
                  </span>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#DC2626',
                      background: 'rgba(239, 68, 68, 0.12)',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {lang === 'ar' ? 'غير متوفر' : 'Unavailable'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoxColorVariantSelector;
