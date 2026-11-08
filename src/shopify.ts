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

// ---------- Retry helpers ----------

const MAX_ATTEMPTS = 5

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// Exponential backoff: 1s, 2s, 4s, 8s
const backoffMs = (attempt: number): number => 1000 * 2 ** (attempt - 1)

// Throttled: wait exactly until Shopify has refilled enough points for this query.
// wait = (points needed - points left) / points refilled per second
const throttleWaitMs = (body: GraphqlResponse, attempt: number): number => {
    const cost = body.extensions?.cost
    if (cost === undefined) {
        return backoffMs(attempt)  // no numbers from Shopify: fall back to backoff
    }
    const missingPoints = cost.requestedQueryCost - cost.throttleStatus.currentlyAvailable
    const seconds = missingPoints / cost.throttleStatus.restoreRate
    return Math.max(seconds * 1000, 500)  // wait at least 0.5s
}

const waitBeforeRetry = async (reason: string, ms: number, attempt: number): Promise<void> => {
    console.warn(`  ${reason}: retrying in ${(ms / 1000).toFixed(1)}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})`)
    await sleep(ms)
}

// ---------- Client ----------

export const shopifyGraphqlClient = async (
    token: string,
    config: ShopifyConfig,
    query: string,
    variables: Record<string, unknown> = {},
): Promise<unknown> => {
    const url = `https://${config.SHOPIFY_SHOP}.myshopify.com/admin/api/${config.SHOPIFY_API_VERSION}/graphql.json`
    const request = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
        body: JSON.stringify({ query, variables }),  // same body on every retry (same idempotency key)
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const response = await fetch(url, request)

        // 429 = too many requests, 5xx = Shopify-side problem: both are temporary, so retry
        const temporary = response.status === 429 || response.status >= 500
        if (temporary && attempt < MAX_ATTEMPTS) {
            await waitBeforeRetry(`HTTP ${response.status}`, backoffMs(attempt), attempt)
            continue
        }

        if (!response.ok) {
            throw new Error(`Shopify HTTP ${response.status}: ${await response.text()}`)
        }

        const body = await response.json() as GraphqlResponse

        // Throttled comes back as HTTP 200 with an error code
        const throttled = body.errors?.some((e) => e.extensions?.code === 'THROTTLED') ?? false
        if (throttled && attempt < MAX_ATTEMPTS) {
            await waitBeforeRetry('Throttled', throttleWaitMs(body, attempt), attempt)
            continue
        }

        // Any other error is not temporary: retrying would not help
        if (body.errors) {
            const messages = body.errors.map((e) => e.extensions?.code ? `${e.extensions.code}: ${e.message}` : e.message)
            throw new Error(`Shopify GraphQL errors: ${messages.join('; ')}`)
        }

        return body.data
    }

    throw new Error(`Shopify request failed after ${MAX_ATTEMPTS} attempts`)
}

