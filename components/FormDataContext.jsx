import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Form data lives on window.QCCvData in the live studio (vanilla).
 * This context mirrors that object for React steps (DetailsStep, etc.).
 */

const EMPTY_JOB = () => ({
  id: Date.now().toString(),
  title: '',
  company: '',
  dates: '',
  description: '',
});

function readGlobalCvData() {
  if (typeof window === 'undefined') {
    return { experience: [EMPTY_JOB()] };
  }
  window.QCCvData = window.QCCvData || {};
  if (!Array.isArray(window.QCCvData.experience) || window.QCCvData.experience.length < 1) {
    window.QCCvData.experience = [EMPTY_JOB()];
  }
  return window.QCCvData;
}

function writeGlobalCvData(next) {
  if (typeof window === 'undefined') return next;
  window.QCCvData = next;
  try {
    window.localStorage.setItem('quickcv_data', JSON.stringify(next || {}));
  } catch {
    /* private mode */
  }
  if (typeof window.__qcNotifyFormData === 'function') {
    try {
      window.__qcNotifyFormData(next);
    } catch {
      /* ignore */
    }
  }
  return next;
}

const FormDataContext = createContext(null);

export function FormDataProvider({ children, initialData }) {
  const [formData, setFormDataState] = useState(() => ({
    ...readGlobalCvData(),
    ...(initialData || {}),
  }));

  const setFormData = useCallback((updater) => {
    setFormDataState((prev) => {
      const next =
        typeof updater === 'function' ? updater(prev) : { ...prev, ...(updater || {}) };
      writeGlobalCvData(next);
      return next;
    });
  }, []);

  const addExperience = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          id: Date.now().toString(),
          title: '',
          company: '',
          dates: '',
          description: '',
        },
      ],
    }));
    // Keep the live studio DOM/editor in sync when available.
    if (typeof window !== 'undefined' && window.QCExperience && typeof window.QCExperience.addExperience === 'function') {
      try {
        window.QCExperience.addExperience({ __qcFromReact: true });
      } catch {
        /* editor optional */
      }
    }
  }, [setFormData]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onNotify = (data) => {
      if (!data || typeof data !== 'object') return;
      setFormDataState((prev) => ({ ...prev, ...data }));
    };
    window.__qcNotifyFormData = onNotify;
    // Seed from live editor if present.
    if (window.QCExperience && typeof window.QCExperience.getJobs === 'function') {
      try {
        const jobs = window.QCExperience.getJobs() || [];
        if (jobs.length) {
          setFormDataState((prev) => ({
            ...prev,
            experience: jobs.map((job) => ({
              id: String(job.id || Date.now().toString()),
              title: job.title || job.role || job.position || '',
              company: job.company || job.employer || '',
              dates: job.dates || job.years || '',
              description: job.description || '',
            })),
          }));
        }
      } catch {
        /* ignore */
      }
    }
    return () => {
      if (window.__qcNotifyFormData === onNotify) delete window.__qcNotifyFormData;
    };
  }, []);

  const value = useMemo(
    () => ({
      formData,
      setFormData,
      addExperience,
    }),
    [formData, setFormData, addExperience]
  );

  return <FormDataContext.Provider value={value}>{children}</FormDataContext.Provider>;
}

export function useFormData() {
  const ctx = useContext(FormDataContext);
  if (!ctx) {
    throw new Error('useFormData must be used within FormDataProvider');
  }
  return ctx;
}

export { FormDataContext, EMPTY_JOB, readGlobalCvData };
export default FormDataContext;
