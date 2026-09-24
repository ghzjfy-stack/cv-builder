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

function writeGlobalCvData(next) {
  if (typeof window === 'undefined') return next;
  // Keep experience / education arrays as dedicated mutable refs on QCCvData
  // so vanilla studio + React stay on the same objects.
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
  if (typeof window.__qcNotifyFormData === 'function') {
    try {
      window.__qcNotifyFormData(window.QCCvData);
    } catch {
      /* ignore */
    }
  }
  return window.QCCvData;
}

function syncVanillaExperience(experience) {
  if (typeof window === 'undefined') return;
  window.QCCvData = window.QCCvData || {};
  window.QCCvData.experience = experience.slice();
  if (window.setCvFormData) {
    try {
      window.setCvFormData((prev) => ({ ...prev, experience }));
      return;
    } catch {
      /* fall through */
    }
  }
  if (window.QCExperience && typeof window.QCExperience.addExperience === 'function') {
    try {
      window.QCExperience.addExperience({ __qcFromReact: true });
    } catch {
      /* editor optional */
    }
  }
}

function syncVanillaEducation(education) {
  if (typeof window === 'undefined') return;
  window.QCCvData = window.QCCvData || {};
  window.QCCvData.education = education.slice();
  if (window.QCEducation && typeof window.QCEducation.addItem === 'function') {
    try {
      window.QCEducation.addItem({ __qcFromReact: true });
    } catch {
      /* editor optional */
    }
  } else if (typeof window.addEducation === 'function') {
    try {
      window.addEducation({ __qcFromReact: true });
    } catch {
      /* editor optional */
    }
  }
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
      return { ...next, _formRev: Date.now() };
    });
  }, []);

  const addExperience = useCallback(() => {
    const entry = EMPTY_JOB();
    setFormDataState((prev) => {
      const experience = [...(prev.experience || []), entry];
      // Push into window.QCCvData.experience immediately (before React commit).
      if (typeof window !== 'undefined') {
        window.QCCvData = window.QCCvData || {};
        window.QCCvData.experience = experience.slice();
      }
      const next = {
        ...prev,
        experience,
        _formRev: Date.now(),
      };
      writeGlobalCvData(next);
      return next;
    });
    // Sync vanilla cards on next tick so QCCvData already has the new entry.
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => syncVanillaExperience(
        (typeof window !== 'undefined' && window.QCCvData && window.QCCvData.experience) || []
      ));
    } else {
      setTimeout(() => syncVanillaExperience(
        (typeof window !== 'undefined' && window.QCCvData && window.QCCvData.experience) || []
      ), 0);
    }
  }, []);

  const addJob = addExperience;

  const addEducation = useCallback(() => {
    const entry = EMPTY_EDUCATION();
    setFormDataState((prev) => {
      const education = [...(prev.education || []), entry];
      // Push into window.QCCvData.education immediately (before React commit).
      if (typeof window !== 'undefined') {
        window.QCCvData = window.QCCvData || {};
        window.QCCvData.education = education.slice();
      }
      const next = {
        ...prev,
        education,
        _formRev: Date.now(),
      };
      writeGlobalCvData(next);
      return next;
    });
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => syncVanillaEducation(
        (typeof window !== 'undefined' && window.QCCvData && window.QCCvData.education) || []
      ));
    } else {
      setTimeout(() => syncVanillaEducation(
        (typeof window !== 'undefined' && window.QCCvData && window.QCCvData.education) || []
      ), 0);
    }
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
    // Expose the same add handlers for non-React / HTML onclick bridges.
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
