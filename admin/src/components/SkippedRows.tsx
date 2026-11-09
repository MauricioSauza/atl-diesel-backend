import { Card, DataTable, Text } from '@shopify/polaris'
import type { IgnoredRow, RejectedRow } from '../types.ts'

interface SkippedRowsProps {
  rejected: RejectedRow[]
  ignored: IgnoredRow[]
}

export function SkippedRows({ rejected, ignored }: SkippedRowsProps) {
  const rows = [
    ...rejected.map((row) => [String(row.line), 'Rejected', row.reason]),
    ...ignored.map((row) => [String(row.line), 'Ignored', `${row.sku} at ${row.warehouse}: ${row.reason}`]),
  ]

  if (rows.length === 0) {
    return null
  }

  return (
    <Card padding="0">
      <div style={{ padding: 'var(--p-space-400)' }}>
        <Text as="h2" variant="headingMd">
          Rejected and ignored rows
        </Text>
      </div>
      <DataTable
        columnContentTypes={['text', 'text', 'text']}
        headings={['CSV line', 'Status', 'Reason']}
        rows={rows}
      />
    </Card>
  )
}
