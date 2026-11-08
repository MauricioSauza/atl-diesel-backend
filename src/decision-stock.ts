import type { AvailableRow } from './targets.js'
import type { ShopifyStockRow } from './shopify-stock.js'

export type Action = 'UPDATE' | 'UNCHANGED' | 'UNMATCHED'

export interface Decision {
    sku: string
    location: string
    oldValue: number | null
    newValue: number
    action: Action
    inventoryItemId: string | null
    locationId: string | null
}

export const decisionStock = (targets: AvailableRow[], stock: ShopifyStockRow[]): Decision[] => {
    const decisions: Decision[] = []

    for (const target of targets) {
        const sku = target.data.sku
        const location = target.warehouseName
        const newValue = target.data.available

        const current = stock.find((row) => row.sku === sku && row.location === location)

        if (current === undefined) {
            decisions.push({
                sku,
                location,
                oldValue: null,
                newValue,
                action: 'UNMATCHED',
                inventoryItemId: null,
                locationId: null,
            })
            continue
        }

        const action = current.available === newValue ? 'UNCHANGED' : 'UPDATE'

        decisions.push({
            sku,
            location,
            oldValue: current.available,
            newValue,
            action,
            inventoryItemId: current.inventoryItemId,
            locationId: current.locationId,
        })
    }

    return decisions
}
