import type { ValidRow, WarehouseMap } from '../src/inputs.js'
import type { CompleteRow } from '../src/targets.js'

// Test data only. Mirrors data/erp_export.csv and data/warehouse_map.json.

export const ATLANTA = 'Atlanta Warehouse'
export const DALLAS = 'Dallas Warehouse'

export const WAREHOUSES: WarehouseMap = { ATL: ATLANTA, DAL: DALLAS }

// Valid rows, as returned by loadErpRows (already trimmed and uppercased)

export const AB100_ATL: ValidRow = {
    line: 2,
    data: { sku: 'AB-100', warehouse: 'ATL', qty_on_hand: 10, qty_committed: 2 },
}

export const AB100_ATL_DUPLICATE: ValidRow = {
    line: 3,
    data: { sku: 'AB-100', warehouse: 'ATL', qty_on_hand: 5, qty_committed: 1 },
}

export const AB100_DAL: ValidRow = {
    line: 4,
    data: { sku: 'AB-100', warehouse: 'DAL', qty_on_hand: 8, qty_committed: 0 },
}

export const CD200_ATL_OVERCOMMITTED: ValidRow = {
    line: 5,
    data: { sku: 'CD-200', warehouse: 'ATL', qty_on_hand: 3, qty_committed: 5 },
}

export const EF300_ATL: ValidRow = {
    line: 6,
    data: { sku: 'EF-300', warehouse: 'ATL', qty_on_hand: 20, qty_committed: 4 },
}

export const EF300_MIA_UNMAPPED: ValidRow = {
    line: 7,
    data: { sku: 'EF-300', warehouse: 'MIA', qty_on_hand: 7, qty_committed: 0 },
}

export const GH400_DAL: ValidRow = {
    line: 8,
    data: { sku: 'GH-400', warehouse: 'DAL', qty_on_hand: 12, qty_committed: 2 },
}

export const IJ500_DAL_ZERO: ValidRow = {
    line: 10,
    data: { sku: 'IJ-500', warehouse: 'DAL', qty_on_hand: 0, qty_committed: 0 },
}

// The same rows after filterRows, with their location name (input for sumAvailable)

export const AB100_ATL_COMPLETE: CompleteRow = { ...AB100_ATL, warehouseName: ATLANTA }
export const AB100_ATL_DUPLICATE_COMPLETE: CompleteRow = { ...AB100_ATL_DUPLICATE, warehouseName: ATLANTA }
export const AB100_DAL_COMPLETE: CompleteRow = { ...AB100_DAL, warehouseName: DALLAS }
export const EF300_ATL_COMPLETE: CompleteRow = { ...EF300_ATL, warehouseName: ATLANTA }
export const IJ500_DAL_ZERO_COMPLETE: CompleteRow = { ...IJ500_DAL_ZERO, warehouseName: DALLAS }
