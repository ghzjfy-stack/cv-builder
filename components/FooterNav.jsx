import React from 'react';

/**
 * FooterNav — primary step CTA shared by mobile sticky dock and desktop panels.
 * Step 2 → "המשך להורדה" → Step 3. PDF payment CTA lives only on Step 3.
 */
export default function FooterNav({
  step = 2,
  language = 'he',
  isEnglish: isEnglishProp,
  onContinue,
  onDownload,
  className = '',
}) {
  const isEnglish = isEnglishProp !== undefined ? Boolean(isEnglishProp) : language === 'en';
  const current = Math.max(1, Math.min(3, Number(step) || 1));

  const continueLabel =
    current === 1
      ? isEnglish
        ? 'Continue to details →'
        : 'המשך למילוי פרטים ⬅️'
      : isEnglish
        ? 'Continue to download →'
        : 'המשך להורדה ⬅️';

  const downloadLabel = isEnglish ? (
    <>
      Download PDF · <span data-price>10</span> ₪
    </>
  ) : (
    <>
      הורד PDF ב-<span data-price>10</span> ₪
    </>
  );

  const showContinue = current === 1 || current === 2;
  const showDownload = current === 3;

  const handleContinue = () => {
    if (typeof onContinue === 'function') {
      onContinue(current === 1 ? 2 : 3);
      return;
    }
    if (typeof window !== 'undefined' && typeof window.goStep === 'function') {
      window.goStep(current === 1 ? 2 : 3);
    }
  };

  const handleDownload = () => {
    if (typeof onDownload === 'function') {
      onDownload();
      return;
    }
    if (typeof window !== 'undefined' && typeof window.openPaymentModal === 'function') {
      window.openPaymentModal();
    }
  };

  return (
    <div
      className={`footer-nav flex w-full flex-col gap-2 ${className}`.trim()}
      data-step={current}
    >
      {showContinue ? (
        <button
          type="button"
          className="footer-nav-continue studio-continue-btn w-full min-h-14 rounded-2xl bg-blue-600 px-4 py-4 text-base font-extrabold text-white shadow-lg transition hover:bg-blue-500"
          onClick={handleContinue}
        >
          {continueLabel}
        </button>
      ) : null}
      {showDownload ? (
        <button
          type="button"
          className="footer-nav-download cta-download w-full min-h-14 rounded-2xl bg-emerald-500 px-4 py-4 text-base font-extrabold text-slate-950 shadow-lg transition hover:bg-emerald-400"
          onClick={handleDownload}
        >
          {downloadLabel}
        </button>
      ) : null}
    </div>
  );
}
