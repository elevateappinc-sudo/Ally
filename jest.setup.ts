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

// Browser-only mocks — skip in node test environment
if (typeof window !== 'undefined') {

// Mock SpeechSynthesisUtterance
;(global as any).SpeechSynthesisUtterance = class {
  text: string
  voice: any = null
  lang: string = 'es-ES'
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(text: string) { this.text = text }
}

Object.defineProperty(window, 'speechSynthesis', {
  configurable: true,
  writable: true,
  value: {
    speak: jest.fn((utterance: any) => { setTimeout(() => utterance?.onend?.(), 0) }),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn(() => []),
    speaking: false,
    paused: false,
    pending: false,
  },
})

} // end browser-only mocks
