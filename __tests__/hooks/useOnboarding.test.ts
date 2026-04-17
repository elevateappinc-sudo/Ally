import { renderHook, act } from '@testing-library/react'
import { useOnboarding } from '@/hooks/useOnboarding'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

test('starts at step 0', () => {
  const { result } = renderHook(() => useOnboarding('org-1'))
  expect(result.current.step).toBe(0)
  expect(result.current.currentStep.question).toBe('¿Qué vendes?')
})

test('advances to next step on answer', () => {
  const { result } = renderHook(() => useOnboarding('org-1'))
  act(() => { result.current.answer('Vendo ropa') })
  expect(result.current.step).toBe(1)
  expect(result.current.data.business).toBe('Vendo ropa')
})

test('marks done after finish', async () => {
  const { result } = renderHook(() => useOnboarding('org-1'))
  act(() => { result.current.answer('Vendo ropa') })
  act(() => { result.current.answer('No tengo tiempo') })
  act(() => { result.current.answer('instagram.com/mystore') })
  await act(async () => { await result.current.finish('1-2 horas') })
  expect(result.current.done).toBe(true)
})
