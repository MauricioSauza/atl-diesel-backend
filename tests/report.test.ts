import { buildReport } from '../src/report.js'
import {
    EF300_MIA_IGNORED,
    KL600_REJECTED,
    UNCHANGED_DECISION,
    UNMATCHED_DECISION,
    UPDATE_DECISION,
} from './constants.js'

const DECISIONS = [UPDATE_DECISION, UNCHANGED_DECISION, UNMATCHED_DECISION]

describe('buildReport', () => {
    it('counts each action plus rejected and ignored rows', () => {
        const report = buildReport({
            mode: 'dry-run',
            decisions: DECISIONS,
            rejected: [KL600_REJECTED],
            ignored: [EF300_MIA_IGNORED],
            error: null,
        })

        expect(report.counts).toEqual({ UPDATE: 1, UNCHANGED: 1, UNMATCHED: 1, rejected: 1, ignored: 1 })
    })

    it('lists each SKU and location with old value, new value and action', () => {
        const report = buildReport({ mode: 'apply', decisions: [UPDATE_DECISION], rejected: [], ignored: [], error: null })

        expect(report.results).toEqual([
            { sku: 'AB-100', location: 'Dallas Warehouse', oldValue: 5, newValue: 8, action: 'UPDATE' },
        ])
    })

    it('lists rejected and ignored rows with their line and reason', () => {
        const report = buildReport({
            mode: 'dry-run',
            decisions: [],
            rejected: [KL600_REJECTED],
            ignored: [EF300_MIA_IGNORED],
            error: null,
        })

        expect(report.rejected).toEqual([KL600_REJECTED])
        expect(report.ignored).toEqual([
            { line: 7, sku: 'EF-300', warehouse: 'MIA', reason: 'Warehouse "MIA" is not in the warehouse map' },
        ])
    })

    it.each([
        { error: null, status: 'success' },
        { error: 'Shopify rejected the update', status: 'failed' },
    ])('marks the run $status when error is $error', ({ error, status }) => {
        const report = buildReport({ mode: 'apply', decisions: DECISIONS, rejected: [], ignored: [], error })

        expect(report.status).toBe(status)
        expect(report.error).toBe(error)
    })

    it('records when it ran and in which mode', () => {
        const report = buildReport({ mode: 'dry-run', decisions: [], rejected: [], ignored: [], error: null })

        expect(report.mode).toBe('dry-run')
        expect(new Date(report.ranAt).toISOString()).toBe(report.ranAt)
    })
})
