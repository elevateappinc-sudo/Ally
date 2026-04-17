import { renderHook, act } from '@testing-library/react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: jest.fn().mockResolvedValue({}) },
})

function makeHook(overrides = {}) {
  return renderHook(() =>
    useVoiceRecognition({
      onTranscript: jest.fn(),
      onSilence: jest.fn(),
      ...overrides,
    })
  )
}

test('starts in idle state', () => {
  const { result } = makeHook()
  expect(result.current.state).toBe('idle')
  expect(result.current.hasPermission).toBe(false)
})

test('transitions to listening after requestPermission', async () => {
  const { result } = makeHook()
  await act(async () => { await result.current.requestPermission() })
  expect(result.current.state).toBe('listening')
  expect(result.current.hasPermission).toBe(true)
})

test('pause and resume toggle isPaused without crashing', async () => {
  const { result } = makeHook()
  await act(async () => { await result.current.requestPermission() })
  act(() => { result.current.pause() })
  act(() => { result.current.resume() })
  expect(result.current.state).toBe('listening')
})
