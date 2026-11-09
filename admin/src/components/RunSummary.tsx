import { Badge, BlockStack, Card, InlineStack, Text } from '@shopify/polaris'
import type { RunCounts, RunReport } from '../types.ts'

interface RunSummaryProps {
  report: RunReport
}

interface CountItem {
  label: string
  key: keyof RunCounts
}

const COUNT_ITEMS: CountItem[] = [
  { label: 'Update', key: 'UPDATE' },
  { label: 'Unchanged', key: 'UNCHANGED' },
  { label: 'Unmatched', key: 'UNMATCHED' },
  { label: 'Rejected', key: 'rejected' },
  { label: 'Ignored', key: 'ignored' },
]

export function RunSummary({ report }: RunSummaryProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack gap="200" blockAlign="center">
          <Text as="h2" variant="headingMd">
            Last run
          </Text>
          <Badge tone={report.mode === 'apply' ? 'info' : undefined}>
            {report.mode === 'apply' ? 'Applied' : 'Dry run'}
          </Badge>
          <Badge tone={report.status === 'success' ? 'success' : 'critical'}>
            {report.status === 'success' ? 'Success' : 'Failed'}
          </Badge>
        </InlineStack>

        <Text as="p" tone="subdued">
          {new Date(report.ranAt).toLocaleString()}
        </Text>

        {report.error !== null && (
          <Text as="p" tone="critical">
            {report.error}
          </Text>
        )}

        <InlineStack gap="800">
          {COUNT_ITEMS.map((item) => (
            <BlockStack key={item.key} gap="100">
              <Text as="span" tone="subdued">
                {item.label}
              </Text>
              <Text as="span" variant="headingLg">
                {String(report.counts[item.key])}
              </Text>
            </BlockStack>
          ))}
        </InlineStack>
      </BlockStack>
    </Card>
  )
}
