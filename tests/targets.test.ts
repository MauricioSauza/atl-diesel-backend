import { computeTargets, filterRows, sumAvailable } from '../src/targets.js'
import {
    AB100_ATL,
    AB100_ATL_COMPLETE,
    AB100_ATL_DUPLICATE,
    AB100_ATL_DUPLICATE_COMPLETE,
    AB100_DAL,
    AB100_DAL_COMPLETE,
    ATLANTA,
    CD200_ATL_OVERCOMMITTED,
    CD200_ATL_OVERCOMMITTED_COMPLETE,
    CD200_ATL_SECOND_COMPLETE,
    DALLAS,
    EF300_ATL,
    EF300_ATL_COMPLETE,
    EF300_MIA_UNMAPPED,
    GH400_DAL,
    IJ500_DAL_ZERO,
    IJ500_DAL_ZERO_COMPLETE,
    WAREHOUSES,
} from './constants.js'

describe('filterRows', () => {
    it.each([
        { row: AB100_ATL, warehouseName: ATLANTA },
        { row: GH400_DAL, warehouseName: DALLAS },
    ])('keeps a row from $row.data.warehouse and adds "$warehouseName"', ({ row, warehouseName }) => {
        const rows = [row]

        const result = filterRows(rows, WAREHOUSES)

        expect(result.valid).toEqual([{ ...row, warehouseName }])
        expect(result.ignored).toEqual([])
    })

    it('ignores a row whose warehouse is not in the map, with a reason', () => {
        const rows = [EF300_MIA_UNMAPPED]

        const result = filterRows(rows, WAREHOUSES)

        expect(result.valid).toEqual([])
        expect(result.ignored).toEqual([
            { ...EF300_MIA_UNMAPPED, reason: 'Warehouse "MIA" is not in the warehouse map' },
        ])
    })

    it('splits a mixed list and keeps the original order', () => {
        const rows = [AB100_ATL, EF300_MIA_UNMAPPED, GH400_DAL]

        const result = filterRows(rows, WAREHOUSES)

        expect(result.valid.map((row) => row.line)).toEqual([2, 8])
        expect(result.ignored.map((row) => row.line)).toEqual([7])
    })

    it('ignores every row when the map is empty', () => {
        const rows = [AB100_ATL, GH400_DAL]

        const result = filterRows(rows, {})

        expect(result.valid).toEqual([])
        expect(result.ignored).toHaveLength(2)
    })

    it('returns empty lists for no rows', () => {
        const result = filterRows([], WAREHOUSES)

        expect(result).toEqual({ valid: [], ignored: [] })
    })
})

describe('sumAvailable', () => {
    it.each([
        { name: 'on hand minus committed', row: AB100_ATL_COMPLETE, available: 8 },
        { name: 'nothing committed', row: AB100_DAL_COMPLETE, available: 8 },
        { name: 'zero stock is kept as 0', row: IJ500_DAL_ZERO_COMPLETE, available: 0 },
    ])('single row: $name', ({ row, available }) => {
        const result = sumAvailable([row])

        expect(result).toEqual([
            {
                lines: [row.line],
                data: { ...row.data, available },
                warehouseName: row.warehouseName,
            },
        ])
    })

    it('sums rows with the same SKU and warehouse (rule 2)', () => {
        const rows = [AB100_ATL_COMPLETE, AB100_ATL_DUPLICATE_COMPLETE]

        const result = sumAvailable(rows)

        expect(result).toEqual([
            {
                lines: [2, 3],
                data: { sku: 'AB-100', warehouse: 'ATL', qty_on_hand: 15, qty_committed: 3, available: 12 },
                warehouseName: ATLANTA,
            },
        ])
    })

    it.each([
        { name: 'same SKU in different warehouses', rows: [AB100_ATL_COMPLETE, AB100_DAL_COMPLETE] },
        { name: 'different SKUs in the same warehouse', rows: [AB100_ATL_COMPLETE, EF300_ATL_COMPLETE] },
    ])('keeps $name as separate targets', ({ rows }) => {
        const result = sumAvailable(rows)

        expect(result).toHaveLength(2)
    })

    it('does not change the input rows', () => {
        const rows = [AB100_ATL_COMPLETE, AB100_ATL_DUPLICATE_COMPLETE]

        sumAvailable(rows)

        expect(AB100_ATL_COMPLETE.data).toEqual(AB100_ATL.data)
        expect(AB100_ATL_COMPLETE.line).toBe(2)
    })

    it('returns an empty list for no rows', () => {
        expect(sumAvailable([])).toEqual([])
    })

    it('rule 3: committed greater than on hand gives available 0, not negative', () => {
        const rows = [CD200_ATL_OVERCOMMITTED_COMPLETE]

        const result = sumAvailable(rows)

        expect(result[0]!.data).toMatchObject({ qty_on_hand: 3, qty_committed: 5, available: 0 })
    })

    it('rule 2+3: sums on hand and committed first, then clamps once (6, not 8)', () => {
        const rows = [CD200_ATL_OVERCOMMITTED_COMPLETE, CD200_ATL_SECOND_COMPLETE]

        const result = sumAvailable(rows)

        expect(result).toHaveLength(1)
        expect(result[0]!.data).toMatchObject({ qty_on_hand: 13, qty_committed: 7, available: 6 })
        expect(result[0]!.lines).toEqual([5, 12])
    })
})

describe('computeTargets', () => {
    it('produces the expected targets for the sample export', () => {
        const rows = [
            AB100_ATL,
            AB100_ATL_DUPLICATE,
            AB100_DAL,
            CD200_ATL_OVERCOMMITTED,
            EF300_ATL,
            EF300_MIA_UNMAPPED,
            GH400_DAL,
            IJ500_DAL_ZERO,
        ]

        const result = computeTargets(rows, WAREHOUSES)

        const summary = result.targets.map((row) => [row.data.sku, row.warehouseName, row.data.available])
        expect(summary).toEqual([
            ['AB-100', ATLANTA, 12],
            ['AB-100', DALLAS, 8],
            ['CD-200', ATLANTA, 0],
            ['EF-300', ATLANTA, 16],
            ['GH-400', DALLAS, 10],
            ['IJ-500', DALLAS, 0],
        ])
        expect(result.ignoredRows.map((row) => row.line)).toEqual([7])
    })

    it('returns empty lists for no rows', () => {
        expect(computeTargets([], WAREHOUSES)).toEqual({ targets: [], ignoredRows: [] })
    })

})
