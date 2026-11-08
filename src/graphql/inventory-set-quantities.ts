// Sets absolute "available" quantities (not +/- adjustments), so re-running gives the same result.
//
// Variables:
//   idempotencyKey: unique string per call (required since API 2026-04), e.g. crypto.randomUUID()
//   input: {
//     name: "available",
//     reason: "correction",
//     quantities: [{ inventoryItemId, locationId, quantity, changeFromQuantity }]
//   }
//
// changeFromQuantity is required on every quantity: Shopify only applies the change if the
// current value still equals it (otherwise userErrors has CHANGE_FROM_QUANTITY_STALE).
// Pass the value read from Shopify, or null to skip the check.
export const INVENTORY_SET_QUANTITIES_MUTATION = `#graphql
    mutation InventorySetQuantities($input: InventorySetQuantitiesInput!, $idempotencyKey: String!) {
        inventorySetQuantities(input: $input) @idempotent(key: $idempotencyKey) {
            inventoryAdjustmentGroup {
                changes {
                    name
                    delta
                    quantityAfterChange
                    item {
                        id
                    }
                    location {
                        name
                    }
                }
            }
            userErrors {
                code
                field
                message
            }
        }
    }
`
