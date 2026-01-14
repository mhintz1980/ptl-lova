import { render, screen } from '@testing-library/react'
import { DashboardSkeleton } from './DashboardSkeleton'

describe('DashboardSkeleton', () => {
  it('renders skeleton elements', () => {
    render(<DashboardSkeleton />)

    // Main container should be present
    const container = screen.getByRole('generic', { name: '' })
    expect(container).toBeInTheDocument()
  })

  it('renders correct number of KPI placeholders', () => {
    const { container } = render(<DashboardSkeleton />)

    // KPI skeleton elements have h-10 w-32 classes
    const kpiSkeletons = container.querySelectorAll('.h-10.w-32')
    expect(kpiSkeletons).toHaveLength(3)
  })

  it('renders mode toggle placeholders', () => {
    const { container } = render(<DashboardSkeleton />)

    // Mode toggle skeletons have h-9 class
    const modeToggleSkeletons = container.querySelectorAll('.h-9.w-48, .h-9.w-24')
    expect(modeToggleSkeletons).toHaveLength(2)
  })

  it('renders three chart cards in first row', () => {
    const { container } = render(<DashboardSkeleton />)

    // Chart cards have col-span-12 md:col-span-4 h-[450px] classes
    const chartCards = container.querySelectorAll('.col-span-12.md\\:col-span-4.h-\\[450px\\]')
    expect(chartCards).toHaveLength(3)
  })

  it('renders one large chart in second row', () => {
    const { container } = render(<DashboardSkeleton />)

    // Large chart has col-span-12 h-[300px] classes
    const largeChart = container.querySelectorAll('.col-span-12.h-\\[300px\\]')
    expect(largeChart).toHaveLength(1)
  })

  it('has proper accessibility attributes', () => {
    const { container } = render(<DashboardSkeleton />)

    // All skeleton elements should be present
    const skeletonElements = container.querySelectorAll('[class*="skeleton"]')
    expect(skeletonElements.length).toBeGreaterThan(0)

    // Verify aria-busy is not set (skeletons are visual indicators)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
  })

  it('renders bar chart placeholders with correct count', () => {
    const { container } = render(<DashboardSkeleton />)

    // The large chart has 10 bars
    const bars = container.querySelectorAll('.w-full.rounded-t-md')
    expect(bars).toHaveLength(10)
  })

  it('has donut chart placeholders', () => {
    const { container } = render(<DashboardSkeleton />)

    // Three charts with circular placeholders (h-32 w-32 rounded-full)
    const donutPlaceholders = container.querySelectorAll('.h-32.w-32.rounded-full')
    expect(donutPlaceholders).toHaveLength(3)
  })
})
