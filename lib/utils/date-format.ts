const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

function toDate(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined) {
    return null
  }

  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDateUTC(value: string | number | Date | null | undefined, fallback = 'N/A') {
  const parsed = toDate(value)
  return parsed ? dateFormatter.format(parsed) : fallback
}

export function formatTimeUTC(value: string | number | Date | null | undefined, fallback = 'N/A') {
  const parsed = toDate(value)
  return parsed ? timeFormatter.format(parsed) : fallback
}
