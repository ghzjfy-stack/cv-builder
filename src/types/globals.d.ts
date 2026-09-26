export {};

declare global {
  interface Window {
    openPaymentModal?: () => void;
    goStep?: (n: number) => void;
    QCCheckoutGate?: (opts?: { silent?: boolean }) => boolean;
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
    __qcPdfBusy?: boolean;
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
    QCIsPaid?: boolean;
    QCPaidUntil?: number;
    resetForm?: () => void;
    clearCvForm?: () => void;
    QCStrength?: {
      update: () => { score: number; missing: string[] };
      compute: () => { score: number; missing: string[] };
    };
    QCExperience?: {
      refresh: () => void;
      applyI18n: () => void;
      addJob?: (e?: Event) => boolean | void;
      handleAddJob?: (e?: Event) => boolean | void;
      toggleRaw?: (e?: Event) => boolean | void;
      getJobs?: () => unknown[];
    };
    QCExperienceEditor?: {
      refresh: () => void;
      applyI18n: () => void;
      addJob?: (e?: Event) => boolean | void;
      handleAddJob?: (e?: Event) => boolean | void;
      toggleRaw?: (e?: Event) => boolean | void;
      getJobs?: () => unknown[];
    };
    handleAddJob?: (e?: Event) => boolean | void;
    addExperienceJob?: (e?: Event) => boolean | void;
    toggleExperienceRaw?: (e?: Event) => boolean | void;
    QCEducation?: {
      refresh: () => void;
      applyI18n: () => void;
      addItem?: (e?: Event) => boolean | void;
      toggleRaw?: (e?: Event) => boolean | void;
    };
    QCMilitary?: {
      refresh: () => void;
      applyI18n: () => void;
      addItem?: (e?: Event) => boolean | void;
      toggleRaw?: (e?: Event) => boolean | void;
    };
    handleAddEducation?: (e?: Event) => boolean | void;
    handleAddMilitary?: (e?: Event) => boolean | void;
    toggleEducationRaw?: (e?: Event) => boolean | void;
    toggleMilitaryRaw?: (e?: Event) => boolean | void;
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
    handleAddLanguage?: (e?: Event) => boolean | void;
    onLangPickChange?: (e?: Event) => void;
    addCvLanguage?: () => boolean | void;
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
