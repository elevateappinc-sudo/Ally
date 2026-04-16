/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom'

const mockRecognitionInstance = {
  continuous: false,
  interimResults: false,
  lang: '',
  start: jest.fn(),
  stop: jest.fn(),
  onresult: null as any,
  onend: null as any,
  onerror: null as any,
}

;(global as any).webkitSpeechRecognition = jest.fn(() => mockRecognitionInstance)
;(global as any).SpeechRecognition = jest.fn(() => mockRecognitionInstance)

// Reset shared mock state between tests to prevent leakage
beforeEach(() => {
  mockRecognitionInstance.start.mockClear()
  mockRecognitionInstance.stop.mockClear()
  mockRecognitionInstance.onresult = null
  mockRecognitionInstance.onend = null
  mockRecognitionInstance.onerror = null
})

Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn(() => []),
    speaking: false,
    paused: false,
    pending: false,
  },
  writable: true,
})
