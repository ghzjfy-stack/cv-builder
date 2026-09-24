import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Form data lives on window.QCCvData in the live studio (vanilla).
 * This context mirrors that object for React steps (DetailsStep, etc.).
 */

const EMPTY_JOB = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  role: '',
  company: '',
  dates: '',
  description: '',
});

const EMPTY_EDUCATION = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  degree: '',
  institution: '',
  years: '',
  details: '',
});

function mapJobsFromVanilla(jobs) {
  return (jobs || []).map((job) => ({
    id: String(job.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    role: job.role || job.title || job.position || '',
    company: job.company || job.employer || '',
    dates: job.dates || job.years || '',
    description: job.description || '',
  }));
}

function mapEducationFromVanilla(rows) {
  return (rows || []).map((row) => ({
    id: String(row.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    degree: row.degree || row.title || row.position || '',
    institution: row.institution || row.org || row.company || '',
    years: row.years || row.dates || '',
    details: row.details || row.notes || row.description || '',
  }));
}

function readGlobalCvData() {
  if (typeof window === 'undefined') {
    return { experience: [EMPTY_JOB()], education: [EMPTY_EDUCATION()], _formRev: 0 };
  }
  window.QCCvData = window.QCCvData || {};
  if (!Array.isArray(window.QCCvData.experience) || window.QCCvData.experience.length < 1) {
    window.QCCvData.experience = [EMPTY_JOB()];
  }
  if (!Array.isArray(window.QCCvData.education) || window.QCCvData.education.length < 1) {
    window.QCCvData.education = [EMPTY_EDUCATION()];
  }
  return { ...window.QCCvData, _formRev: Number(window.QCCvData._formRev) || 0 };
}

function writeGlobalCvData(next, opts) {
  if (typeof window === 'undefined') return next;
  window.QCCvData = {
    ...(window.QCCvData || {}),
    ...next,
    experience: Array.isArray(next.experience) ? next.experience.slice() : (window.QCCvData.experience || []),
    education: Array.isArray(next.education) ? next.education.slice() : (window.QCCvData.education || []),
  };
  try {
    window.localStorage.setItem('quickcv_data', JSON.stringify(window.QCCvData || {}));
  } catch {
    /* private mode */
  }
  if (!opts || !opts.silent) {
    if (typeof window.__qcNotifyFormData === 'function') {
      try {
        window.__qcNotifyFormData(window.QCCvData);
      } catch {
        /* ignore */
      }
    }
  }
  return window.QCCvData;
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
      writeGlobalCvData({ ...next, _formRev: Date.now() }, { silent: true });
      return { ...next, _formRev: Date.now() };
    });
  }, []);

  const addExperience = useCallback(() => {
    const entry = EMPTY_JOB();
    let experience = [];

    // 1) Append into QCCvData first (shared source of truth).
    if (typeof window !== 'undefined') {
      window.QCCvData = window.QCCvData || {};
      const prev = Array.isArray(window.QCCvData.experience) ? window.QCCvData.experience : [];
      experience = [...prev, entry];
      window.QCCvData.experience = experience.slice();
    } else {
      experience = [entry];
    }

    // 2) Sync vanilla QCExperience (DOM cards).
    if (typeof window !== 'undefined' && window.QCExperience) {
      try {
        if (typeof window.QCExperience.addExperience === 'function') {
          window.QCExperience.addExperience({ __qcFromReact: true });
        }
        if (typeof window.QCExperience.getJobs === 'function') {
          const jobs = window.QCExperience.getJobs() || [];
          if (jobs.length >= experience.length) {
            experience = mapJobsFromVanilla(jobs);
          }
        }
      } catch {
        /* editor optional */
      }
    }

    // Prefer QCCvData if vanilla returned fewer slots.
    if (
      typeof window !== 'undefined' &&
      Array.isArray(window.QCCvData?.experience) &&
      window.QCCvData.experience.length > experience.length
    ) {
      experience = mapJobsFromVanilla(window.QCCvData.experience);
    }

    // 3) IMMEDIATELY update React state so DetailsStep re-renders new job fields.
    const nextExperience = experience.slice();
    writeGlobalCvData(
      {
        ...(typeof window !== 'undefined' ? window.QCCvData || {} : {}),
        experience: nextExperience,
        _formRev: Date.now(),
      },
      { silent: true }
    );
    setFormDataState((prev) => ({
      ...prev,
      experience: nextExperience,
      _formRev: Date.now(),
    }));
  }, []);

  const addJob = addExperience;

  const addEducation = useCallback(() => {
    const entry = EMPTY_EDUCATION();
    let education = [];

    // 1) Append into QCCvData first.
    if (typeof window !== 'undefined') {
      window.QCCvData = window.QCCvData || {};
      const prev = Array.isArray(window.QCCvData.education) ? window.QCCvData.education : [];
      education = [...prev, entry];
      window.QCCvData.education = education.slice();
    } else {
      education = [entry];
    }

    // 2) Sync vanilla QCEducation (DOM cards).
    if (typeof window !== 'undefined') {
      try {
        if (window.QCEducation && typeof window.QCEducation.addItem === 'function') {
          window.QCEducation.addItem({ __qcFromReact: true });
        } else if (typeof window.addEducation === 'function') {
          window.addEducation({ __qcFromReact: true });
        }
        if (window.QCEducation && typeof window.QCEducation.ensure === 'function') {
          const items = window.QCEducation.ensure() || [];
          if (items.length >= education.length) {
            education = mapEducationFromVanilla(items);
          }
        }
      } catch {
        /* editor optional */
      }
    }

    if (
      typeof window !== 'undefined' &&
      Array.isArray(window.QCCvData?.education) &&
      window.QCCvData.education.length > education.length
    ) {
      education = mapEducationFromVanilla(window.QCCvData.education);
    }

    // 3) IMMEDIATELY update React state so DetailsStep re-renders new education fields.
    const nextEducation = education.slice();
    writeGlobalCvData(
      {
        ...(typeof window !== 'undefined' ? window.QCCvData || {} : {}),
        education: nextEducation,
        _formRev: Date.now(),
      },
      { silent: true }
    );
    setFormDataState((prev) => ({
      ...prev,
      education: nextEducation,
      _formRev: Date.now(),
    }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onNotify = (data) => {
      if (!data || typeof data !== 'object') return;
      setFormDataState((prev) => ({
        ...prev,
        ...data,
        experience: Array.isArray(data.experience) ? data.experience.slice() : prev.experience,
        education: Array.isArray(data.education) ? data.education.slice() : prev.education,
        _formRev: Date.now(),
      }));
    };
    window.__qcNotifyFormData = onNotify;
    window.addExperienceFromForm = addExperience;
    window.addEducationFromForm = addEducation;
    return () => {
      if (window.__qcNotifyFormData === onNotify) delete window.__qcNotifyFormData;
      if (window.addExperienceFromForm === addExperience) delete window.addExperienceFromForm;
      if (window.addEducationFromForm === addEducation) delete window.addEducationFromForm;
    };
  }, [addExperience, addEducation]);

  const value = useMemo(
    () => ({
      formData,
      setFormData,
      addExperience,
      addJob,
      addEducation,
    }),
    [formData, setFormData, addExperience, addJob, addEducation]
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

export { FormDataContext, EMPTY_JOB, EMPTY_EDUCATION, readGlobalCvData };
export default FormDataContext;
