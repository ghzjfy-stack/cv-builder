export {};

declare global {
  interface Window {
    openPaymentModal?: () => void;
    goStep?: (n: number) => void;
    triggerPDFDownload?: () => void;
    onDownloadPdfClick?: (e?: Event) => void;
    QCRateLimit?: {
      status: () => { locked: boolean; remainingMs: number; fails: number };
      fail: () => { locked: boolean; remainingMs: number };
      reset: () => void;
    };
    QCLog?: { add: (event: string, detail?: string) => void };
    QCExport?: Record<string, () => Promise<void> | void>;
    QCHighResPdf?: (opts?: { download?: boolean }) => Promise<{ blob: Blob; filename: string } | void>;
    QCCoverLetter?: {
      download?: () => void;
      buildText?: () => string;
      filename?: () => string;
      enabled?: () => boolean;
      render?: () => void;
    };
    QCLandings?: {
      list: () => Array<{ slug: string; h1: string }>;
      get: (slug: string) => { slug: string; example: string; field?: string } | null;
      fromPath: (pathname: string) => { slug: string } | null;
    };
    updateCV?: () => void;
    renderTemplateGalleries?: () => void;
    loadExample?: (key: string) => void;
    applyCvTemplate?: (key: string) => void;
    lockQcModalScroll?: (id: string) => void;
    unlockQcModalScroll?: (id: string) => void;
    QCTemplates?: Record<string, unknown>;
    QCTemplateOrder?: string[];
    CV_SAMPLES?: Record<string, Record<string, string>>;
    QCExample?: string;
    QCCvLang?: string;
    resetForm?: () => void;
    clearCvForm?: () => void;
    QCStrength?: {
      update: () => { score: number; missing: string[] };
      compute: () => { score: number; missing: string[] };
    };
    QCExperience?: {
      refresh: () => void;
      applyI18n: () => void;
      addJob?: (e?: Event) => void;
    };
    QCExperienceEditor?: {
      refresh: () => void;
      applyI18n: () => void;
      addJob?: (e?: Event) => void;
    };
    addExperienceJob?: (e?: Event) => void;
    QCPhotoDataUrl?: string;
    QCDraft?: {
      save: () => void;
      saveSoon: () => void;
      apply?: (data: Record<string, unknown>) => boolean;
      restore: () => boolean;
      clear: () => void;
      read?: () => Record<string, unknown> | null;
    };
    QCHandoff?: {
      consume: () => Promise<boolean>;
      hasPending: () => boolean;
      sync: () => void;
      open: () => void;
      close: () => void;
    };
    QCSamplePreview?: {
      open: (e?: Event) => void;
      close: (e?: Event) => void;
      download?: (e?: Event) => void;
      bind?: () => void;
    };
    hydrateLanguagePicker?: () => void;
    closeHandoffModal?: () => void;
    closeSamplePdfPreview?: () => void;
    openSamplePdfPreview?: () => void;
    html2canvas?: (el: HTMLElement, opt?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
    html2pdf?: {
      (): { set: (opt: Record<string, unknown>) => unknown };
    };
    jspdf?: { jsPDF: new (opt: Record<string, unknown>) => unknown };
    jsPDF?: new (opt: Record<string, unknown>) => unknown;
    QCPageFit?: {
      update: () => void;
      updateSoon: () => void;
      bind: () => void;
      pageCount: () => number;
    };
  }
}
