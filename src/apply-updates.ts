import { randomUUID } from 'node:crypto'
import type { Decision } from './decision-stock.js'
import { shopifyGraphqlClient, type ShopifyConfig } from './shopify.js'
import { INVENTORY_SET_QUANTITIES_MUTATION } from './graphql/inventory-set-quantities.js'

export interface SetQuantitiesResult {
    inventorySetQuantities: {
        userErrors: { code: string | null, message: string }[]
    }
}

export const applyUpdates = async (
    token: string,
    config: ShopifyConfig,
    decisions: Decision[],
): Promise<number> => {
    const updates = decisions.filter((decision) => decision.action === 'UPDATE')

    if (updates.length === 0) {
        return 0
    }

    const negative = updates.find((update) => update.newValue < 0)
    if (negative) {
        throw new Error(`Refusing to write a negative quantity: ${negative.sku} at ${negative.location} = ${negative.newValue}`)
    }

    const quantities = updates.map((update) => ({
        inventoryItemId: update.inventoryItemId,
        locationId: update.locationId,
        quantity: update.newValue,     
        changeFromQuantity: update.oldValue,
    }))

    const data = await shopifyGraphqlClient(token, config, INVENTORY_SET_QUANTITIES_MUTATION, {
        idempotencyKey: randomUUID(),
        input: {
            name: 'available',
            reason: 'correction',
            quantities,
        },
    }) as SetQuantitiesResult

    const errors = data.inventorySetQuantities.userErrors
    if (errors.length > 0) {
        const messages = errors.map((error) => `${error.code ?? 'ERROR'}: ${error.message}`)
        throw new Error(`Shopify rejected the update: ${messages.join('; ')}`)
    }

    return updates.length
}
