import { Badge, Card, DataTable, Text } from '@shopify/polaris'
import type { BadgeProps } from '@shopify/polaris'
import type { Action, ResultRow } from '../types.ts'

interface ResultsTableProps {
  results: ResultRow[]
}

const ACTION_TONE: Record<Action, BadgeProps['tone']> = {
  UPDATE: 'attention',
  UNCHANGED: undefined,
  UNMATCHED: 'warning',
}

export function ResultsTable({ results }: ResultsTableProps) {
  const rows = results.map((result) => [
    result.sku,
    result.location,
    result.oldValue ?? '–',
    result.newValue,
    <Badge key={`${result.sku}-${result.location}`} tone={ACTION_TONE[result.action]}>{result.action}</Badge>,
  ])

  return (
    <Card padding="0">
      <div style={{ padding: 'var(--p-space-400)' }}>
        <Text as="h2" variant="headingMd">
          Results per SKU and location
        </Text>
      </div>
      <DataTable
        columnContentTypes={['text', 'text', 'numeric', 'numeric', 'text']}
        headings={['SKU', 'Location', 'Old value', 'New value', 'Action']}
        rows={rows}
      />
    </Card>
  )
}
