import { z } from 'zod'

// ---------- Config (.env) ----------

const required = z.string({ error: 'is required' }).trim().min(1, 'is required')

const ConfigSchema = z.object({
    SHOPIFY_SHOP: required.regex(/^[a-z0-9-]+$/, 'must be the subdomain only, without .myshopify.com'),
    SHOPIFY_CLIENT_ID: required,
    SHOPIFY_CLIENT_SECRET: required,
    SHOPIFY_API_VERSION: required.regex(/^\d{4}-\d{2}$/, 'must look like 2026-10'),
})

export type ShopifyConfig = z.infer<typeof ConfigSchema>

export const loadShopifyConfig = (): ShopifyConfig => {
    const result = ConfigSchema.safeParse(process.env)
    if (!result.success) {
        throw new Error(`Invalid Shopify config in .env\n${z.prettifyError(result.error)}`)
    }
    return result.data
}

// ---------- Access token (client credentials grant) ----------

const TokenResponseSchema = z.object({
    access_token: z.string().min(1),
})

export const getAccessToken = async (config: ShopifyConfig): Promise<string> => {
    const url = `https://${config.SHOPIFY_SHOP}.myshopify.com/admin/oauth/access_token`

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: config.SHOPIFY_CLIENT_ID,
            client_secret: config.SHOPIFY_CLIENT_SECRET,
        }),
    })

    if (!response.ok) {
        throw new Error(`Shopify token request failed: ${response.status} ${await response.text()}`)
    }

    const body: unknown = await response.json()
    return TokenResponseSchema.parse(body).access_token
}

// ---------- GraphQL ----------

// Shopify's rate-limit budget, sent back with every response
interface ThrottleStatus {
    maximumAvailable: number    // size of the bucket (points)
    currentlyAvailable: number  // points left right now
    restoreRate: number         // points refilled per second
}

interface GraphqlError {
    message: string
    extensions?: { code?: string }  // e.g. 'THROTTLED' when we ran out of points
}

interface GraphqlResponse {
    data?: unknown
    errors?: GraphqlError[]
    extensions?: {
        cost?: {
            requestedQueryCost: number
            actualQueryCost: number | null
            throttleStatus: ThrottleStatus
        }
    }
}

export const shopifyGraphqlClient = async (
    token: string, 
    config: ShopifyConfig,
    query: string, 
    variables: Record<string, unknown> = {}, 
): Promise<unknown> => {
    const response = await fetch(`https://${config.SHOPIFY_SHOP}.myshopify.com/admin/api/${config.SHOPIFY_API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token} ,
        body: JSON.stringify({ query, variables })
    })

    if (!response.ok) {
        throw new Error(`Shopify HTTP ${response.status}: ${await response.text()}`)
    }

    const body = await response.json() as GraphqlResponse
    if (body.errors) {
        const messages = body.errors.map((e) => e.extensions?.code ? `${e.extensions.code}: ${e.message}` : e.message)
        throw new Error(`Shopify GraphQL errors: ${messages.join('; ')}`)
    }

    return body.data
}

