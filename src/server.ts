import { execFile } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { promisify } from 'node:util'
import express, { type Request, type Response } from 'express'
import { z } from 'zod'
import type { RunReport } from './report.js'

const PORT = 3001
const LATEST_REPORT_PATH = 'reports/latest.json'

const execFileAsync = promisify(execFile)

const SyncRequestSchema = z.object({
  dryRun: z.boolean(),
})

interface ErrorBody {
  error: string
}

let syncRunning = false

const readLatestReport = (): RunReport => JSON.parse(readFileSync(LATEST_REPORT_PATH, 'utf8')) as RunReport

const latestReportTime = (): number | null =>
  existsSync(LATEST_REPORT_PATH) ? statSync(LATEST_REPORT_PATH).mtimeMs : null

const getReport = (_req: Request, res: Response<RunReport | ErrorBody>): void => {
  if (!existsSync(LATEST_REPORT_PATH)) {
    res.status(404).json({ error: 'No runs yet' })
    return
  }
  res.json(readLatestReport())
}

const postSync = async (req: Request, res: Response<RunReport | ErrorBody>): Promise<void> => {
  const body = SyncRequestSchema.safeParse(req.body)
  if (!body.success) {
    res.status(400).json({ error: 'Body must be { "dryRun": true | false }' })
    return
  }

  if (syncRunning) {
    res.status(409).json({ error: 'A sync is already running' })
    return
  }

  syncRunning = true
  const reportTimeBefore = latestReportTime()
  const args = body.data.dryRun ? ['run', 'sync', '--', '--dry-run'] : ['run', 'sync']

  try {
    await execFileAsync('npm', args)
  } catch (error: unknown) {
    console.error('Sync process failed:', error instanceof Error ? error.message : error)
  } finally {
    syncRunning = false
  }

  if (latestReportTime() === reportTimeBefore) {
    res.status(500).json({ error: 'The sync failed before writing a report. Check the server logs.' })
    return
  }

  res.json(readLatestReport())
}

const app = express()
app.use(express.json())
app.get('/api/report', getReport)
app.post('/api/sync', postSync)

app.listen(PORT, () => {
  console.info(`Admin API listening on http://localhost:${PORT}`)
})
