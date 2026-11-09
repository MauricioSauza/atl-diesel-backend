export type Action = 'UPDATE' | 'UNCHANGED' | 'UNMATCHED'

export type RunMode = 'dry-run' | 'apply'

export type RunStatus = 'success' | 'failed'

export interface ResultRow {
  sku: string
  location: string
  oldValue: number | null
  newValue: number
  action: Action
}

export interface RejectedRow {
  line: number
  raw: unknown
  reason: string
}

export interface IgnoredRow {
  line: number
  sku: string
  warehouse: string
  reason: string
}

export interface RunCounts {
  UPDATE: number
  UNCHANGED: number
  UNMATCHED: number
  rejected: number
  ignored: number
}

export interface RunReport {
  ranAt: string
  mode: RunMode
  status: RunStatus
  error: string | null
  counts: RunCounts
  results: ResultRow[]
  rejected: RejectedRow[]
  ignored: IgnoredRow[]
}
