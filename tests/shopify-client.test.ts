import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { shopifyGraphqlClient } from '../src/shopify.js'
import { OK_BODY, SHOPIFY_CONFIG, THROTTLED_BODY, UNDEFINED_FIELD_BODY } from './constants.js'

const QUERY = '{ shop { name } }'
const realFetch = globalThis.fetch
const fetchMock = jest.fn<typeof fetch>()

const jsonResponse = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status })

describe('shopifyGraphqlClient', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        globalThis.fetch = fetchMock
    })

    afterEach(() => {
        jest.useRealTimers()
        jest.restoreAllMocks()
        fetchMock.mockReset()
        globalThis.fetch = realFetch
    })

    it('returns data on the first try', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(OK_BODY))

        const result = shopifyGraphqlClient('token', SHOPIFY_CONFIG, QUERY)
        await jest.runAllTimersAsync()

        await expect(result).resolves.toEqual(OK_BODY.data)
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('waits the time computed from Shopify cost when throttled, then retries', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(THROTTLED_BODY))
            .mockResolvedValueOnce(jsonResponse(OK_BODY))

        const result = shopifyGraphqlClient('token', SHOPIFY_CONFIG, QUERY)
        await jest.runAllTimersAsync()

        await expect(result).resolves.toEqual(OK_BODY.data)
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(console.warn).toHaveBeenCalledWith('  Throttled: retrying in 1.5s (attempt 2/5)')
    })

    it.each([429, 503])('retries HTTP %i with backoff', async (status) => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse({}, status))
            .mockResolvedValueOnce(jsonResponse(OK_BODY))

        const result = shopifyGraphqlClient('token', SHOPIFY_CONFIG, QUERY)
        await jest.runAllTimersAsync()

        await expect(result).resolves.toEqual(OK_BODY.data)
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(console.warn).toHaveBeenCalledWith(`  HTTP ${status}: retrying in 1.0s (attempt 2/5)`)
    })

    it('gives up after 5 throttled attempts', async () => {
        fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(THROTTLED_BODY)))

        const result = shopifyGraphqlClient('token', SHOPIFY_CONFIG, QUERY)
        const assertion = expect(result).rejects.toThrow('THROTTLED')
        await jest.runAllTimersAsync()

        await assertion
        expect(fetchMock).toHaveBeenCalledTimes(5)
    })

    it('does not retry other GraphQL errors', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(UNDEFINED_FIELD_BODY))

        const result = shopifyGraphqlClient('token', SHOPIFY_CONFIG, QUERY)
        const assertion = expect(result).rejects.toThrow('undefinedField')
        await jest.runAllTimersAsync()

        await assertion
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('does not retry other HTTP errors', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({}, 401))

        const result = shopifyGraphqlClient('token', SHOPIFY_CONFIG, QUERY)
        const assertion = expect(result).rejects.toThrow('HTTP 401')
        await jest.runAllTimersAsync()

        await assertion
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})
