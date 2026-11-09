import { randomUUID } from 'node:crypto'
import { getAccessToken, loadShopifyConfig, shopifyGraphqlClient } from '../shopify.js'
import { fetchCurrentStock } from '../shopify-stock.js'
import type { SetQuantitiesResult } from '../apply-updates.js'
import { INVENTORY_SET_QUANTITIES_MUTATION } from '../graphql/inventory-set-quantities.js'

const STARTING_STOCK = [
    { sku: 'AB-100', location: 'Atlanta Warehouse', quantity: 12 },
    { sku: 'AB-100', location: 'Dallas Warehouse', quantity: 5 },
    { sku: 'CD-200', location: 'Atlanta Warehouse', quantity: 2 },
    { sku: 'CD-200', location: 'Dallas Warehouse', quantity: 0 },
    { sku: 'EF-300', location: 'Atlanta Warehouse', quantity: 16 },
    { sku: 'EF-300', location: 'Dallas Warehouse', quantity: 0 },
    { sku: 'GH-400', location: 'Atlanta Warehouse', quantity: 0 },
    { sku: 'GH-400', location: 'Dallas Warehouse', quantity: 10 },
    { sku: 'IJ-500', location: 'Atlanta Warehouse', quantity: 0 },
    { sku: 'IJ-500', location: 'Dallas Warehouse', quantity: 3 },
]

const resetStock = async (): Promise<void> => {
    const config = loadShopifyConfig()
    const token = await getAccessToken(config)
    const stock = await fetchCurrentStock(token, config, STARTING_STOCK.map((entry) => entry.sku))

    const quantities = STARTING_STOCK.map((entry) => {
        const row = stock.find((current) => current.sku === entry.sku && current.location === entry.location)
        if (row === undefined) {
            throw new Error(`${entry.sku} at ${entry.location} not found in Shopify`)
        }
        return {
            inventoryItemId: row.inventoryItemId,
            locationId: row.locationId,
            quantity: entry.quantity,
            changeFromQuantity: null,
        }
    })

    const data = await shopifyGraphqlClient(token, config, INVENTORY_SET_QUANTITIES_MUTATION, {
        idempotencyKey: randomUUID(),
        input: { name: 'available', reason: 'correction', quantities },
    }) as SetQuantitiesResult

    const errors = data.inventorySetQuantities.userErrors
    if (errors.length > 0) {
        throw new Error(`Shopify rejected the reset: ${errors.map((error) => error.message).join('; ')}`)
    }

    console.info(`Reset ${quantities.length} quantities to the starting stock:`)
    for (const entry of STARTING_STOCK) {
        console.info(`  ${entry.sku}  ${entry.location.padEnd(18)} ${entry.quantity}`)
    }
}

resetStock().catch((error: unknown) => {
    console.error('Reset failed:', error)
    process.exitCode = 1
})
