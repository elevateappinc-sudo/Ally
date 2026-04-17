import { renderHook, act } from '@testing-library/react'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = jest.fn()
  ;(window.speechSynthesis.speak as jest.Mock).mockClear()
})
afterEach(() => {
  global.fetch = originalFetch
})

test('falls back to TTS when fetch fails', async () => {
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'))
  const { result } = renderHook(() => useSpeechSynthesis())
  await act(async () => { await result.current.speak('hola') })
  expect(window.speechSynthesis.speak).toHaveBeenCalled()
})

test('falls back to TTS when response is not ok', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
  const { result } = renderHook(() => useSpeechSynthesis())
  await act(async () => { await result.current.speak('hola') })
  expect(window.speechSynthesis.speak).toHaveBeenCalled()
})
