import type { RejectedRow, ValidRow, WarehouseMap } from '../src/inputs.js'
import type { CompleteRow, IgnoredRow } from '../src/targets.js'
import type { Decision } from '../src/decision-stock.js'
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

export const UPDATE_DECISION: Decision = {
    sku: 'AB-100',
    location: DALLAS,
    oldValue: 5,
    newValue: 8,
    action: 'UPDATE',
    inventoryItemId: 'gid://shopify/InventoryItem/1',
    locationId: 'gid://shopify/Location/2',
}

export const UNCHANGED_DECISION: Decision = {
    sku: 'AB-100',
    location: ATLANTA,
    oldValue: 12,
    newValue: 12,
    action: 'UNCHANGED',
    inventoryItemId: 'gid://shopify/InventoryItem/1',
    locationId: 'gid://shopify/Location/1',
}

export const UNMATCHED_DECISION: Decision = {
    sku: 'ZZ-999',
    location: ATLANTA,
    oldValue: null,
    newValue: 4,
    action: 'UNMATCHED',
    inventoryItemId: null,
    locationId: null,
}

export const KL600_REJECTED: RejectedRow = {
    line: 11,
    raw: { sku: 'KL-600', warehouse: 'ATL', qty_on_hand: 'abc', qty_committed: '1' },
    reason: 'qty_on_hand: must be a whole number, 0 or more',
}

export const EF300_MIA_IGNORED: IgnoredRow = {
    ...EF300_MIA_UNMAPPED,
    reason: 'Warehouse "MIA" is not in the warehouse map',
}
