import type { RunReport } from './types.ts'

interface ApiError {
  error: string
}

const readError = async (response: Response): Promise<string> => {
  const body = (await response.json()) as ApiError
  return body.error
}

export const fetchLatestReport = async (): Promise<RunReport | null> => {
  const response = await fetch('/api/report')

  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return (await response.json()) as RunReport
}

export const runSync = async (dryRun: boolean): Promise<RunReport> => {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dryRun }),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return (await response.json()) as RunReport
}
