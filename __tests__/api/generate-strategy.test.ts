/**
 * @jest-environment node
 */
import { POST } from '@/app/api/generate-strategy/route'

const mockSingle = jest.fn()
const mockInsertSelect = jest.fn()
const mockBulkInsert = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      insert: (data: any) => ({
        select: () => ({ single: mockInsertSelect }),
        then: mockBulkInsert,
      }),
    }),
  }),
}))

jest.mock('@/lib/anthropic', () => ({
  getAnthropicClient: () => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            pillars: { education: 40, behind_scenes: 25, social_proof: 20, sales: 15 },
            frequency: '4x/week',
            platforms: ['instagram'],
            posts: [{
              date: '2026-04-20', type: 'carousel', pillar: 'education',
              caption: 'Test caption', visual_brief: 'Test brief',
              hashtags: ['#test'], best_time: '10:00',
            }],
            reasoning: 'Test reasoning',
          }),
        }],
      }),
    },
  }),
}))

test('returns 400 when orgId is missing', async () => {
  const req = new Request('http://localhost', {
    method: 'POST', body: JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await POST(req)
  expect(res.status).toBe(400)
})
