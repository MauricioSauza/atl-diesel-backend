import type { WarehouseMap, ValidRow, Row } from './inputs.js'

export type IgnoredRow = ValidRow &  { reason: string }
export type CompleteRow = ValidRow & { warehouseName: string }

interface FilteredRows {
    valid: CompleteRow[],
    ignored: IgnoredRow[]
}

export const filterRows = (validRows: ValidRow[], warehouses: WarehouseMap): FilteredRows => {
    const valid: CompleteRow[] = []
    const ignored: IgnoredRow[] = []
    validRows.forEach((row) => {
        const warehouseName = warehouses[row.data.warehouse]
        if (warehouseName !== undefined) {
            valid.push({ ...row, warehouseName })
        } else {
            const reason = `Warehouse "${row.data.warehouse}" is not in the warehouse map`
            ignored.push({...row, reason })
        }
    })

    return {
        valid,
        ignored
    }
}

export interface AvailableRow {
    lines: number[]
    data: Row & { available: number }
    warehouseName: string
}

export const sumAvailable = (rows: CompleteRow[]): AvailableRow[] => {
    const grouped = new Map<string, AvailableRow>()
    for ( const { line, data, warehouseName } of rows) {
        const key = `${data.sku}|${data.warehouse}`
        const available = data.qty_on_hand - data.qty_committed
        const existingKeys = grouped.get(key)

        if (existingKeys) {
            existingKeys.lines.push(line)
            existingKeys.data.qty_on_hand += data.qty_on_hand
            existingKeys.data.qty_committed += data.qty_committed
            existingKeys.data.available += available
        } else {
            grouped.set(key, {lines: [line], data: {...data, available}, warehouseName})
        }
    }

    return [...grouped.values()]
}

interface ComputeTargets {
    rows: AvailableRow[]
    ignored: IgnoredRow[]
}
export const computeTargets = (validRows: ValidRow[], warehouses: WarehouseMap): ComputeTargets => {
    const { valid, ignored } = filterRows(validRows, warehouses)
    const sanitizedRows = sumAvailable(valid)

    return {
        rows: sanitizedRows,
        ignored
    }
}