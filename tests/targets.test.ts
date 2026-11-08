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
        // Arrange
        const rows = [row]

        // Act
        const result = filterRows(rows, WAREHOUSES)

        // Assert
        expect(result.valid).toEqual([{ ...row, warehouseName }])
        expect(result.ignored).toEqual([])
    })

    it('ignores a row whose warehouse is not in the map, with a reason', () => {
        // Arrange
        const rows = [EF300_MIA_UNMAPPED]

        // Act
        const result = filterRows(rows, WAREHOUSES)

        // Assert
        expect(result.valid).toEqual([])
        expect(result.ignored).toEqual([
            { ...EF300_MIA_UNMAPPED, reason: 'Warehouse "MIA" is not in the warehouse map' },
        ])
    })

    it('splits a mixed list and keeps the original order', () => {
        // Arrange
        const rows = [AB100_ATL, EF300_MIA_UNMAPPED, GH400_DAL]

        // Act
        const result = filterRows(rows, WAREHOUSES)

        // Assert
        expect(result.valid.map((row) => row.line)).toEqual([2, 8])
        expect(result.ignored.map((row) => row.line)).toEqual([7])
    })

    it('ignores every row when the map is empty', () => {
        // Arrange
        const rows = [AB100_ATL, GH400_DAL]

        // Act
        const result = filterRows(rows, {})

        // Assert
        expect(result.valid).toEqual([])
        expect(result.ignored).toHaveLength(2)
    })

    it('returns empty lists for no rows', () => {
        // Act
        const result = filterRows([], WAREHOUSES)

        // Assert
        expect(result).toEqual({ valid: [], ignored: [] })
    })
})

describe('sumAvailable', () => {
    it.each([
        { name: 'on hand minus committed', row: AB100_ATL_COMPLETE, available: 8 },
        { name: 'nothing committed', row: AB100_DAL_COMPLETE, available: 8 },
        { name: 'zero stock is kept as 0', row: IJ500_DAL_ZERO_COMPLETE, available: 0 },
    ])('single row: $name', ({ row, available }) => {
        // Act
        const result = sumAvailable([row])

        // Assert
        expect(result).toEqual([
            {
                lines: [row.line],
                data: { ...row.data, available },
                warehouseName: row.warehouseName,
            },
        ])
    })

    it('sums rows with the same SKU and warehouse (rule 2)', () => {
        // Arrange: AB-100 ATL appears on lines 2 (10/2) and 3 (5/1)
        const rows = [AB100_ATL_COMPLETE, AB100_ATL_DUPLICATE_COMPLETE]

        // Act
        const result = sumAvailable(rows)

        // Assert
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
        // Act
        const result = sumAvailable(rows)

        // Assert
        expect(result).toHaveLength(2)
    })

    it('does not change the input rows', () => {
        // Arrange
        const rows = [AB100_ATL_COMPLETE, AB100_ATL_DUPLICATE_COMPLETE]

        // Act
        sumAvailable(rows)

        // Assert
        expect(AB100_ATL_COMPLETE.data).toEqual(AB100_ATL.data)
        expect(AB100_ATL_COMPLETE.line).toBe(2)
    })

    it('returns an empty list for no rows', () => {
        expect(sumAvailable([])).toEqual([])
    })

    // Waiting for the answer on rule 3 (available never below 0)
    it.todo('rule 3: committed greater than on hand gives available 0 (CD-200 ATL 3/5)')
    it.todo('rule 2+3: sums duplicates before applying the floor (3/5 + 10/2 gives 6, not 8)')
})

describe('computeTargets', () => {
    it('produces the expected targets for the sample export', () => {
        // Arrange: every valid row from data/erp_export.csv (line 11 is rejected earlier)
        const rows = [
            AB100_ATL,
            AB100_ATL_DUPLICATE,
            AB100_DAL,
            EF300_ATL,
            EF300_MIA_UNMAPPED,
            GH400_DAL,
            IJ500_DAL_ZERO,
        ]

        // Act
        const result = computeTargets(rows, WAREHOUSES)

        // Assert
        const summary = result.targets.map((row) => [row.data.sku, row.warehouseName, row.data.available])
        expect(summary).toEqual([
            ['AB-100', ATLANTA, 12],
            ['AB-100', DALLAS, 8],
            ['EF-300', ATLANTA, 16],
            ['GH-400', DALLAS, 10],
            ['IJ-500', DALLAS, 0],
        ])
        expect(result.ignoredRows.map((row) => row.line)).toEqual([7])
    })

    it('returns empty lists for no rows', () => {
        expect(computeTargets([], WAREHOUSES)).toEqual({ targets: [], ignoredRows: [] })
    })

    // CD200_ATL_OVERCOMMITTED is left out of the sample test until rule 3 is decided
    it.todo(`includes ${CD200_ATL_OVERCOMMITTED.data.sku} ATL with available 0 once rule 3 is decided`)
})
