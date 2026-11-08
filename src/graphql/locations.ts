// All store locations, to match ERP warehouse names (e.g. "Atlanta Warehouse") to Shopify location ids.
export const LOCATIONS_QUERY = `#graphql
    query Locations {
        locations(first: 50) {
            nodes {
                id
                name
            }
        }
    }
`
