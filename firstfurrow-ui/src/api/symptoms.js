import { api } from './client';

export const fetchSymptoms = async (cropId, signal) => (await api(`/symptoms?crop=${encodeURIComponent(cropId)}`, { auth: false, signal })).groups;

export const diagnose = async (cropId, symptomIds) =>
  (await api('/symptoms/diagnose', { method: 'POST', body: { crop: cropId, symptoms: symptomIds }, auth: false })).results;
