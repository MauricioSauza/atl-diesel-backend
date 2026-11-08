// Builds the `search` variable for VARIANTS_BY_SKU_QUERY.
//   ['AB-100', 'CD-200', 'AB-100']  →  'sku:"AB-100" OR sku:"CD-200"'
// Duplicates are removed. Each SKU is quoted so spaces or special characters can't break the search.
// An empty list returns "": don't send that to Shopify, an empty search matches every variant.
export const buildSkuSearch = (skus: string[]): string => {
    const unique = [...new Set(skus)]
    return unique
        .map((sku) => `sku:"${sku.replace(/["\\]/g, '\\$&')}"`)
        .join(' OR ')
}
