import { api } from './client';

// soils, districts (with weather coordinates + Tamil names) and the short crop list shown on the landing page
export const fetchReference = (signal) => api('/reference', { auth: false, signal });
