import { createContext, useContext } from 'react';

export const ReferenceContext = createContext(null);

export function useReference() {
  const ctx = useContext(ReferenceContext);
  if (!ctx) throw new Error('useReference must be used inside <ReferenceProvider>');
  return ctx;
}
