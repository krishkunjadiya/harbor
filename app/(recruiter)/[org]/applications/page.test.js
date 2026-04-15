const { getAllApplicationsForRecruiter } = require('@/lib/actions/database')
const { requireRouteUserType } = require('@/lib/auth/route-context')
const pageModule = require('./page')
const { normalizeFilter } = require('./filter-utils')

jest.mock('@/lib/actions/database', () => ({
  getAllApplicationsForRecruiter: jest.fn(),
}))

jest.mock('@/lib/auth/route-context', () => ({
  requireRouteUserType: jest.fn(),
}))

jest.mock('./applications-client', () => ({
  JobApplicationsClient: () => null,
}))

describe('RecruiterApplicationsPage filter wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireRouteUserType.mockResolvedValue({ id: 'recruiter-1' })
    getAllApplicationsForRecruiter.mockResolvedValue({
      applications: [],
      totalCount: 0,
      page: 1,
      pageSize: 100,
      totalPages: 1,
      jobs: [],
    })
  })

  it('normalizes and passes job/date/status filters to recruiter query', async () => {
    await pageModule.default({
      params: Promise.resolve({ org: 'techcorp' }),
      searchParams: Promise.resolve({
        filter: 'reviewing',
        jobId: '  job-123  ',
        fromDate: ' 2026-01-01 ',
        toDate: '2026-01-31  ',
      }),
    })

    expect(getAllApplicationsForRecruiter).toHaveBeenCalledWith('recruiter-1', {
      status: 'reviewing',
      jobId: 'job-123',
      fromDate: '2026-01-01',
      toDate: '2026-01-31',
      page: 1,
      pageSize: 100,
    })
  })

  it('falls back to all when filter is invalid', async () => {
    await pageModule.default({
      params: Promise.resolve({ org: 'techcorp' }),
      searchParams: Promise.resolve({
        filter: 'unknown',
      }),
    })

    expect(getAllApplicationsForRecruiter).toHaveBeenCalledWith('recruiter-1', {
      status: undefined,
      jobId: undefined,
      fromDate: undefined,
      toDate: undefined,
      page: 1,
      pageSize: 100,
    })
  })
})

describe('normalizeFilter', () => {
  it('accepts valid filters', () => {
    expect(normalizeFilter('pending')).toBe('pending')
    expect(normalizeFilter('accepted')).toBe('accepted')
  })

  it('returns all for invalid/empty values', () => {
    expect(normalizeFilter(undefined)).toBe('all')
    expect(normalizeFilter('anything-else')).toBe('all')
  })
})
