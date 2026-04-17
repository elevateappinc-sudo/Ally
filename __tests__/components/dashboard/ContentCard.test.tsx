import { render, screen, fireEvent } from '@testing-library/react'
import { ContentCard } from '@/components/dashboard/ContentCard'
import type { ContentPost } from '@/lib/supabase/types'

jest.mock('react-swipeable', () => ({
  useSwipeable: () => ({}),
}))

const mockPost: ContentPost = {
  id: 'post-1', org_id: 'org-1', strategy_id: 'strat-1',
  post_date: '2026-04-20', post_type: 'carousel', pillar: 'education',
  caption: 'Test caption content', visual_brief: 'Show a chart',
  hashtags: ['#test'], best_time: '10:00', status: 'pending',
  approved_by: null, created_at: '2026-04-16T00:00:00Z',
}

test('renders post caption', () => {
  render(<ContentCard post={mockPost} onApprove={jest.fn()} onSkip={jest.fn()} onEdit={jest.fn()} />)
  expect(screen.getByText('Test caption content')).toBeInTheDocument()
})

test('calls onApprove when approve button clicked', () => {
  const onApprove = jest.fn()
  render(<ContentCard post={mockPost} onApprove={onApprove} onSkip={jest.fn()} onEdit={jest.fn()} />)
  fireEvent.click(screen.getByText('✓ Aprobar'))
  expect(onApprove).toHaveBeenCalledWith('post-1')
})

test('calls onSkip when skip button clicked', () => {
  const onSkip = jest.fn()
  render(<ContentCard post={mockPost} onApprove={jest.fn()} onSkip={onSkip} onEdit={jest.fn()} />)
  fireEvent.click(screen.getByText('Saltar'))
  expect(onSkip).toHaveBeenCalledWith('post-1')
})
