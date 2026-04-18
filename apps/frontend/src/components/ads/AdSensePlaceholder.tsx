/**
 * Reserved integration point for Google AdSense (or similar).
 *
 * After approval: add your real publisher script in `app/layout.tsx` inside `<body>`, typically with
 * `next/script` and `strategy="afterInteractive"`, using `NEXT_PUBLIC_ADSENSE_CLIENT` or a static
 * `ca-pub-...` value from your AdSense account. Do not load ads on pages that must stay distraction-free
 * (checkout, account security) unless policy allows.
 */
export function AdSenseScriptPlaceholder() {
  return null;
}

/**
 * Optional layout region for future ad units. Non-intrusive: zero height until you insert real slots.
 */
export function AdLayoutReserve() {
  return (
    <div
      className="hidden min-h-0 w-full shrink-0 lg:block"
      aria-hidden
      data-ad-reserve="global"
      id="ad-layout-reserve"
    />
  );
}
