// Variants matching a search, with their inventory item and "available" stock at each location.
//
// Variables:
//   search: built with buildSkuSearch (src/helpers/sku-search.ts), e.g. 'sku:"AB-100" OR sku:"CD-200"'
//   after:  cursor for the next page (null for the first page)
export const VARIANTS_BY_SKU_QUERY = `#graphql
    query VariantsBySku($search: String!, $after: String) {
        productVariants(first: 100, query: $search, after: $after) {
            nodes {
                sku
                inventoryItem {
                    id
                    tracked
                    inventoryLevels(first: 20) {
                        nodes {
                            location {
                                id
                                name
                            }
                            quantities(names: ["available"]) {
                                name
                                quantity
                            }
                        }
                    }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
`
