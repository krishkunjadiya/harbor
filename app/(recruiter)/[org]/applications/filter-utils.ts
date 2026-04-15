export type ApplicationFilter = 'all' | 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted'

const VALID_FILTERS: ApplicationFilter[] = ['all', 'pending', 'reviewing', 'shortlisted', 'rejected', 'accepted']

export function normalizeFilter(filter?: string): ApplicationFilter {
  if (filter && VALID_FILTERS.includes(filter as ApplicationFilter)) {
    return filter as ApplicationFilter
  }

  return 'all'
}