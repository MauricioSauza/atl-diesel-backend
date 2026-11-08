import type { ValidRow, WarehouseMap } from '../src/inputs.js'
import type { CompleteRow } from '../src/targets.js'
import type { ShopifyConfig } from '../src/shopify.js'

export const ATLANTA = 'Atlanta Warehouse'
export const DALLAS = 'Dallas Warehouse'

export const WAREHOUSES: WarehouseMap = { ATL: ATLANTA, DAL: DALLAS }

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

export const CD200_ATL_SECOND: ValidRow = {
    line: 12,
    data: { sku: 'CD-200', warehouse: 'ATL', qty_on_hand: 10, qty_committed: 2 },
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

export const AB100_ATL_COMPLETE: CompleteRow = { ...AB100_ATL, warehouseName: ATLANTA }
export const AB100_ATL_DUPLICATE_COMPLETE: CompleteRow = { ...AB100_ATL_DUPLICATE, warehouseName: ATLANTA }
export const AB100_DAL_COMPLETE: CompleteRow = { ...AB100_DAL, warehouseName: DALLAS }
export const CD200_ATL_OVERCOMMITTED_COMPLETE: CompleteRow = { ...CD200_ATL_OVERCOMMITTED, warehouseName: ATLANTA }
export const CD200_ATL_SECOND_COMPLETE: CompleteRow = { ...CD200_ATL_SECOND, warehouseName: ATLANTA }
export const EF300_ATL_COMPLETE: CompleteRow = { ...EF300_ATL, warehouseName: ATLANTA }
export const IJ500_DAL_ZERO_COMPLETE: CompleteRow = { ...IJ500_DAL_ZERO, warehouseName: DALLAS }

export const SHOPIFY_CONFIG: ShopifyConfig = {
    SHOPIFY_SHOP: 'test-shop',
    SHOPIFY_CLIENT_ID: 'test-client-id',
    SHOPIFY_CLIENT_SECRET: 'test-client-secret',
    SHOPIFY_API_VERSION: '2026-10',
}

export const OK_BODY = { data: { shop: { name: 'test-shop' } } }

export const THROTTLED_BODY = {
    errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }],
    extensions: {
        cost: {
            requestedQueryCost: 152,
            actualQueryCost: null,
            throttleStatus: { maximumAvailable: 2000, currentlyAvailable: 2, restoreRate: 100 },
        },
    },
}

export const UNDEFINED_FIELD_BODY = {
    errors: [{ message: "Field 'notAField' doesn't exist", extensions: { code: 'undefinedField' } }],
}
