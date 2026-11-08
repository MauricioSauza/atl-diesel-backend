import { z } from 'zod'
import { readFileSync } from 'node:fs'
import { parse, type Info } from 'csv-parse/sync'

const MapKey = z.string().trim().min(1).toUpperCase()
const MapVal = z.string().trim().min(1)

const WarehouseMapSchema = z.record(MapKey, MapVal)

export type WarehouseMap = z.infer<typeof WarehouseMapSchema>

export const loadWarehouseMap =  (path: string): WarehouseMap => {
    let rawFile: unknown
    try {
        rawFile = JSON.parse(readFileSync(path, "utf-8"))
    } catch (error: unknown) {
        throw new Error(`Cannot load warehouse map: ${path}`, { cause: error })
    }
    
    const result = WarehouseMapSchema.safeParse(rawFile)
    if (!result.success) {
        throw new Error(`Invalid warehouse map: ${path}\n${z.prettifyError(result.error)}`)
    }

    return result.data
}

const NonNegativeInt = z.string()
    .trim()
    .regex(/^\d+$/, 'must be a whole number, 0 or more')
    .transform(Number)
    .pipe(z.number().int().nonnegative())

const RowSchema = z.object({
    sku: z.string().trim().toUpperCase().min(1),
    warehouse: z.string().trim().toUpperCase().min(1),
    qty_on_hand: NonNegativeInt,
    qty_committed: NonNegativeInt,
})

export type Row = z.infer<typeof RowSchema>
export interface ValidRow { line: number, data: Row }
export interface RejectedRow { line: number, raw: unknown, reason: string }

interface ParsedRecord { info: Info, record: unknown }

export interface ErpLoadResult {
    valid: ValidRow[],
    rejected: RejectedRow[]
}


export const loadErpRows = (path: string): ErpLoadResult => {
    let records: ParsedRecord[]
    try {
        records = parse<ParsedRecord>(readFileSync(path, 'utf-8'), {
            columns: true,
            bom: true,
            skip_empty_lines: true,
            relax_column_count: true,
            info: true,
        })
    } catch (error: unknown) {
        throw new Error(`Cannot load CSV: ${path}`, { cause: error })
    }

    const valid: ValidRow[] = []
    const rejected: RejectedRow[] = []

    for (const { info, record } of records) {
        const result = RowSchema.safeParse(record)
        if (result.success) {
            valid.push({ line: info.lines, data: result.data })
        } else {
            const reason = result.error.issues
                .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                .join('; ')
            rejected.push({ line: info.lines, raw: record, reason })
        }
    }
    return {
        valid,
        rejected
    }
}