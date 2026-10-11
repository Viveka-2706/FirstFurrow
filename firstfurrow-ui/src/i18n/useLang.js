import { createContext, useContext } from 'react';

export const LanguageContext = createContext(null);

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}
