/**
 * @jest-environment node
 */
import { POST } from '@/app/api/chat/route'

// Chainable mock that supports any number of .eq() calls
function makeChain(resolvedValue: any): any {
  const chain: any = {
    eq: () => makeChain(resolvedValue),
    order: () => makeChain(resolvedValue),
    limit: () => makeChain(resolvedValue),
    single: jest.fn().mockResolvedValue(resolvedValue),
    then: (resolve: any) => Promise.resolve(resolvedValue).then(resolve),
  }
  return chain
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: (table: string) => {
      const value = table === 'content_calendar'
        ? { data: [], error: null }
        : { data: { business: 'Ropa', pain_point: 'tiempo', time_commitment: '1h', platforms: ['instagram'], frequency: '4x/week' }, error: null }
      return { select: () => makeChain(value) }
    },
  }),
}))

jest.mock('@/lib/anthropic', () => ({
  getAnthropicClient: () => ({
    messages: { create: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'Respuesta de Sofía' }] }) },
  }),
}))

test('returns reply from Claude', async () => {
  const req = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ message: 'Hola', orgId: 'org-1' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await POST(req)
  expect(res.status).toBe(200)
  const json = await res.json()
  expect(json.reply).toBe('Respuesta de Sofía')
})
