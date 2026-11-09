import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { RejectedRow } from './inputs.js'
import type { IgnoredRow } from './targets.js'
import type { Action, Decision } from './decision-stock.js'

export type RunMode = 'dry-run' | 'apply'

export interface RunReport {
    ranAt: string
    mode: RunMode
    status: 'success' | 'failed'
    error: string | null
    counts: Record<Action | 'rejected' | 'ignored', number>
    results: { sku: string, location: string, oldValue: number | null, newValue: number, action: Action }[]
    rejected: RejectedRow[]
    ignored: { line: number, sku: string, warehouse: string, reason: string }[]
}

interface ReportInput {
    mode: RunMode
    decisions: Decision[]
    rejected: RejectedRow[]
    ignored: IgnoredRow[]
    error: string | null
}

export const buildReport = ({ mode, decisions, rejected, ignored, error }: ReportInput): RunReport => {
    const countAction = (action: Action): number => decisions.filter((decision) => decision.action === action).length

    return {
        ranAt: new Date().toISOString(),
        mode,
        status: error === null ? 'success' : 'failed',
        error,
        counts: {
            UPDATE: countAction('UPDATE'),
            UNCHANGED: countAction('UNCHANGED'),
            UNMATCHED: countAction('UNMATCHED'),
            rejected: rejected.length,
            ignored: ignored.length,
        },
        results: decisions.map(({ sku, location, oldValue, newValue, action }) => ({ sku, location, oldValue, newValue, action })),
        rejected,
        ignored: ignored.map((row) => ({ line: row.line, sku: row.data.sku, warehouse: row.data.warehouse, reason: row.reason })),
    }
}

export const writeReport = (report: RunReport, folder = 'reports'): string => {
    mkdirSync(folder, { recursive: true })

    const content = JSON.stringify(report, null, 2)
    const path = join(folder, `run-${report.ranAt.replaceAll(':', '-')}-${report.mode}.json`)

    writeFileSync(path, content)
    writeFileSync(join(folder, 'latest.json'), content)

    return path
}
