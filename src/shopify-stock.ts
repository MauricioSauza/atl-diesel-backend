import { z } from 'zod'
import { shopifyGraphqlClient, type ShopifyConfig } from './shopify.js'
import { VARIANTS_BY_SKU_QUERY } from './graphql/variants.js'
import { buildSkuSearch } from './helpers/sku-search.js'

// ---------- Result shape: one row per SKU + location ----------

export interface ShopifyStockRow {
    sku: string
    location: string          // e.g. "Atlanta Warehouse"
    available: number
    inventoryItemId: string   // needed later to write updates
    locationId: string        // needed later to write updates
}

// ---------- Response validation (mirrors VARIANTS_BY_SKU_QUERY) ----------

const VariantSchema = z.object({
    sku: z.string().nullable(),
    inventoryItem: z.object({
        id: z.string(),
        tracked: z.boolean(),
        inventoryLevels: z.object({
            nodes: z.array(z.object({
                location: z.object({ id: z.string(), name: z.string() }),
                quantities: z.array(z.object({ name: z.string(), quantity: z.number() })),
            })),
        }),
    }),
})

const VariantsPageSchema = z.object({
    productVariants: z.object({
        nodes: z.array(VariantSchema),
        pageInfo: z.object({
            hasNextPage: z.boolean(),
            endCursor: z.string().nullable(),
        }),
    }),
})

type Variant = z.infer<typeof VariantSchema>

// ---------- Turn Shopify's nested answer into flat rows (pure, no API calls) ----------

export const buildCurrentStock = (variants: Variant[]): ShopifyStockRow[] => {
    const rows: ShopifyStockRow[] = []

    for (const variant of variants) {
        if (variant.sku === null) {
            continue  // variants without a SKU can't match the ERP
        }

        for (const level of variant.inventoryItem.inventoryLevels.nodes) {
            const quantity = level.quantities[0]  // we only asked for "available"
            if (quantity === undefined) {
                continue
            }

            rows.push({
                sku: variant.sku.trim().toUpperCase(),
                location: level.location.name,
                available: quantity.quantity,
                inventoryItemId: variant.inventoryItem.id,
                locationId: level.location.id,
            })
        }
    }

    return rows
}

// ---------- Fetch from Shopify ----------

export const fetchCurrentStock = async (
    token: string,
    config: ShopifyConfig,
    skus: string[],
): Promise<ShopifyStockRow[]> => {
    // An empty search would return every variant in the store
    if (skus.length === 0) {
        return []
    }

    const search = buildSkuSearch(skus)
    const variants: Variant[] = []
    let after: string | null = null

    // Follow pages until Shopify says there are no more
    do {
        const data = await shopifyGraphqlClient(token, config, VARIANTS_BY_SKU_QUERY, { search, after })
        const page = VariantsPageSchema.parse(data).productVariants

        variants.push(...page.nodes)
        after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null
    } while (after !== null)

    return buildCurrentStock(variants)
}
