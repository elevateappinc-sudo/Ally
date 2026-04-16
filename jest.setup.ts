import '@testing-library/jest-dom'

// Mock Web Speech API
const mockRecognitionInstance = {
  continuous: false, interimResults: false, lang: '',
  start: jest.fn(), stop: jest.fn(),
  onresult: null as any, onend: null as any, onerror: null as any,
}
;(global as any).webkitSpeechRecognition = jest.fn(() => mockRecognitionInstance)
;(global as any).SpeechRecognition = jest.fn(() => mockRecognitionInstance)

// Mock speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: { speak: jest.fn(), cancel: jest.fn(), getVoices: jest.fn(() => []) },
  writable: true,
})
