'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Brand } from '@/types/pau'

interface BrandStore {
  activeBrand: Brand | null
  isLoading: boolean
  fetchBrand: () => Promise<void>
}

export const useBrandStore = create<BrandStore>()(
  persist(
    (set) => ({
      activeBrand: null,
      isLoading: false,

      fetchBrand: async () => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/brand')
          if (!res.ok) return
          const brand: Brand = await res.json()
          set({ activeBrand: brand })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'ally-active-brand',
      storage: createJSONStorage(() => localStorage),
      partialState: (state: BrandStore) => ({ activeBrand: state.activeBrand }),
    } as Parameters<typeof persist<BrandStore>>[1],
  ),
)
