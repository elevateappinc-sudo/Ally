/**
 * @jest-environment node
 */
import { POST } from '@/app/api/voice/elevenlabs/route'

const originalFetch = global.fetch

beforeEach(() => {
  global.fetch = jest.fn()
})
afterEach(() => {
  global.fetch = originalFetch
  delete process.env.ELEVENLABS_API_KEY
})

test('returns 503 when no API key', async () => {
  const req = new Request('http://localhost', {
    method: 'POST', body: JSON.stringify({ text: 'hola' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await POST(req)
  expect(res.status).toBe(503)
})

test('returns audio when ElevenLabs succeeds', async () => {
  process.env.ELEVENLABS_API_KEY = 'test-key'
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  })
  const req = new Request('http://localhost', {
    method: 'POST', body: JSON.stringify({ text: 'hola' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await POST(req)
  expect(res.status).toBe(200)
  expect(res.headers.get('Content-Type')).toBe('audio/mpeg')
})

test('returns 400 when text is missing', async () => {
  process.env.ELEVENLABS_API_KEY = 'test-key'
  const req = new Request('http://localhost', {
    method: 'POST', body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await POST(req)
  expect(res.status).toBe(400)
})
