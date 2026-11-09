import { useEffect, useState } from 'react'
import { Banner, BlockStack, Box, Button, Card, InlineStack, Layout, Page, Text } from '@shopify/polaris'
import { fetchLatestReport, runSync } from './api.ts'
import { ResultsTable } from './components/ResultsTable.tsx'
import { RunSummary } from './components/RunSummary.tsx'
import { SkippedRows } from './components/SkippedRows.tsx'
import type { RunMode, RunReport } from './types.ts'

const toMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Unknown error')

export default function App() {
  const [report, setReport] = useState<RunReport | null>(null)
  const [runningMode, setRunningMode] = useState<RunMode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLatestReport()
      .then(setReport)
      .catch((loadError: unknown) => setError(toMessage(loadError)))
  }, [])

  const handleRun = async (mode: RunMode) => {
    setRunningMode(mode)
    setError(null)
    try {
      setReport(await runSync(mode === 'dry-run'))
    } catch (runError: unknown) {
      setError(toMessage(runError))
    } finally {
      setRunningMode(null)
    }
  }

  const isRunning = runningMode !== null

  return (
    <Box paddingBlockEnd="1600">
      <Page title="Inventory sync" subtitle="ERP export → Shopify">
        <Layout>
          <Layout.Section>
            <Card>
              <InlineStack gap="300">
                <Button
                  onClick={() => void handleRun('dry-run')}
                  loading={runningMode === 'dry-run'}
                  disabled={isRunning}
                >
                  Start dry run
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void handleRun('apply')}
                  loading={runningMode === 'apply'}
                  disabled={isRunning}
                >
                  Apply to Shopify
                </Button>
              </InlineStack>
            </Card>
          </Layout.Section>

          {error !== null && (
            <Layout.Section>
              <Banner tone="critical" title="Something went wrong" onDismiss={() => setError(null)}>
                <p>{error}</p>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            {report === null ? (
              <Card>
                <Text as="p" tone="subdued">
                  No runs yet. Start a dry run to see the results.
                </Text>
              </Card>
            ) : (
              <BlockStack gap="400">
                <RunSummary report={report} />
                <ResultsTable results={report.results} />
                <SkippedRows rejected={report.rejected} ignored={report.ignored} />
              </BlockStack>
            )}
          </Layout.Section>
        </Layout>
      </Page>
    </Box>
  )
}
