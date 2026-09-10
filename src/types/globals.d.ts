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
    QCExperience?: { refresh: () => void; applyI18n: () => void };
    QCPhotoDataUrl?: string;
    QCDraft?: {
      save: () => void;
      saveSoon: () => void;
      restore: () => boolean;
      clear: () => void;
    };
    html2pdf?: unknown;
    html2canvas?: (el: HTMLElement, opt?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
    jspdf?: { jsPDF: new (opt: Record<string, unknown>) => unknown };
    jsPDF?: new (opt: Record<string, unknown>) => unknown;
  }
}
