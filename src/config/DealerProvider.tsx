'use client'
import { createContext, useContext } from 'react'
import type { DealershipInfo } from '@/types/dealership'
const Context = createContext<DealershipInfo | null>(null)
export const DealerProvider = Context.Provider
export function useDealer() {
  const dealer = useContext(Context)
  if (!dealer) throw new Error('Dealer profile is unavailable')
  return dealer
}
